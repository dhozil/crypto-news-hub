# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
import datetime

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
    MAX_ARTICLE_LENGTH: bigint = 10000
    MIN_QUALITY_SCORE: bigint = 600
    
    def __init__(self):
        # Initialize with empty arrays - GenLayer will handle initialization
        self.article_counter = 0
        self.user_counter = 0
    
    @gl.public.view
    def get_user_index(self, user: str) -> bigint:
        for i, u in enumerate(self.users):
            if u.address == user:
                return i
        return -1
    
    @gl.public.view
    def get_article_index(self, article_id: bigint) -> bigint:
        for i, article in enumerate(self.articles):
            if article.id == article_id:
                return i
        return -1
    
    @gl.public.write
    def register_user(self, user: str) -> bool:
        user_index = self.get_user_index(user)
        if user_index >= 0:
            return False
            
        new_user = User(
            address=user,
            reputation=100,
            total_articles=0,
            total_upvotes=0,
            rewards=0,
            joined_at=int(datetime.datetime.now().timestamp())
        )
        
        self.users.append(new_user)
        return True
    
    @gl.public.write
    def submit_article(self, author: str, title: str, content: str, source: str, tags: DynArray[str], is_ai_generated: bool = False) -> bigint:
        user_index = self.get_user_index(author)
        if user_index < 0:
            self.register_user(author)
        
        if len(title) == 0:
            raise Exception("Title cannot be empty")
        if len(content) < self.MIN_ARTICLE_LENGTH:
            raise Exception("Article too short")
        if len(content) > self.MAX_ARTICLE_LENGTH:
            raise Exception("Article too long")
        if len(source) == 0:
            raise Exception("Source cannot be empty")
        
        article_id = self.article_counter
        self.article_counter += 1
        
        article = Article(
            id=article_id,
            title=title,
            content=content,
            summary="",
            source=source,
            author=author,
            timestamp=int(datetime.datetime.now().timestamp()),
            score=0,
            upvotes=0,
            downvotes=0,
            tags=tags,
            is_ai_generated=is_ai_generated,
            status='pending'
        )
        
        self.articles.append(article)
        
        user_index = self.get_user_index(author)
        if user_index >= 0:
            self.users[user_index].total_articles += 1
        
        return article_id
    
    @gl.public.write
    def upvote_article(self, article_id: bigint, voter: str) -> bool:
        article_index = self.get_article_index(article_id)
        if article_index < 0:
            raise Exception("Article not found")
        
        article = self.articles[article_index]
        article.upvotes += 1
        
        user_index = self.get_user_index(article.author)
        if user_index >= 0:
            self.users[user_index].total_upvotes += 1
            self.users[user_index].reputation += 1
        
        return True
    
    @gl.public.write
    def downvote_article(self, article_id: bigint, voter: str) -> bool:
        article_index = self.get_article_index(article_id)
        if article_index < 0:
            raise Exception("Article not found")
        
        article = self.articles[article_index]
        article.downvotes += 1
        
        user_index = self.get_user_index(article.author)
        if user_index >= 0:
            self.users[user_index].reputation = max(0, self.users[user_index].reputation - 1)
        
        return True
    
    @gl.public.view
    def get_article(self, article_id: bigint) -> Optional[Article]:
        article_index = self.get_article_index(article_id)
        if article_index < 0:
            return None
        return self.articles[article_index]
    
    @gl.public.view
    def get_user_articles(self, user: str) -> DynArray[bigint]:
        user_articles = DynArray[bigint]()
        for article in self.articles:
            if article.author == user:
                user_articles.append(article.id)
        return user_articles
    
    @gl.public.view
    def get_articles_by_status(self, status: str) -> DynArray[bigint]:
        status_articles = DynArray[bigint]()
        for article in self.articles:
            if article.status == status:
                status_articles.append(article.id)
        return status_articles
    
    @gl.public.view
    def get_articles_by_tag(self, tag: str) -> DynArray[bigint]:
        tag_articles = DynArray[bigint]()
        for article in self.articles:
            if tag in article.tags:
                tag_articles.append(article.id)
        return tag_articles
    
    @gl.public.view
    def get_user_info(self, user: str) -> Optional[User]:
        user_index = self.get_user_index(user)
        if user_index < 0:
            return None
        return self.users[user_index]
    
    @gl.public.view
    def get_article_stats(self) -> Tuple[bigint, bigint, bigint]:
        total_articles = len(self.articles)
        approved_articles = len([a for a in self.articles if a.status == 'approved'])
        pending_articles = len([a for a in self.articles if a.status == 'pending'])
        
        return total_articles, approved_articles, pending_articles
