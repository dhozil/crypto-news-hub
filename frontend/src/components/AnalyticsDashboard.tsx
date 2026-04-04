'use client';

// Analytics dashboard component
import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  FileText, 
  Eye, 
  ThumbsUp, 
  ThumbsDown,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Clock,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';

interface AnalyticsData {
  overview: {
    totalArticles: number;
    totalUsers: number;
    totalViews: number;
    totalUpvotes: number;
    totalDownvotes: number;
    engagementRate: number;
    avgArticleScore: number;
  };
  timeSeries: {
    date: string;
    articles: number;
    users: number;
    views: number;
    engagement: number;
  }[];
  topArticles: {
    id: string;
    title: string;
    author: string;
    views: number;
    upvotes: number;
    downvotes: number;
    score: number;
    status: string;
  }[];
  topAuthors: {
    address: string;
    articles: number;
    totalViews: number;
    totalUpvotes: number;
    avgScore: number;
    level: number;
  }[];
  categories: {
    name: string;
    count: number;
    views: number;
    engagement: number;
  }[];
  userActivity: {
    hour: number;
    submissions: number;
    votes: number;
    views: number;
  }[];
}

const AnalyticsDashboard = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7d');
  const [activeTab, setActiveTab] = useState<'overview' | 'articles' | 'authors' | 'activity'>('overview');

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange]);

  const fetchAnalyticsData = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockData: AnalyticsData = {
        overview: {
          totalArticles: 1247,
          totalUsers: 892,
          totalViews: 45678,
          totalUpvotes: 3456,
          totalDownvotes: 234,
          engagementRate: 8.2,
          avgArticleScore: 0.73
        },
        timeSeries: Array.from({ length: 7 }, (_, i) => ({
          date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          articles: Math.floor(Math.random() * 50) + 100,
          users: Math.floor(Math.random() * 20) + 80,
          views: Math.floor(Math.random() * 2000) + 5000,
          engagement: Math.random() * 10 + 5
        })),
        topArticles: [
          {
            id: '1',
            title: 'Bitcoin Reaches New All-Time High',
            author: '0x1234...5678',
            views: 1234,
            upvotes: 89,
            downvotes: 3,
            score: 0.95,
            status: 'approved'
          },
          {
            id: '2',
            title: 'Ethereum 2.0 Staking Surpasses Expectations',
            author: '0xabcd...efgh',
            views: 987,
            upvotes: 76,
            downvotes: 5,
            score: 0.88,
            status: 'approved'
          },
          {
            id: '3',
            title: 'DeFi TVL Growth Analysis',
            author: '0x9876...5432',
            views: 876,
            upvotes: 65,
            downvotes: 8,
            score: 0.82,
            status: 'approved'
          }
        ],
        topAuthors: [
          {
            address: '0x1234...5678',
            articles: 23,
            totalViews: 12345,
            totalUpvotes: 567,
            avgScore: 0.84,
            level: 15
          },
          {
            address: '0xabcd...efgh',
            articles: 18,
            totalViews: 9876,
            totalUpvotes: 432,
            avgScore: 0.79,
            level: 12
          }
        ],
        categories: [
          { name: 'Bitcoin', count: 423, views: 12345, engagement: 9.2 },
          { name: 'Ethereum', count: 345, views: 9876, engagement: 8.7 },
          { name: 'DeFi', count: 289, views: 7654, engagement: 7.8 },
          { name: 'NFT', count: 156, views: 5432, engagement: 6.5 },
          { name: 'Regulation', count: 134, views: 4321, engagement: 5.9 }
        ],
        userActivity: Array.from({ length: 24 }, (_, i) => ({
          hour: i,
          submissions: Math.floor(Math.random() * 10) + 2,
          votes: Math.floor(Math.random() * 50) + 20,
          views: Math.floor(Math.random() * 200) + 100
        }))
      };
      
      setData(mockData);
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (isLoading) {
    return (
      <div className="analytics-dashboard">
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-spinner-lg"></div>
            <div className="loading-text">Loading Analytics...</div>
            <div className="loading-subtext">Please wait while we gather the data</div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="analytics-dashboard">
        <div className="error-container">
          <div className="error-title">
            <Activity className="w-5 h-5" />
            Failed to Load Analytics
          </div>
          <div className="error-message">
            Unable to fetch analytics data. Please try again later.
          </div>
          <div className="error-actions">
            <button className="error-button-primary" onClick={fetchAnalyticsData}>
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-dashboard">
      {/* Header */}
      <div className="analytics-header">
        <div className="analytics-title">
          <BarChart3 className="w-6 h-6" />
          Analytics Dashboard
        </div>
        
        <div className="analytics-controls">
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
            className="analytics-select"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          
          <button className="analytics-button" onClick={fetchAnalyticsData}>
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          
          <button className="analytics-button">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="analytics-overview">
        <div className="overview-grid">
          <div className="overview-card">
            <div className="overview-icon">
              <FileText className="w-6 h-6 text-blue-500" />
            </div>
            <div className="overview-content">
              <div className="overview-value">{formatNumber(data.overview.totalArticles)}</div>
              <div className="overview-label">Total Articles</div>
              <div className="overview-change positive">+12.5%</div>
            </div>
          </div>
          
          <div className="overview-card">
            <div className="overview-icon">
              <Users className="w-6 h-6 text-green-500" />
            </div>
            <div className="overview-content">
              <div className="overview-value">{formatNumber(data.overview.totalUsers)}</div>
              <div className="overview-label">Active Users</div>
              <div className="overview-change positive">+8.3%</div>
            </div>
          </div>
          
          <div className="overview-card">
            <div className="overview-icon">
              <Eye className="w-6 h-6 text-purple-500" />
            </div>
            <div className="overview-content">
              <div className="overview-value">{formatNumber(data.overview.totalViews)}</div>
              <div className="overview-label">Total Views</div>
              <div className="overview-change positive">+23.7%</div>
            </div>
          </div>
          
          <div className="overview-card">
            <div className="overview-icon">
              <TrendingUp className="w-6 h-6 text-orange-500" />
            </div>
            <div className="overview-content">
              <div className="overview-value">{data.overview.engagementRate.toFixed(1)}%</div>
              <div className="overview-label">Engagement Rate</div>
              <div className="overview-change negative">-2.1%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="analytics-tabs">
        <button
          onClick={() => setActiveTab('overview')}
          className={`analytics-tab ${activeTab === 'overview' ? 'active' : ''}`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('articles')}
          className={`analytics-tab ${activeTab === 'articles' ? 'active' : ''}`}
        >
          Top Articles
        </button>
        <button
          onClick={() => setActiveTab('authors')}
          className={`analytics-tab ${activeTab === 'authors' ? 'active' : ''}`}
        >
          Top Authors
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`analytics-tab ${activeTab === 'activity' ? 'active' : ''}`}
        >
          Activity
        </button>
      </div>

      {/* Tab Content */}
      <div className="analytics-content">
        {activeTab === 'overview' && (
          <div className="analytics-grid">
            {/* Time Series Chart */}
            <div className="analytics-card">
              <div className="analytics-card-header">
                <h3 className="analytics-card-title">
                  <Activity className="w-5 h-5" />
                  Activity Trends
                </h3>
              </div>
              <div className="analytics-card-body">
                <div className="chart-placeholder">
                  <div className="chart-bars">
                    {data.timeSeries.map((item, index) => (
                      <div key={index} className="chart-bar-group">
                        <div className="chart-bar" style={{ height: `${(item.articles / 150) * 100}%` }}></div>
                        <div className="chart-label">{formatDate(item.date)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Categories */}
            <div className="analytics-card">
              <div className="analytics-card-header">
                <h3 className="analytics-card-title">
                  <PieChart className="w-5 h-5" />
                  Categories
                </h3>
              </div>
              <div className="analytics-card-body">
                <div className="category-list">
                  {data.categories.map((category, index) => (
                    <div key={index} className="category-item">
                      <div className="category-info">
                        <div className="category-name">{category.name}</div>
                        <div className="category-stats">
                          {category.count} articles • {formatNumber(category.views)} views
                        </div>
                      </div>
                      <div className="category-engagement">
                        {category.engagement.toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'articles' && (
          <div className="analytics-card">
            <div className="analytics-card-header">
              <h3 className="analytics-card-title">
                <FileText className="w-5 h-5" />
                Top Performing Articles
              </h3>
            </div>
            <div className="analytics-card-body">
              <div className="articles-table">
                <div className="table-header">
                  <div>Article</div>
                  <div>Author</div>
                  <div>Views</div>
                  <div>Score</div>
                </div>
                {data.topArticles.map((article) => (
                  <div key={article.id} className="table-row">
                    <div className="article-title">{article.title}</div>
                    <div className="article-author">{formatAddress(article.author)}</div>
                    <div className="article-views">{formatNumber(article.views)}</div>
                    <div className="article-score">
                      <div className="score-badge high">{(article.score * 100).toFixed(0)}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'authors' && (
          <div className="analytics-card">
            <div className="analytics-card-header">
              <h3 className="analytics-card-title">
                <Users className="w-5 h-5" />
                Top Authors
              </h3>
            </div>
            <div className="analytics-card-body">
              <div className="authors-table">
                <div className="table-header">
                  <div>Author</div>
                  <div>Articles</div>
                  <div>Views</div>
                  <div>Avg Score</div>
                </div>
                {data.topAuthors.map((author, index) => (
                  <div key={index} className="table-row">
                    <div className="author-info">
                      <div className="author-address">{formatAddress(author.address)}</div>
                      <div className="author-level">Level {author.level}</div>
                    </div>
                    <div className="author-articles">{author.articles}</div>
                    <div className="author-views">{formatNumber(author.totalViews)}</div>
                    <div className="author-score">
                      <div className="score-badge medium">{(author.avgScore * 100).toFixed(0)}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="analytics-card">
            <div className="analytics-card-header">
              <h3 className="analytics-card-title">
                <Clock className="w-5 h-5" />
                Hourly Activity
              </h3>
            </div>
            <div className="analytics-card-body">
              <div className="activity-chart">
                <div className="activity-bars">
                  {data.userActivity.map((hour, index) => (
                    <div key={index} className="activity-bar-group">
                      <div className="activity-bar" style={{ height: `${(hour.views / 300) * 100}%` }}></div>
                      <div className="activity-label">{hour.hour}:00</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
