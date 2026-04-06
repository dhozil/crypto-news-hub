'use client';

// Header component with navigation
import WalletConnect from './WalletConnect';
import { Newspaper, TrendingUp, Users, Settings, Menu, X, Moon, Sun } from 'lucide-react';
import { useState, useEffect } from 'react';

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(prefersDark);
    
    // Apply initial theme
    if (prefersDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const navigation = [
    { name: 'News Feed', href: '/news', icon: Newspaper },
    { name: 'Trending', href: '/trending', icon: TrendingUp },
    { name: 'Community', href: '/community', icon: Users },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <header className="header">
      <div className="header-container">
        {/* Logo */}
        <div className="flex items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Newspaper className="w-6 h-6 text-white" />
            </div>
            <div className="logo">
              Crypto News Hub
            </div>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="nav">
          <div className="nav-links">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="nav-link active"
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </a>
            ))}
          </div>

          {/* Right Side Controls */}
          <div className="flex items-center gap-4">
            {/* Dark Mode Toggle */}
            <div className="flex items-center gap-2">
              <Moon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <button
                onClick={toggleDarkMode}
                className={`dark-mode-toggle ${isDarkMode ? 'active' : ''}`}
                title="Toggle dark mode"
              >
                <div className="dark-mode-toggle-handle">
                  {isDarkMode ? (
                    <Sun className="dark-mode-toggle-icon text-yellow-500" />
                  ) : (
                    <Moon className="dark-mode-toggle-icon text-blue-500" />
                  )}
                </div>
              </button>
              <Sun className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </div>
            
            {/* Wallet Connect with Sidebar Menu */}
            <WalletConnect />
          </div>
        </nav>

        {/* Mobile menu button */}
        <div className="md:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-700">
          <div className="px-4 py-4 space-y-2">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium dark:text-gray-300 dark:hover:text-blue-400 dark:hover:bg-blue-900/20"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </a>
            ))}
            
            {/* Mobile Dark Mode Toggle */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Moon className="w-4 h-4" />
                Dark Mode
                <Sun className="w-4 h-4" />
              </span>
              <button
                onClick={toggleDarkMode}
                className={`dark-mode-toggle ${isDarkMode ? 'active' : ''}`}
              >
                <div className="dark-mode-toggle-handle">
                  {isDarkMode ? (
                    <Sun className="dark-mode-toggle-icon text-yellow-500" />
                  ) : (
                    <Moon className="dark-mode-toggle-icon text-blue-500" />
                  )}
                </div>
              </button>
            </div>
            
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              {/* Mobile wallet connection handled by main WalletConnect */}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
