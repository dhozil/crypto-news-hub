'use client';

import Header from '@/components/Header';
import NewsFeed from '@/components/NewsFeed';
import { useContract } from '@/hooks/useContract';
import { trendingTopics, newsSources } from '@/data/mockData';
import { TrendingUp, Globe, Users, Award, BarChart3, Zap, Shield, Star } from 'lucide-react';
import { useMemo } from 'react';

const HomePage = () => {
  const { articles, userRewards, isLoading } = useContract();

  // Calculate real stats from blockchain data
  const stats = useMemo(() => {
    const totalArticles = articles.length;
    
    // Articles from today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const articlesToday = articles.filter(a => new Date(a.timestamp) >= today).length;
    
    // Total rewards (format as K if > 1000)
    const totalRewards = userRewards.totalEarned || 0;
    
    // Average quality score
    const avgScore = articles.length > 0
      ? (articles.reduce((sum, a) => sum + (a.score || 0), 0) / articles.length * 100).toFixed(1)
      : '0.0';

    // Unique authors (for active users stat)
    const uniqueAuthors = new Set(articles.map(a => a.authorAddress)).size;

    return {
      activeUsers: uniqueAuthors || 1,
      articlesToday,
      totalRewards: totalRewards > 1000 ? `${(totalRewards / 1000).toFixed(1)}K` : totalRewards.toString(),
      qualityScore: `${avgScore}%`
    };
  }, [articles, userRewards]);

  return (
    <div className="main-container">
      <Header />
      <div className="main-content">
        {/* Main Content Area */}
        <div className="content-area">
          {/* Stats Grid */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">{isLoading ? '...' : stats.activeUsers}</div>
              <div className="stat-label">Active Users</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{isLoading ? '...' : stats.articlesToday}</div>
              <div className="stat-label">Articles Today</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{isLoading ? '...' : stats.totalRewards}</div>
              <div className="stat-label">Total Rewards</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{isLoading ? '...' : stats.qualityScore}</div>
              <div className="stat-label">Quality Score</div>
            </div>
          </div>



          {/* News Feed */}

          <NewsFeed />

        </div>



        {/* Sidebar */}

        <div className="sidebar">

          {/* Trending Topics */}

          <div className="sidebar-card">

            <div className="sidebar-title">

              <TrendingUp className="w-5 h-5" />

              Trending Topics

            </div>

            <div className="sidebar-list">

              {trendingTopics.map((topic, index) => (

                <div key={topic.topic} className="sidebar-item">

                  <div className="flex items-center gap-2">

                    <span className="sidebar-item-count">

                      #{index + 1}

                    </span>

                    <span className="sidebar-item-text">

                      {topic.topic}

                    </span>

                  </div>

                  <div className="flex items-center gap-2">

                    <span className="sidebar-item-count">

                      {topic.count}

                    </span>

                    <span className={`sidebar-item-change ${

                      topic.change.startsWith('+') 

                        ? 'positive' 

                        : 'negative'

                    }`}>

                      {topic.change}

                    </span>

                  </div>

                </div>

              ))}

            </div>

          </div>



          {/* News Sources */}

          <div className="sidebar-card">

            <div className="sidebar-title">

              <Globe className="w-5 h-5" />

              News Sources

            </div>

            <div className="sidebar-list">

              {newsSources.map((source) => (

                <div key={source.name} className="sidebar-item">

                  <span className="sidebar-item-text">

                    {source.name}

                  </span>

                  <div className={`sidebar-status-dot ${

                    source.isActive 

                      ? 'active' 

                      : 'inactive'

                  }`} />

                </div>

              ))}

            </div>

          </div>



          {/* Quick Actions */}

          <div className="sidebar-card">

            <div className="sidebar-title">

              <Zap className="w-5 h-5" />

              Quick Actions

            </div>

            <div className="space-y-3">

              <button className="btn btn-primary w-full">

                Submit Article

              </button>

              <button className="btn btn-secondary w-full">

                View Rewards

              </button>

              <button className="btn btn-outline w-full">

                Governance

              </button>

            </div>

          </div>



          {/* Platform Features */}

          <div className="sidebar-card">

            <div className="sidebar-title">

              <Shield className="w-5 h-5" />

              Platform Features

            </div>

            <div className="sidebar-list">

              <div className="sidebar-item">

                <Star className="w-4 h-4" />

                AI-Powered Curation

              </div>

              <div className="sidebar-item">

                <BarChart3 className="w-4 h-4" />

                Real-time Analytics

              </div>

              <div className="sidebar-item">

                <Users className="w-4 h-4" />

                Community Governance

              </div>

              <div className="sidebar-item">

                <Award className="w-4 h-4" />

                Token Rewards

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>

  );

};



export default HomePage;

