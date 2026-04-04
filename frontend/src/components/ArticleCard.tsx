'use client';

// Individual article card component with contract integration
import { useState } from 'react';
import { Article } from '@/hooks/useContract';
import { 
  ExternalLink, 
  ThumbsUp, 
  ThumbsDown, 
  Share2, 
  Bookmark,
  Clock,
  User,
  Star,
  Bot,
  CheckCircle
} from 'lucide-react';

interface ArticleCardProps {
  article: Article;
  onUpvote?: (articleId: string) => void;
  onDownvote?: (articleId: string) => void;
}

const ArticleCard = ({ article, onUpvote, onDownvote }: ArticleCardProps) => {
  const [isUpvoted, setIsUpvoted] = useState(false);
  const [isDownvoted, setIsDownvoted] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [upvotes, setUpvotes] = useState(article.upvotes);
  const [downvotes, setDownvotes] = useState(article.downvotes);

  const handleUpvote = async () => {
    if (isUpvoted) {
      setIsUpvoted(false);
      setUpvotes(upvotes - 1);
    } else {
      setIsUpvoted(true);
      setUpvotes(upvotes + 1);
      if (isDownvoted) {
        setIsDownvoted(false);
        setDownvotes(downvotes - 1);
      }
    }
    
    // Call contract function if provided
    if (onUpvote) {
      try {
        await onUpvote(article.id);
      } catch (error) {
        console.error('Failed to upvote article:', error);
        // Revert UI state on error
        setIsUpvoted(false);
        setUpvotes(upvotes - 1);
      }
    }
  };

  const handleDownvote = async () => {
    if (isDownvoted) {
      setIsDownvoted(false);
      setDownvotes(downvotes - 1);
    } else {
      setIsDownvoted(true);
      setDownvotes(downvotes + 1);
      if (isUpvoted) {
        setIsUpvoted(false);
        setUpvotes(upvotes - 1);
      }
    }
    
    // Call contract function if provided
    if (onDownvote) {
      try {
        await onDownvote(article.id);
      } catch (error) {
        console.error('Failed to downvote article:', error);
        // Revert UI state on error
        setIsDownvoted(false);
        setDownvotes(downvotes - 1);
      }
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 0.8) return 'High Quality';
    if (score >= 0.6) return 'Good Quality';
    return 'Low Quality';
  };

  return (
    <div className="article-card">
      <div className="p-6">
        {/* Header */}
        <div className="article-card-header">
          <div className="flex-1">
            <h2 className="article-card-title">
              {article.title}
            </h2>
            <div className="article-card-meta">
              <div className="article-card-meta-item">
                {article.isAIGenerated ? (
                  <Bot className="w-4 h-4 text-blue-500" />
                ) : (
                  <User className="w-4 h-4" />
                )}
                <span>{article.author}</span>
              </div>
              <div className="article-card-meta-item">
                <Clock className="w-4 h-4" />
                <span>{formatDate(article.timestamp)}</span>
              </div>
              <div className="article-card-meta-item">
                <ExternalLink className="w-4 h-4" />
                <span>{article.source}</span>
              </div>
            </div>
          </div>
          
          {/* Quality Score */}
          <div className="article-card-quality-score">
            <div className={`article-card-score ${getScoreColor(article.score).replace('text-', '')}`}>
              <Star className="w-4 h-4 fill-current" />
              {Math.round(article.score * 100)}%
            </div>
            <span className={`article-card-score-label ${getScoreColor(article.score).replace('text-', '')}`}>
              {getScoreLabel(article.score)}
            </span>
          </div>
        </div>

        {/* Summary */}
        <div className="mb-4">
          <p className="article-card-summary">
            {article.summary}
          </p>
        </div>

        {/* Tags */}
        <div className="article-card-tags">
          {article.tags.map(tag => (
            <span
              key={tag}
              className="article-card-tag"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Status Badge */}
        {article.status === 'pending' && (
          <div className="mb-4">
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
              <Clock className="w-3 h-3" />
              Pending Review
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="article-card-actions">
          {/* Upvote */}
          <button
            onClick={handleUpvote}
            className={`article-card-action ${isUpvoted ? 'upvoted' : ''}`}
          >
            <ThumbsUp className="w-4 h-4" />
            <span>{upvotes}</span>
          </button>

          {/* Downvote */}
          <button
            onClick={handleDownvote}
            className={`article-card-action ${isDownvoted ? 'downvoted' : ''}`}
          >
            <ThumbsDown className="w-4 h-4" />
            <span>{downvotes}</span>
          </button>

          {/* Share */}
          <button className="article-card-action">
            <Share2 className="w-4 h-4" />
            Share
          </button>

          {/* Bookmark */}
          <button
            onClick={() => setIsBookmarked(!isBookmarked)}
            className={`article-card-action ${isBookmarked ? 'bookmarked' : ''}`}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
            {isBookmarked ? 'Saved' : 'Save'}
          </button>
        </div>

        {/* Verified Badge */}
        {article.status === 'approved' && (
          <div className="flex items-center gap-1 text-green-600 mt-4">
            <CheckCircle className="w-4 h-4" />
            <span className="text-xs font-medium">Verified</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArticleCard;
