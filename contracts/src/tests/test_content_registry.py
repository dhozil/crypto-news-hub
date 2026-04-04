"""
Test suite for Content Registry contract (GenStudio compatible)
"""

import pytest
from unittest.mock import Mock, patch
import sys
import os

# Add parent directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

# Mock GenLayer imports for testing
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

# Add to sys.modules
sys.modules['allow_storage'] = types.ModuleType('allow_storage')
sys.modules['allow_storage'].allow_storage = allow_storage

# Now import our modules
from content_registry import ContentRegistry, Article, User

class TestContentRegistry:
    """Test cases for Content Registry contract"""
    
    def setup_method(self):
        """Setup test environment"""
        self.contract = ContentRegistry()
        self.test_user = "0x1234567890123456789012345678901234567890"
        self.test_user2 = "0x9876543210987654321098765432109876543210"
    
    def test_register_user(self):
        """Test user registration"""
        result = self.contract.register_user(self.test_user)
        
        assert result == True
        assert len(self.contract.users) == 1
        assert self.contract.users[0].address == self.test_user
        assert self.contract.users[0].reputation == 100
        assert self.contract.users[0].total_articles == 0
    
    def test_register_duplicate_user(self):
        """Test registering duplicate user"""
        self.contract.register_user(self.test_user)
        result = self.contract.register_user(self.test_user)
        
        assert result == False
        assert len(self.contract.users) == 1
    
    def test_submit_article_valid(self):
        """Test submitting valid article"""
        self.contract.register_user(self.test_user)
        
        article_id = self.contract.submit_article(
            author=self.test_user,
            title="Test Article",
            content="This is a test article content that is long enough to meet the minimum requirements.",
            source="test.com",
            tags=["test", "crypto"],
            is_ai_generated=False
        )
        
        assert article_id == 0  # First article
        assert len(self.contract.articles) == 1
        assert self.contract.articles[0].title == "Test Article"
        assert self.contract.articles[0].author == self.test_user
        assert self.contract.articles[0].status == 'pending'
    
    def test_submit_article_too_short(self):
        """Test submitting article that's too short"""
        self.contract.register_user(self.test_user)
        
        with pytest.raises(Exception, match="Article too short"):
            self.contract.submit_article(
                author=self.test_user,
                title="Test",
                content="Too short",
                source="test.com",
                tags=["test"]
            )
    
    def test_submit_article_too_long(self):
        """Test submitting article that's too long"""
        self.contract.register_user(self.test_user)
        
        long_content = "x" * 10001  # Exceeds max length
        
        with pytest.raises(Exception, match="Article too long"):
            self.contract.submit_article(
                author=self.test_user,
                title="Test",
                content=long_content,
                source="test.com",
                tags=["test"]
            )
    
    def test_submit_article_empty_title(self):
        """Test submitting article with empty title"""
        self.contract.register_user(self.test_user)
        
        with pytest.raises(Exception, match="Title cannot be empty"):
            self.contract.submit_article(
                author=self.test_user,
                title="",
                content="Valid content for testing purposes.",
                source="test.com",
                tags=["test"]
            )
    
    def test_ai_validation_simulation(self):
        """Test AI validation simulation"""
        self.contract.register_user(self.test_user)
        
        # Submit article
        article_id = self.contract.submit_article(
            author=self.test_user,
            title="Bitcoin Reaches New High",
            content="Bitcoin has reached a new all-time high as institutional adoption continues to grow. The cryptocurrency market is seeing increased interest from major financial institutions.",
            source="coindesk.com",
            tags=["bitcoin", "price"],
            is_ai_generated=False
        )
        
        # Check if validation was triggered
        article = self.contract.get_article(article_id)
        assert article is not None
        assert article.status in ['approved', 'rejected']
        assert article.score > 0
        assert len(article.summary) > 0
    
    def test_upvote_article(self):
        """Test upvoting an article"""
        self.contract.register_user(self.test_user)
        self.contract.register_user(self.test_user2)
        
        # Submit article
        article_id = self.contract.submit_article(
            author=self.test_user,
            title="Test Article",
            content="Valid content for testing purposes.",
            source="test.com",
            tags=["test"]
        )
        
        # Upvote article
        result = self.contract.upvote_article(article_id, self.test_user2)
        
        assert result == True
        assert self.contract.articles[0].upvotes == 1
        assert self.contract.users[0].total_upvotes == 1
    
    def test_downvote_article(self):
        """Test downvoting an article"""
        self.contract.register_user(self.test_user)
        self.contract.register_user(self.test_user2)
        
        # Submit article
        article_id = self.contract.submit_article(
            author=self.test_user,
            title="Test Article",
            content="Valid content for testing purposes.",
            source="test.com",
            tags=["test"]
        )
        
        # Downvote article
        result = self.contract.downvote_article(article_id, self.test_user2)
        
        assert result == True
        assert self.contract.articles[0].downvotes == 1
    
    def test_get_nonexistent_article(self):
        """Test getting non-existent article"""
        article = self.contract.get_article(999)
        assert article is None
    
    def test_get_user_articles(self):
        """Test getting articles by user"""
        self.contract.register_user(self.test_user)
        
        # Submit multiple articles
        article_id1 = self.contract.submit_article(
            author=self.test_user,
            title="Article 1",
            content="Content for article 1",
            source="test.com",
            tags=["test"]
        )
        
        article_id2 = self.contract.submit_article(
            author=self.test_user,
            title="Article 2",
            content="Content for article 2",
            source="test2.com",
            tags=["test2"]
        )
        
        user_articles = self.contract.get_user_articles(self.test_user)
        
        assert len(user_articles) == 2
        assert article_id1 in user_articles
        assert article_id2 in user_articles
    
    def test_get_articles_by_status(self):
        """Test getting articles by status"""
        self.contract.register_user(self.test_user)
        
        # Submit articles
        article_id1 = self.contract.submit_article(
            author=self.test_user,
            title="Article 1",
            content="Content for article 1",
            source="test.com",
            tags=["test"]
        )
        
        article_id2 = self.contract.submit_article(
            author=self.test_user,
            title="Article 2",
            content="Content for article 2",
            source="test2.com",
            tags=["test2"]
        )
        
        # Get pending articles
        pending_articles = self.contract.get_articles_by_status('pending')
        
        assert len(pending_articles) >= 2
        assert article_id1 in pending_articles
        assert article_id2 in pending_articles
    
    def test_get_articles_by_tag(self):
        """Test getting articles by tag"""
        self.contract.register_user(self.test_user)
        
        # Submit articles with different tags
        article_id1 = self.contract.submit_article(
            author=self.test_user,
            title="Bitcoin News",
            content="Bitcoin is rising",
            source="coindesk.com",
            tags=["bitcoin", "crypto"]
        )
        
        article_id2 = self.contract.submit_article(
            author=self.test_user,
            title="Ethereum News",
            content="Ethereum is upgrading",
            source="ethereum.org",
            tags=["ethereum", "crypto"]
        )
        
        # Get articles by crypto tag
        crypto_articles = self.contract.get_articles_by_tag('crypto')
        
        assert len(crypto_articles) == 2
        assert article_id1 in crypto_articles
        assert article_id2 in crypto_articles
        
        # Get articles by bitcoin tag
        bitcoin_articles = self.contract.get_articles_by_tag('bitcoin')
        
        assert len(bitcoin_articles) == 1
        assert article_id1 in bitcoin_articles
    
    def test_get_user_info(self):
        """Test getting user information"""
        self.contract.register_user(self.test_user)
        
        user_info = self.contract.get_user_info(self.test_user)
        
        assert user_info is not None
        assert user_info.address == self.test_user
        assert user_info.reputation == 100
        assert user_info.total_articles == 0
    
    def test_get_article_stats(self):
        """Test getting article statistics"""
        self.contract.register_user(self.test_user)
        
        # Submit articles
        self.contract.submit_article(
            author=self.test_user,
            title="Article 1",
            content="Content for article 1",
            source="test.com",
            tags=["test"]
        )
        
        self.contract.submit_article(
            author=self.test_user,
            title="Article 2",
            content="Content for article 2",
            source="test2.com",
            tags=["test2"]
        )
        
        total, approved, pending = self.contract.get_article_stats()
        
        assert total == 2
        assert pending == 2  # All articles start as pending
        assert approved == 0
    
    def test_auto_user_registration(self):
        """Test automatic user registration on article submission"""
        # Don't register user manually
        article_id = self.contract.submit_article(
            author=self.test_user,
            title="Test Article",
            content="Valid content for testing purposes.",
            source="test.com",
            tags=["test"]
        )
        
        # User should be auto-registered
        assert len(self.contract.users) == 1
        assert self.contract.users[0].total_articles == 1

if __name__ == "__main__":
    pytest.main([__file__])
