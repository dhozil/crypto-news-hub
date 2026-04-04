'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Calendar, Tag, X } from 'lucide-react';

interface SearchState {
  query: string;
  category: string;
  dateRange: string;
  author: string;
  sortBy: string;
}

interface SearchFiltersProps {
  onSearchChange: (searchState: SearchState) => void;
  initialFilters?: Partial<SearchState>;
}

const SearchFilters: React.FC<SearchFiltersProps> = ({ 
  onSearchChange, 
  initialFilters = {} 
}) => {
  const [searchState, setSearchState] = useState<SearchState>({
    query: '',
    category: 'all',
    dateRange: 'all',
    author: '',
    sortBy: 'latest',
    ...initialFilters
  });

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'defi', label: 'DeFi' },
    { value: 'nft', label: 'NFT' },
    { value: 'gaming', label: 'Gaming' },
    { value: 'metaverse', label: 'Metaverse' },
    { value: 'trading', label: 'Trading' },
    { value: 'mining', label: 'Mining' },
    { value: 'dao', label: 'DAO' }
  ];

  const dateRanges = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' }
  ];

  const sortOptions = [
    { value: 'latest', label: 'Latest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'popular', label: 'Most Popular' },
    { value: 'trending', label: 'Trending' },
    { value: 'quality', label: 'Highest Quality' }
  ];

  useEffect(() => {
    onSearchChange(searchState);
  }, [searchState, onSearchChange]);

  const handleInputChange = (field: keyof SearchState, value: string) => {
    setSearchState(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setSearchState({
      query: '',
      category: 'all',
      dateRange: 'all',
      author: '',
      sortBy: 'latest'
    });
  };

  const activeFiltersCount = Object.entries(searchState).filter(
    ([key, value]) => key !== 'query' && key !== 'sortBy' && value !== 'all' && value !== ''
  ).length;

  return (
    <div className="search-filters">
      {/* Main Search Bar */}
      <div className="search-bar-container">
        <div className="search-input-wrapper">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search articles, topics, authors..."
            value={searchState.query}
            onChange={(e) => handleInputChange('query', e.target.value)}
            className="search-input"
          />
          {searchState.query && (
            <button
              onClick={() => handleInputChange('query', '')}
              className="clear-search-btn"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        
        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className={`filter-toggle-btn ${isFilterOpen ? 'active' : ''}`}
        >
          <Filter className="w-4 h-4" />
          Filters
          {activeFiltersCount > 0 && (
            <span className="filter-count">{activeFiltersCount}</span>
          )}
        </button>
      </div>

      {/* Advanced Filters Panel */}
      {isFilterOpen && (
        <div className="filters-panel">
          <div className="filters-grid">
            {/* Category Filter */}
            <div className="filter-group">
              <label className="filter-label">
                <Tag className="w-4 h-4" />
                Category
              </label>
              <select
                value={searchState.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="filter-select"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Filter */}
            <div className="filter-group">
              <label className="filter-label">
                <Calendar className="w-4 h-4" />
                Date Range
              </label>
              <select
                value={searchState.dateRange}
                onChange={(e) => handleInputChange('dateRange', e.target.value)}
                className="filter-select"
              >
                {dateRanges.map(range => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Author Filter */}
            <div className="filter-group">
              <label className="filter-label">
                <Search className="w-4 h-4" />
                Author
              </label>
              <input
                type="text"
                placeholder="Search by author..."
                value={searchState.author}
                onChange={(e) => handleInputChange('author', e.target.value)}
                className="filter-input"
              />
            </div>

            {/* Sort By */}
            <div className="filter-group">
              <label className="filter-label">
                <Filter className="w-4 h-4" />
                Sort By
              </label>
              <select
                value={searchState.sortBy}
                onChange={(e) => handleInputChange('sortBy', e.target.value)}
                className="filter-select"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Filter Actions */}
          <div className="filter-actions">
            <button
              onClick={clearFilters}
              className="clear-filters-btn"
            >
              Clear All Filters
            </button>
            <button
              onClick={() => setIsFilterOpen(false)}
              className="apply-filters-btn"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="active-filters">
          <div className="active-filters-list">
            {searchState.category !== 'all' && (
              <span className="active-filter-tag">
                Category: {categories.find(c => c.value === searchState.category)?.label}
                <button onClick={() => handleInputChange('category', 'all')}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {searchState.dateRange !== 'all' && (
              <span className="active-filter-tag">
                Date: {dateRanges.find(d => d.value === searchState.dateRange)?.label}
                <button onClick={() => handleInputChange('dateRange', 'all')}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {searchState.author && (
              <span className="active-filter-tag">
                Author: {searchState.author}
                <button onClick={() => handleInputChange('author', '')}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchFilters;
