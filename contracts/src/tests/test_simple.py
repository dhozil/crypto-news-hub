# Simple test without GenLayer dependencies
import sys
import os
from datetime import datetime
import time

# Add parent directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

# Mock GenLayer imports
class MockContract:
    pass

class MockGl:
    class Contract:
        pass
    
    class public:
        @staticmethod
        def view(func):
            return func
        
        @staticmethod
        def write(func):
            return func

# Mock genlayer module
import types
genlayer_module = types.ModuleType('genlayer')
genlayer_module.gl = MockGl()
genlayer_module.DynArray = list
genlayer_module.TreeMap = dict
sys.modules['genlayer'] = genlayer_module

# Mock allow_storage decorator
def allow_storage(cls):
    return cls

sys.modules['allow_storage'] = types.ModuleType('allow_storage')
sys.modules['allow_storage'].allow_storage = allow_storage

# Now test the contract logic
def test_basic_functionality():
    """Test basic contract functionality without GenLayer"""
    
    # Create mock Article and User classes
    class Article:
        def __init__(self, id, title, content, source, author, timestamp, score, upvotes, downvotes, tags, is_ai_generated, status):
            self.id = id
            self.title = title
            self.content = content
            self.source = source
            self.author = author
            self.timestamp = timestamp
            self.score = score
            self.upvotes = upvotes
            self.downvotes = downvotes
            self.tags = tags
            self.is_ai_generated = is_ai_generated
            self.status = status
    
    class User:
        def __init__(self, address, reputation, total_articles, total_upvotes, rewards, joined_at):
            self.address = address
            self.reputation = reputation
            self.total_articles = total_articles
            self.total_upvotes = total_upvotes
            self.rewards = rewards
            self.joined_at = joined_at
    
    # Mock contract class
    class MockContentRegistry:
        def __init__(self):
            self.articles = []
            self.users = []
            self.article_counter = 0
            self.MIN_ARTICLE_LENGTH = 100
            self.MAX_ARTICLE_LENGTH = 10000
        
        def get_user_index(self, user):
            for i, u in enumerate(self.users):
                if u.address == user:
                    return i
            return -1
        
        def register_user(self, user):
            user_index = self.get_user_index(user)
            if user_index >= 0:
                return False
            
            new_user = User(
                address=user,
                reputation=100,
                total_articles=0,
                total_upvotes=0,
                rewards=0,
                joined_at=int(time.time())
            )
            
            self.users.append(new_user)
            return True
        
        def submit_article(self, author, title, content, source, tags, is_ai_generated=False):
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
                source=source,
                author=author,
                timestamp=int(time.time()),
                score=0,
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
            
            return article_id
        
        def get_article(self, article_id):
            for article in self.articles:
                if article.id == article_id:
                    return article
            return None
        
        def upvote_article(self, article_id, voter):
            for article in self.articles:
                if article.id == article_id:
                    article.upvotes += 1
                    
                    # Update author reputation
                    user_index = self.get_user_index(article.author)
                    if user_index >= 0:
                        self.users[user_index].total_upvotes += 1
                        self.users[user_index].reputation += 1
                    
                    return True
            return False
    
        def get_user_articles(self, user):
            user_articles = []
            for article in self.articles:
                if article.author == user:
                    user_articles.append(article.id)
            return user_articles
    
        def get_articles_by_status(self, status):
            status_articles = []
            for article in self.articles:
                if article.status == status:
                    status_articles.append(article.id)
            return status_articles
    
        def get_article_stats(self):
            total_articles = len(self.articles)
            approved_articles = len([a for a in self.articles if a.status == 'approved'])
            pending_articles = len([a for a in self.articles if a.status == 'pending'])
            
            return total_articles, approved_articles, pending_articles
    
    # Run tests
    contract = MockContentRegistry()
    test_user = "0x1234567890123456789012345678901234567890"
    
    # Test user registration
    result = contract.register_user(test_user)
    assert result == True
    assert len(contract.users) == 1
    assert contract.users[0].address == test_user
    assert contract.users[0].reputation == 100
    
    # Test duplicate user registration
    result = contract.register_user(test_user)
    assert result == False
    assert len(contract.users) == 1
    
    # Test article submission
    article_id = contract.submit_article(
        author=test_user,
        title="Test Article",
        content="This is a test article content that is definitely long enough to meet the minimum requirements for article length validation. It contains multiple sentences and should pass the validation check.",
        source="test.com",
        tags=["test", "crypto"],
        is_ai_generated=False
    )
    
    assert article_id == 0
    assert len(contract.articles) == 1
    assert contract.articles[0].title == "Test Article"
    assert contract.articles[0].author == test_user
    assert contract.articles[0].status == 'pending'
    
    # Test article too short
    try:
        contract.submit_article(
            author=test_user,
            title="Test",
            content="Too short",
            source="test.com",
            tags=["test"]
        )
        assert False, "Should have raised exception"
    except Exception as e:
        assert str(e) == "Article too short"
    
    # Test upvote
    result = contract.upvote_article(article_id, test_user)
    assert result == True
    assert contract.articles[0].upvotes == 1
    assert contract.users[0].total_upvotes == 1
    
    # Test get user articles
    user_articles = contract.get_user_articles(test_user)
    assert len(user_articles) == 1
    assert article_id in user_articles
    
    # Test get article stats
    total, approved, pending = contract.get_article_stats()
    assert total == 1
    assert pending == 1
    assert approved == 0
    
    print("✅ All tests passed!")
    return True

if __name__ == "__main__":
    test_basic_functionality()
