'use client';

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
  const { articles, isLoading, error, upvoteArticle, downvoteArticle, refreshData } = useContract();
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

  // ✅ FETCH SUPABASE
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
          summary: item.content?.slice(0, 100) || "", // ✅ tambahin
          source: "Supabase", // ✅ tambahin
          author: "AI Bot",
          authorAddress: "0x0000000000000000000000000000000000000000", // ✅ dummy
          timestamp: new Date(item.created_at),
          tags: ["AI Generated", "Crypto"],
          upvotes: 0,
          downvotes: 0,
          score: 0,
          status: "approved",
          isAIGenerated: true // ✅ tambahin
        }));

        setDbArticles(mapped);
      }
    };

    fetchFromDB();
  }, []);

  // ✅ FILTER + SORT (GABUNG CONTRACT + DB)
  useEffect(() => {
    let filtered = [...articles, ...dbArticles];

    if (searchFilters.query) {
      const query = searchFilters.query.toLowerCase();
      filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(query) ||
        article.content.toLowerCase().includes(query)
      );
    }

    if (selectedTag) {
      filtered = filtered.filter(article =>
        article.tags.includes(selectedTag)
      );
    }

    const sortOption = searchFilters.sortBy === 'latest' ? sortBy : searchFilters.sortBy;

    filtered.sort((a, b) => {
      switch (sortOption) {
        case 'latest':
          return b.timestamp.getTime() - a.timestamp.getTime();
        case 'trending':
          return (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes);
        case 'quality':
          return b.score - a.score;
        default:
          return 0;
      }
    });

    setFilteredArticles(filtered);

  }, [articles, dbArticles, sortBy, selectedTag, searchFilters]);

  const handleSearchChange = (newFilters: SearchState) => {
    setSearchFilters(newFilters);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshData();
    setIsRefreshing(false);
  };

  const handleUpvote = async (id: string) => {
    await upvoteArticle(id);
    await addXP(5, 'Upvote');
  };

  const handleDownvote = async (id: string) => {
    await downvoteArticle(id);
    await addXP(3, 'Downvote');
  };

  if (isLoading && filteredArticles.length === 0) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4">

      <SearchFilters onSearchChange={handleSearchChange} />

      <div className="flex justify-between mb-4">
        <h1 className="text-xl font-bold">Crypto News</h1>
        <button onClick={handleRefresh}>
          <RefreshCw />
        </button>
      </div>

      {filteredArticles.map(article => (
        <ArticleCard
          key={article.id}
          article={article}
          onUpvote={() => handleUpvote(article.id)}
          onDownvote={() => handleDownvote(article.id)}
        />
      ))}

      <ArticleSubmission
        isOpen={isSubmissionOpen}
        onClose={() => setIsSubmissionOpen(false)}
        onSuccess={() => addXP(25, 'Submit')}
      />

    </div>
  );
};

export default NewsFeed;
