# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
import datetime

@allow_storage
@dataclass
class Article:
    id: int
    title: str
    content: str
    summary: str
    source: str
    author: str
    timestamp: int
    score: int  # Quality score 0-1000 (0.0-1.0 * 1000)
    upvotes: int
    downvotes: int
    tags: List[str]
    is_ai_generated: bool
    status: str  # 'pending', 'approved', 'rejected'

@allow_storage
@dataclass
class User:
    address: str
    reputation: int
    total_articles: int
    total_upvotes: int
    rewards: int
    joined_at: int

class ContentRegistry(gl.Contract):
    # State variables with proper GenStudio syntax
    articles: DynArray[Article]
    users: DynArray[User]
    article_counter: int
    user_counter: int
    
    # Configuration
    MIN_ARTICLE_LENGTH: int = 100
    MAX_ARTICLE_LENGTH: int = 10000
    MIN_QUALITY_SCORE: int = 600  # 0.6 * 1000
    
    def __init__(self):
        """Initialize the contract"""
        self.articles = DynArray[Article]()
        self.users = DynArray[User]()
        self.article_counter = 0
        self.user_counter = 0
    
    @gl.public.view
    def get_user_index(self, user: str) -> int:
        """Get user index by address"""
        for i, u in enumerate(self.users):
            if u.address == user:
                return i
        return -1
    
    @gl.public.view
    def get_article_index(self, article_id: int) -> int:
        """Get article index by ID"""
        for i, article in enumerate(self.articles):
            if article.id == article_id:
                return i
        return -1
    
    @gl.public.write
    def register_user(self, user: str) -> bool:
        """Register a new user"""
        user_index = self.get_user_index(user)
        if user_index >= 0:
            return False
            
        new_user = User(
            address=user,
            reputation=100,  # Starting reputation
            total_articles=0,
            total_upvotes=0,
            rewards=0,
            joined_at=int(datetime.datetime.now().timestamp())
        )
        
        self.users.append(new_user)
        return True
    
    @gl.public.write
    def submit_article(
        self, 
        author: str,
        title: str,
        content: str,
        source: str,
        tags: List[str],
        is_ai_generated: bool = False
    ) -> int:
        """Submit a new article for validation"""
        
        # Ensure user is registered
        user_index = self.get_user_index(author)
        if user_index < 0:
            self.register_user(author)
        
        # Validate input
        if len(title) == 0:
            raise Exception("Title cannot be empty")
        if len(content) < self.MIN_ARTICLE_LENGTH:
            raise Exception("Article too short")
        if len(content) > self.MAX_ARTICLE_LENGTH:
            raise Exception("Article too long")
        if len(source) == 0:
            raise Exception("Source cannot be empty")
        
        # Create article
        article_id = self.article_counter
        self.article_counter += 1
        
        article = Article(
            id=article_id,
            title=title,
            content=content,
            summary="",  # Will be filled by AI validation
            source=source,
            author=author,
            timestamp=int(datetime.datetime.now().timestamp()),
            score=0,  # Will be set by AI validation
            upvotes=0,
            downvotes=0,
            tags=tags,
            is_ai_generated=is_ai_generated,
            status='pending'
        )
        
        self.articles.append(article)
        
        # Update user stats
        user_index = self.get_user_index(author)
        if user_index >= 0:
            self.users[user_index].total_articles += 1
        
        # Trigger AI validation
        self._validate_article_async(article_id)
        
        return article_id
    
    def _validate_article_async(self, article_id: int):
        """
        Internal method to trigger AI validation
        In GenLayer, this would be handled by the consensus mechanism
        """
        # This is a placeholder for AI validation logic
        # In actual implementation, this would call LLM for quality assessment
        article_index = self.get_article_index(article_id)
        if article_index < 0:
            return
            
        article = self.articles[article_index]
        
        # Simulate AI validation (would be actual LLM call in production)
        quality_score = self._simulate_ai_validation(article)
        
        # Update article with validation results
        article.score = quality_score
        article.summary = self._generate_summary(article.content)
        
        # Determine status based on quality score
        if quality_score >= self.MIN_QUALITY_SCORE:
            article.status = 'approved'
        else:
            article.status = 'rejected'
    
    def _simulate_ai_validation(self, article: Article) -> int:
        """
        Simulate AI quality validation
        In production, this would call actual LLM
        """
        # Simple heuristic for demo purposes
        score = 500  # Base score
        
        # Length bonus
        if len(article.content) > 500:
            score += 100
        
        # Title quality
        if len(article.title) > 20 and len(article.title) < 100:
            score += 100
        
        # Source credibility (simplified)
        credible_sources = ['coindesk.com', 'cointelegraph.com', 'theblock.co']
        if any(source in article.source.lower() for source in credible_sources):
            score += 200
        
        # Tag relevance
        if len(article.tags) >= 2 and len(article.tags) <= 5:
            score += 50
        
        # Ensure score is within bounds
        return max(0, min(1000, score))
    
    def _generate_summary(self, content: str) -> str:
        """
        Generate article summary
        In production, this would use LLM for actual summarization
        """
        # Simple extractive summarization for demo
        sentences = content.split('.')
        if len(sentences) <= 3:
            return content
        
        # Take first 2-3 sentences as summary
        summary = '. '.join(sentences[:2]) + '.'
        return summary
    
    @gl.public.write
    def upvote_article(self, article_id: int, voter: str) -> bool:
        """Upvote an article"""
        article_index = self.get_article_index(article_id)
        if article_index < 0:
            raise Exception("Article not found")
        
        article = self.articles[article_index]
        article.upvotes += 1
        
        # Update author reputation
        user_index = self.get_user_index(article.author)
        if user_index >= 0:
            self.users[user_index].total_upvotes += 1
            self.users[user_index].reputation += 1
        
        return True
    
    @gl.public.write
    def downvote_article(self, article_id: int, voter: str) -> bool:
        """Downvote an article"""
        article_index = self.get_article_index(article_id)
        if article_index < 0:
            raise Exception("Article not found")
        
        article = self.articles[article_index]
        article.downvotes += 1
        
        # Update author reputation
        user_index = self.get_user_index(article.author)
        if user_index >= 0:
            self.users[user_index].reputation = max(0, self.users[user_index].reputation - 1)
        
        return True
    
    @gl.public.view
    def get_article(self, article_id: int) -> Optional[Article]:
        """Get article by ID"""
        article_index = self.get_article_index(article_id)
        if article_index < 0:
            return None
        return self.articles[article_index]
    
    @gl.public.view
    def get_user_articles(self, user: str) -> List[int]:
        """Get all articles by a user"""
        user_articles = []
        for article in self.articles:
            if article.author == user:
                user_articles.append(article.id)
        return user_articles
    
    @gl.public.view
    def get_articles_by_status(self, status: str) -> List[int]:
        """Get articles by status"""
        status_articles = []
        for article in self.articles:
            if article.status == status:
                status_articles.append(article.id)
        return status_articles
    
    @gl.public.view
    def get_articles_by_tag(self, tag: str) -> List[int]:
        """Get articles by tag"""
        tag_articles = []
        for article in self.articles:
            if tag in article.tags:
                tag_articles.append(article.id)
        return tag_articles
    
    @gl.public.view
    def get_user_info(self, user: str) -> Optional[User]:
        """Get user information"""
        user_index = self.get_user_index(user)
        if user_index < 0:
            return None
        return self.users[user_index]
    
    @gl.public.view
    def get_article_stats(self) -> Tuple[int, int, int]:
        """Get platform statistics"""
        total_articles = len(self.articles)
        approved_articles = len([a for a in self.articles if a.status == 'approved'])
        pending_articles = len([a for a in self.articles if a.status == 'pending'])
        
        return total_articles, approved_articles, pending_articles
