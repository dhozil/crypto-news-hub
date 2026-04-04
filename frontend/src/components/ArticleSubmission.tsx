'use client';

// Article submission form component
import { useState } from 'react';
import { useContract } from '@/hooks/useContract';
import { useGamification } from '@/hooks/useGamification';
import { useWallet } from '@/hooks/useWallet';
import { X, Send, FileText, Link, Sparkles, Tag } from 'lucide-react';

interface ArticleSubmissionProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const ArticleSubmission = ({ isOpen, onClose, onSuccess }: ArticleSubmissionProps) => {
  const { isConnected, connectWallet } = useWallet();
  const { submitArticle, isLoading } = useContract();
  const { addXP } = useGamification();
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    source: '',
    tags: '',
    isAIGenerated: false
  });
  
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: any) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? e.target.checked : value
    }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Title is required');
      return false;
    }
    if (formData.title.length < 10) {
      setError('Title must be at least 10 characters');
      return false;
    }
    if (!formData.content.trim()) {
      setError('Content is required');
      return false;
    }
    if (formData.content.length < 100) {
      setError('Content must be at least 100 characters');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const tags = formData.tags
        .split(',')
        .map((tag: string) => tag.trim())
        .filter((tag: string) => tag.length > 0);

      await submitArticle(
        formData.title.trim(),
        formData.content.trim(),
        formData.source.trim(),
        tags,
        formData.isAIGenerated
      );

      await addXP(10, 'Submitted article');

      setFormData({
        title: '',
        content: '',
        source: '',
        tags: '',
        isAIGenerated: false
      });

      onClose();
      onSuccess?.();
    } catch (error: any) {
      setError(error.message || 'Failed to submit article');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOverlayClick = (e: any) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">
            <FileText className="w-5 h-5 text-blue-600" />
            Submit Article
          </div>
          <button onClick={onClose} className="modal-close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="form-error">
              {error}
            </div>
          )}

          {!isConnected ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">
                Please connect your wallet to submit articles
              </p>
              <button
                onClick={connectWallet}
                className="form-button form-button-primary"
              >
                Connect Wallet
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">
                  <FileText className="w-4 h-4" />
                  Article Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter a compelling title for your article..."
                  className="form-input"
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <FileText className="w-4 h-4" />
                  Article Content
                </label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  placeholder="Write your article content here..."
                  className="form-textarea"
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Link className="w-4 h-4" />
                  Source URL
                </label>
                <input
                  type="url"
                  name="source"
                  value={formData.source}
                  onChange={handleInputChange}
                  placeholder="https://example.com/article-url"
                  className="form-input"
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Tag className="w-4 h-4" />
                  Tags
                </label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  placeholder="bitcoin, ethereum, defi (comma-separated)"
                  className="form-input"
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-checkbox">
                <input
                  type="checkbox"
                  name="isAIGenerated"
                  checked={formData.isAIGenerated}
                  onChange={handleInputChange}
                  className="form-checkbox-input"
                  disabled={isSubmitting}
                />
                <label className="form-checkbox-label">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-500" />
                    <span>This article was AI-generated</span>
                  </div>
                </label>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={onClose}
                  className="form-button form-button-secondary"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="form-button form-button-primary"
                  disabled={isSubmitting || isLoading}
                >
                  <Send className="w-4 h-4" />
                  {isSubmitting ? 'Submitting...' : 'Submit Article'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArticleSubmission;
