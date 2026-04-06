'use client';

// Enhanced NewsFeed component with contract integration
import { createClient } from "@supabase/supabase-js";
import { useState, useEffect } from 'react';
import { useContract } from '@/hooks/useContract';
import { useGamification } from '@/hooks/useGamification';
import { Article } from '@/hooks/useContract';
import ArticleCard from './ArticleCard';
import ArticleSubmission from './ArticleSubmission';
import SearchFilters from './SearchFilters';
import { Filter, TrendingUp, Clock, Star, Plus, RefreshCw } from 'lucide-react';

type SortOption = 'latest' | 'trending' | 'quality' | 'discussed';

interface SearchState {
  query: string;
  category: string;
  dateRange: string;
  author: string;
  sortBy: string;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const NewsFeed = () => {
  const { 
    articles, 
    isLoading, 
    error, 
    fetchArticles, 
    upvoteArticle, 
    downvoteArticle,
    refreshData 
  } = useContract();
  
  const { addXP } = useGamification();
  
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [dbArticles, setDbArticles] = useState<Article[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('latest');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [isSubmissionOpen, setIsSubmissionOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchFilters, setSearchFilters] = useState<SearchState>({
    query: '',
    category: 'all',
    dateRange: 'all',
    author: '',
    sortBy: 'latest'
  });

  useEffect(() => {
  let filtered = [...articles, ...dbArticles]; 

  setFilteredArticles(filtered);

}, [articles, sortBy, selectedTag, searchFilters, dbArticles]);

  useEffect(() => {
  const fetchFromDB = async () => {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
    } else {
      const mapped = data.map((item: any) => ({
        id: item.id.toString(),
        title: item.title,
        content: item.content,
        author: "AI Bot",
        timestamp: new Date(item.created_at),
        tags: ["AI Generated", "Crypto"],
        upvotes: 0,
        downvotes: 0,
        score: 0,
        status: "approved"
      }));

      setDbArticles(mapped);
    }
  };

  fetchFromDB();
}, []);

    // Apply search filters
    if (searchFilters.query) {
      const query = searchFilters.query.toLowerCase();
      filtered = filtered.filter(article => 
        article.title.toLowerCase().includes(query) ||
        article.content.toLowerCase().includes(query) ||
        article.author.toLowerCase().includes(query) ||
        article.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Filter by category
    if (searchFilters.category !== 'all') {
      filtered = filtered.filter(article => 
        article.tags.includes(searchFilters.category)
      );
    }

    // Filter by author
    if (searchFilters.author) {
      const authorQuery = searchFilters.author.toLowerCase();
      filtered = filtered.filter(article => 
        article.author.toLowerCase().includes(authorQuery)
      );
    }

    // Filter by date range
    if (searchFilters.dateRange !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (searchFilters.dateRange) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          filterDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      filtered = filtered.filter(article => 
        article.timestamp >= filterDate
      );
    }

    // Filter by tag (legacy)
    if (selectedTag) {
      filtered = filtered.filter(article => 
        article.tags.includes(selectedTag)
      );
    }

    // Filter out rejected articles
    filtered = filtered.filter(article => 
      article.status !== 'rejected'
    );

    // Sort articles
    const sortOption = searchFilters.sortBy === 'latest' ? sortBy : searchFilters.sortBy;
    filtered.sort((a, b) => {
      switch (sortOption) {
        case 'latest':
          return b.timestamp.getTime() - a.timestamp.getTime();
        case 'trending':
          return (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes);
        case 'quality':
          return b.score - a.score;
        case 'discussed':
          return (b.upvotes + b.downvotes) - (a.upvotes + a.downvotes);
        default:
          return 0;
      }
    });

    setFilteredArticles(filtered);
  }, [articles, sortBy, selectedTag, searchFilters]);

  const handleSearchChange = (newFilters: SearchState) => {
    setSearchFilters(newFilters);
  };

  const getAllTags = () => {
    const tags = new Set<string>();
    articles.forEach(article => {
      article.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleUpvote = async (articleId: string) => {
    try {
      await upvoteArticle(articleId);
      // Add XP for upvoting
      await addXP(5, 'Upvoted an article');
    } catch (error) {
      console.error('Failed to upvote article:', error);
    }
  };

  const handleDownvote = async (articleId: string) => {
    try {
      await downvoteArticle(articleId);
      // Add XP for downvoting
      await addXP(3, 'Downvoted an article');
    } catch (error) {
      console.error('Failed to downvote article:', error);
    }
  };

  const handleSubmissionSuccess = async () => {
    // Add XP for submitting an article
    await addXP(25, 'Submitted a new article');
    // Articles will be automatically refreshed by the useContract hook
  };

  const sortOptions: { value: SortOption; label: string; icon: React.ReactNode }[] = [
    { value: 'latest', label: 'Latest', icon: <Clock className="w-4 h-4" /> },
    { value: 'trending', label: 'Trending', icon: <TrendingUp className="w-4 h-4" /> },
    { value: 'quality', label: 'Quality', icon: <Star className="w-4 h-4" /> },
    { value: 'discussed', label: 'Most Discussed', icon: <Filter className="w-4 h-4" /> },
  ];

  if (isLoading && articles.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Search Filters */}
      <SearchFilters onSearchChange={handleSearchChange} />

      {/* Action Buttons */}
      <div className="action-buttons mb-6">
        <div className="action-buttons-left">
          <h1 className="page-title">
            AI Crypto News Hub
          </h1>
          <div className="stats-display">
            <span>{filteredArticles.length} articles</span>
            <span className="stats-separator">•</span>
            <span>{articles.filter(a => a.status === 'approved').length} approved</span>
            <span className="stats-separator">•</span>
            <span>{articles.filter(a => a.status === 'pending').length} pending</span>
          </div>
        </div>
        
        <div className="action-buttons-right">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`refresh-btn ${isRefreshing ? 'spinning' : ''}`}
            title="Refresh articles"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => setIsSubmissionOpen(true)}
            className="submit-btn"
          >
            <Plus className="w-4 h-4" />
            Submit Article
          </button>
        </div>
      </div>

      {/* Description */}
      <div className="mb-8">
        <p className="text-gray-600">
          Curated crypto news powered by AI and community intelligence
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Legacy Filters (Optional - can be removed) */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Sort Options */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort by
            </label>
            <div className="flex flex-wrap gap-2">
              {sortOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => setSortBy(option.value)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    sortBy === option.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option.icon}
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tag Filter */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by tag
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedTag('')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  !selectedTag
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Tags
              </button>
              {getAllTags().slice(0, 5).map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedTag === tag
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Articles */}
      <div className="space-y-4">
        {filteredArticles.map(article => (
          <ArticleCard 
            key={article.id} 
            article={article}
            onUpvote={() => handleUpvote(article.id)}
            onDownvote={() => handleDownvote(article.id)}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredArticles.length === 0 && !isLoading && (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Filter className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="empty-state-title">
            No articles found
          </h3>
          <p className="empty-state-description">
            Try adjusting your filters or submit the first article!
          </p>
          <button
            onClick={() => setIsSubmissionOpen(true)}
            className="empty-state-button"
          >
            <Plus className="w-4 h-4" />
            Submit First Article
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && articles.length > 0 && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Article Submission Modal */}
      <ArticleSubmission
        isOpen={isSubmissionOpen}
        onClose={() => setIsSubmissionOpen(false)}
        onSuccess={handleSubmissionSuccess}
      />
    </div>
  );
};

export default NewsFeed;
