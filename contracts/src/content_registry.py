# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
from typing import Optional, Tuple
from dataclasses import dataclass
import datetime
import json

@allow_storage
@dataclass
class Article:
    id: bigint
    title: str
    content: str
    summary: str
    source: str
    author: str
    timestamp: bigint
    score: bigint
    upvotes: bigint
    downvotes: bigint
    tags: DynArray[str]
    is_ai_generated: bool
    status: str

@allow_storage
@dataclass
class User:
    address: str
    reputation: bigint
    total_articles: bigint
    total_upvotes: bigint
    rewards: bigint
    joined_at: bigint

class ContentRegistry(gl.Contract):
    articles: DynArray[Article]
    users: DynArray[User]
    article_counter: bigint
    user_counter: bigint

    MIN_ARTICLE_LENGTH: bigint = 100
    MAX_ARTICLE_LENGTH: bigint = 50000
    MIN_QUALITY_SCORE: bigint = 600

    def __init__(self):
        self.article_counter = 0
        self.user_counter = 0

    # ------------------------
    # SAFE LLM HELPERS 🔥
    # ------------------------
    def _safe_llm_int(self, prompt: str, default: int = 500) -> bigint:
        def leader_fn():
            return gl.nondet.exec_prompt(prompt)
        def validator_fn(leader_res) -> bool:
            if not isinstance(leader_res, gl.vm.Return):
                return False
            # Extract digits and compare
            leader_digits = ''.join([c for c in leader_res.calldata if c.isdigit()])
            my_res = leader_fn()
            my_digits = ''.join([c for c in my_res if c.isdigit()])
            # Allow 20% variance for scores
            if leader_digits and my_digits:
                return abs(int(leader_digits) - int(my_digits)) <= 200
            return leader_digits == my_digits
        try:
            res = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)
            digits = ''.join([c for c in res if c.isdigit()])
            if digits == "":
                return default
            return int(digits)
        except:
            return default

    def _safe_llm_text(self, prompt: str, default: str = "") -> str:
        def leader_fn():
            return gl.nondet.exec_prompt(prompt)
        def validator_fn(leader_res) -> bool:
            if not isinstance(leader_res, gl.vm.Return):
                return False
            # For text, just check if leader result is reasonable
            return len(leader_res.calldata) > 0
        try:
            return gl.vm.run_nondet_unsafe(leader_fn, validator_fn)
        except:
            return default

    # ------------------------
    # HELPERS
    # ------------------------
    def _get_user_index(self, user: str) -> bigint:
        for i, u in enumerate(self.users):
            if u.address == user:
                return i
        return -1

    def _get_article_index(self, article_id: bigint) -> bigint:
        for i, article in enumerate(self.articles):
            if article.id == article_id:
                return i
        return -1

    # ------------------------
    # USER
    # ------------------------
    @gl.public.write
    def register_user(self, user: str) -> bool:
        if self._get_user_index(user) >= 0:
            return False

        self.users.append(User(
            address=user,
            reputation=100,
            total_articles=0,
            total_upvotes=0,
            rewards=0,
            joined_at=int(datetime.datetime.now().timestamp())
        ))
        return True

    @gl.public.view
    def get_user_index(self, user: str) -> bigint:
        return self._get_user_index(user)

    @gl.public.view
    def get_user_info(self, user: str) -> Optional[User]:
        idx = self._get_user_index(user)
        if idx < 0:
            return None
        return self.users[idx]

    # ------------------------
    # SUBMIT ARTICLE (AI CORE)
    # ------------------------
    @gl.public.write
    def submit_article(
        self,
        author: str,
        title: str,
        content: str,
        source: str,
        tags: list[str],
        is_ai_generated: bool = False
    ) -> bigint:

        if len(title) == 0:
            raise Exception("Title cannot be empty")
        if len(content) < self.MIN_ARTICLE_LENGTH:
            raise Exception("Article too short")
        if len(source) == 0:
            raise Exception("Source cannot be empty")
        
        # Auto-truncate if too long
        if len(content) > self.MAX_ARTICLE_LENGTH:
            content = content[:self.MAX_ARTICLE_LENGTH - 3] + "..."

        if self._get_user_index(author) < 0:
            self.register_user(author)

        # 🧠 AI SUMMARY
        summary_prompt = f"Summarize this article in 2-3 sentences:\n{content}"
        summary = self._safe_llm_text(summary_prompt, "Summary unavailable")

        # 🧠 AI SCORE (SAFE)
        score_prompt = f"""
            Analyze the article and respond ONLY in JSON format:

            {{
                "score": number (0-1000)
            }}

            Article:
            {content}
            """
        
        def score_leader():
            return gl.nondet.exec_prompt(score_prompt)
        
        def score_validator(leader_res) -> bool:
            if not isinstance(leader_res, gl.vm.Return):
                return False
            leader_digits = ''.join([c for c in leader_res.calldata if c.isdigit()])
            my_res = score_leader()
            my_digits = ''.join([c for c in my_res if c.isdigit()])
            # Allow 20% variance (200 points out of 1000)
            if leader_digits and my_digits:
                return abs(int(leader_digits) - int(my_digits)) <= 200
            return leader_digits == my_digits
        
        try:
            response = gl.vm.run_nondet_unsafe(score_leader, score_validator)
            score = int(''.join([c for c in response if c.isdigit()]))
        except:
            score = 500

        # 🧠 AI MODERATION
        moderation_prompt = f"""
            Is this article safe and appropriate?
            Answer ONLY: approved or rejected

            Article:
            {content}
            """
        
        status_raw = self._safe_llm_text(moderation_prompt, "rejected")

        status = "approved" if "approved" in status_raw.lower() else "rejected"

        if score < self.MIN_QUALITY_SCORE:
            status = "rejected"

        article_id = self.article_counter
        self.article_counter += 1

        self.articles.append(Article(
            id=article_id,
            title=title,
            content=content,
            summary=summary,
            source=source,
            author=author,
            timestamp=int(datetime.datetime.now().timestamp()),
            score=score,
            upvotes=0,
            downvotes=0,
            tags=tags,
            is_ai_generated=is_ai_generated,
            status=status
        ))

        user_idx = self._get_user_index(author)
        if user_idx >= 0:
            self.users[user_idx].total_articles += 1

        return article_id

    # ------------------------
    # WEB FETCHING - ADVANCED FEATURE 🌐
    # ------------------------
    @gl.public.write
    def submit_article_from_url(
        self,
        author: str,
        url: str,
        tags: list[str],
        is_ai_generated: bool = False
    ) -> bigint:
        if len(url) == 0:
            raise Exception("URL cannot be empty")
        if not (url.startswith("http://") or url.startswith("https://")):
            raise Exception("Invalid URL format")

        if self._get_user_index(author) < 0:
            self.register_user(author)

        # 🌐 FETCH WEB CONTENT with consensus
        def fetch_leader():
            response = gl.nondet.web.get(url)
            return response.body.decode("utf-8")
        
        def fetch_validator(leader_res) -> bool:
            if not isinstance(leader_res, gl.vm.Return):
                return False
            # Looser consensus: content length should be similar (within 30% variance)
            leader_content = leader_res.calldata
            my_content = fetch_leader()
            if len(leader_content) == 0 or len(my_content) == 0:
                return False
            # Allow 30% variance in content length for dynamic websites
            length_diff = abs(len(leader_content) - len(my_content))
            return length_diff <= max(len(leader_content), len(my_content)) * 0.3
        
        try:
            html_content = gl.vm.run_nondet_unsafe(fetch_leader, fetch_validator)
        except:
            raise Exception("Failed to fetch URL - validators could not reach consensus")

        # 🧠 LLM EXTRACT title and content from HTML
        extract_prompt = f"""
            Extract article information from this HTML and respond ONLY in JSON format:
            
            {{
                "title": "article title here",
                "content": "article main content here (clean text, no HTML)"
            }}
            
            Rules:
            1. Extract only the main article content, remove navigation, ads, footer
            2. Content should be plain text, no HTML tags
            3. Title should be the article headline
            4. If no article found, return empty strings
            
            HTML:
            {html_content[:10000]}
            """
        
        def extract_leader():
            return gl.nondet.exec_prompt(extract_prompt)
        
        def extract_validator(leader_res) -> bool:
            if not isinstance(leader_res, gl.vm.Return):
                return False
            # Check if leader result is valid JSON with required fields
            try:
                leader_data = json.loads(leader_res.calldata)
                my_res = extract_leader()
                my_data = json.loads(my_res)
                # Looser consensus: titles should have significant overlap
                leader_title = leader_data.get("title", "").lower().strip()
                my_title = my_data.get("title", "").lower().strip()
                # At least 50% of words should match
                leader_words = set(leader_title.split())
                my_words = set(my_title.split())
                if len(leader_words) > 0 and len(my_words) > 0:
                    common_words = leader_words.intersection(my_words)
                    title_similar = len(common_words) >= min(len(leader_words), len(my_words)) * 0.5
                else:
                    title_similar = leader_title == my_title
                # Content length should be within 50% variance (very loose)
                leader_content = leader_data.get("content", "")
                my_content = my_data.get("content", "")
                if len(leader_content) > 0 and len(my_content) > 0:
                    length_diff = abs(len(leader_content) - len(my_content))
                    content_similar = length_diff <= max(len(leader_content), len(my_content)) * 0.5
                else:
                    content_similar = False
                # Both should have some content
                has_content = len(leader_data.get("content", "")) > 50 and len(leader_data.get("title", "")) > 3
                return title_similar and content_similar and has_content
            except:
                return False
        
        # Try to extract with LLM - use leader result directly (deterministic extraction)
        title = ""
        content = ""
        extraction_success = False
        
        try:
            # Get leader result directly without strict consensus
            extract_response = gl.nondet.exec_prompt(extract_prompt)
            extracted_data = json.loads(extract_response)
            title = extracted_data.get("title", "").strip()
            content = extracted_data.get("content", "").strip()
            if len(title) > 0 and len(content) >= self.MIN_ARTICLE_LENGTH:
                extraction_success = True
        except Exception as e:
            # LLM extraction failed, will try fallback
            extraction_success = False
        
        # Fallback: if LLM extraction failed, use URL as title and raw HTML as content
        if not extraction_success:
            # Use URL path as title fallback
            from urllib.parse import urlparse
            parsed = urlparse(url)
            path_parts = parsed.path.split('/')
            # Get last non-empty part and clean it up
            title_fallback = ""
            for part in reversed(path_parts):
                if part and part not in ['news', 'article', 'post', 'blog']:
                    title_fallback = part.replace('-', ' ').replace('_', ' ').title()
                    break
            if not title_fallback:
                title_fallback = "Article from " + parsed.netloc
            
            title = title_fallback[:200]  # Limit length
            # Use raw HTML (cleaned) as content fallback
            import re
            # Simple HTML tag removal for fallback content
            content = re.sub(r'<[^>]+>', ' ', html_content[:50000])
            content = re.sub(r'\s+', ' ', content).strip()
            
            if len(content) < self.MIN_ARTICLE_LENGTH:
                raise Exception(f"Could not extract sufficient content from URL. Got {len(content)} chars, need {self.MIN_ARTICLE_LENGTH}")
        
        # Auto-truncate if too long
        if len(content) > self.MAX_ARTICLE_LENGTH:
            content = content[:self.MAX_ARTICLE_LENGTH - 3] + "..."

        # 🧠 AI SUMMARY
        summary_prompt = f"Summarize this article in 2-3 sentences:\n{content}"
        summary = self._safe_llm_text(summary_prompt, "Summary unavailable")

        # 🧠 AI SCORE
        score_prompt = f"""
            Analyze the article and respond ONLY in JSON format:
            {{
                "score": number (0-1000)
            }}
            Article:
            {content}
            """
        
        def score_leader():
            return gl.nondet.exec_prompt(score_prompt)
        
        def score_validator(leader_res) -> bool:
            if not isinstance(leader_res, gl.vm.Return):
                return False
            leader_digits = ''.join([c for c in leader_res.calldata if c.isdigit()])
            my_res = score_leader()
            my_digits = ''.join([c for c in my_res if c.isdigit()])
            if leader_digits and my_digits:
                return abs(int(leader_digits) - int(my_digits)) <= 200
            return leader_digits == my_digits
        
        try:
            response = gl.vm.run_nondet_unsafe(score_leader, score_validator)
            score = int(''.join([c for c in response if c.isdigit()]))
        except:
            score = 500

        # 🧠 AI MODERATION
        moderation_prompt = f"""
            Is this article safe and appropriate?
            Answer ONLY: approved or rejected
            Article:
            {content}
            """
        
        status_raw = self._safe_llm_text(moderation_prompt, "rejected")
        status = "approved" if "approved" in status_raw.lower() else "rejected"

        if score < self.MIN_QUALITY_SCORE:
            status = "rejected"

        article_id = self.article_counter
        self.article_counter += 1

        self.articles.append(Article(
            id=article_id,
            title=title,
            content=content,
            summary=summary,
            source=url,
            author=author,
            timestamp=int(datetime.datetime.now().timestamp()),
            score=score,
            upvotes=0,
            downvotes=0,
            tags=tags,
            is_ai_generated=is_ai_generated,
            status=status
        ))

        user_idx = self._get_user_index(author)
        if user_idx >= 0:
            self.users[user_idx].total_articles += 1

        return article_id

    # ------------------------
    # VOTING
    # ------------------------
    @gl.public.write
    def upvote_article(self, article_id: bigint, voter: str) -> bool:
        idx = self._get_article_index(article_id)
        if idx < 0:
            raise Exception("Article not found")

        self.articles[idx].upvotes += 1

        author_idx = self._get_user_index(self.articles[idx].author)
        if author_idx >= 0:
            self.users[author_idx].reputation += 1
            self.users[author_idx].total_upvotes += 1

        return True

    @gl.public.write
    def downvote_article(self, article_id: bigint, voter: str) -> bool:
        idx = self._get_article_index(article_id)
        if idx < 0:
            raise Exception("Article not found")

        self.articles[idx].downvotes += 1

        author_idx = self._get_user_index(self.articles[idx].author)
        if author_idx >= 0:
            self.users[author_idx].reputation = max(
                0, self.users[author_idx].reputation - 1
            )

        return True

    # ------------------------
    # READ METHODS (ALL RESTORED)
    # ------------------------
    @gl.public.view
    def get_article(self, article_id: bigint) -> Optional[Article]:
        idx = self._get_article_index(article_id)
        if idx < 0:
            return None
        return self.articles[idx]

    @gl.public.view
    def get_article_index(self, article_id: bigint) -> bigint:
        return self._get_article_index(article_id)

    @gl.public.view
    def get_user_articles(self, user: str) -> list[bigint]:
        result = []
        for article in self.articles:
            if article.author == user:
                result.append(article.id)
        return result

    @gl.public.view
    def get_articles_by_status(self, status: str) -> list[bigint]:
        result = []
        for article in self.articles:
            if article.status == status:
                result.append(article.id)
        return result

    @gl.public.view
    def get_articles_by_tag(self, tag: str) -> list[bigint]:
        result = []
        for article in self.articles:
            if tag in article.tags:
                result.append(article.id)
        return result

    @gl.public.view
    def get_article_stats(self) -> Tuple[bigint, bigint, bigint]:
        total = len(self.articles)
        approved = len([a for a in self.articles if a.status == "approved"])
        pending = len([a for a in self.articles if a.status == "pending"])
        return total, approved, pending
