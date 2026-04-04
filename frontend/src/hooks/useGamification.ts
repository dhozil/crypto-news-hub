'use client';

// Gamification and achievement system
import { useState, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';

interface UserStats {
  level: number;
  xp: number;
  xpToNextLevel: number;
  totalArticles: number;
  totalUpvotes: number;
  totalDownvotes: number;
  qualityScore: number;
  streak: number;
  achievements: Achievement[];
  rank: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  unlocked: boolean;
  unlockedAt?: Date;
  progress: number;
  maxProgress: number;
}

interface GamificationHook {
  userStats: UserStats | null;
  isLoading: boolean;
  addXP: (amount: number, reason: string) => Promise<void>;
  checkAchievements: () => Promise<void>;
  getLevelProgress: () => number;
  getNextLevelXP: (currentLevel?: number) => number;
}

// Achievement definitions
const ACHIEVEMENTS: Omit<Achievement, 'unlocked' | 'unlockedAt' | 'progress'>[] = [
  {
    id: 'first_article',
    title: 'First Steps',
    description: 'Submit your first article',
    icon: '📝',
    xpReward: 50,
    maxProgress: 1,
  },
  {
    id: 'article_10',
    title: 'Prolific Writer',
    description: 'Submit 10 articles',
    icon: '📚',
    xpReward: 200,
    maxProgress: 10,
  },
  {
    id: 'article_50',
    title: 'Content Master',
    description: 'Submit 50 articles',
    icon: '👑',
    xpReward: 1000,
    maxProgress: 50,
  },
  {
    id: 'upvote_100',
    title: 'Community Favorite',
    description: 'Receive 100 upvotes',
    icon: '👍',
    xpReward: 300,
    maxProgress: 100,
  },
  {
    id: 'quality_90',
    title: 'Quality Content',
    description: 'Maintain 90% quality score',
    icon: '⭐',
    xpReward: 500,
    maxProgress: 90,
  },
  {
    id: 'streak_7',
    title: 'Weekly Warrior',
    description: 'Submit articles for 7 consecutive days',
    icon: '🔥',
    xpReward: 350,
    maxProgress: 7,
  },
  {
    id: 'streak_30',
    title: 'Monthly Champion',
    description: 'Submit articles for 30 consecutive days',
    icon: '🏆',
    xpReward: 1500,
    maxProgress: 30,
  },
  {
    id: 'early_bird',
    title: 'Early Bird',
    description: 'Submit 5 articles before 9 AM',
    icon: '🌅',
    xpReward: 150,
    maxProgress: 5,
  },
  {
    id: 'night_owl',
    title: 'Night Owl',
    description: 'Submit 5 articles after 10 PM',
    icon: '🦉',
    xpReward: 150,
    maxProgress: 5,
  },
  {
    id: 'trending_topic',
    title: 'Trendsetter',
    description: 'Have an article in trending topics',
    icon: '📈',
    xpReward: 250,
    maxProgress: 1,
  },
];

// XP requirements for levels
const LEVEL_XP_REQUIREMENTS = [
  0,     // Level 1
  100,   // Level 2
  250,   // Level 3
  500,   // Level 4
  1000,  // Level 5
  2000,  // Level 6
  3500,  // Level 7
  5000,  // Level 8
  7500,  // Level 9
  10000, // Level 10
  15000, // Level 11
  20000, // Level 12
  30000, // Level 13
  40000, // Level 14
  50000, // Level 15
];

// Rank titles based on level
const getRankTitle = (level: number): string => {
  if (level <= 2) return 'Novice Writer';
  if (level <= 5) return 'Content Creator';
  if (level <= 8) return 'Expert Author';
  if (level <= 12) return 'Master Writer';
  if (level <= 15) return 'Legendary Author';
  return 'Crypto News Legend';
};

export const useGamification = (): GamificationHook => {
  const { address, isConnected } = useWallet();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Calculate level based on XP
  const calculateLevel = (xp: number): number => {
    for (let i = LEVEL_XP_REQUIREMENTS.length - 1; i >= 0; i--) {
      if (xp >= LEVEL_XP_REQUIREMENTS[i]) {
        return i + 1;
      }
    }
    return 1;
  };

  // Get XP required for next level
  const getNextLevelXP = (currentLevel?: number): number => {
    const level = currentLevel || (userStats?.level || 1);
    if (level >= LEVEL_XP_REQUIREMENTS.length) {
      return LEVEL_XP_REQUIREMENTS[LEVEL_XP_REQUIREMENTS.length - 1];
    }
    return LEVEL_XP_REQUIREMENTS[level];
  };

  // Get level progress percentage
  const getLevelProgress = (): number => {
    if (!userStats) return 0;
    
    const currentLevelXP = LEVEL_XP_REQUIREMENTS[userStats.level - 1] || 0;
    const nextLevelXP = getNextLevelXP(userStats.level);
    const xpInCurrentLevel = userStats.xp - currentLevelXP;
    const xpNeededForNextLevel = nextLevelXP - currentLevelXP;
    
    return xpNeededForNextLevel > 0 ? (xpInCurrentLevel / xpNeededForNextLevel) * 100 : 100;
  };

  // Add XP to user
  const addXP = async (amount: number, reason: string): Promise<void> => {
    if (!isConnected || !address) return;

    setIsLoading(true);
    try {
      // In a real implementation, this would call the smart contract
      // For now, we'll simulate it with local state
      const newXP = (userStats?.xp || 0) + amount;
      const newLevel = calculateLevel(newXP);
      
      setUserStats(prev => prev ? {
        ...prev,
        xp: newXP,
        level: newLevel,
        xpToNextLevel: getNextLevelXP(newLevel),
      } : null);

      // Check for new achievements
      await checkAchievements();
      
      console.log(`Added ${amount} XP for: ${reason}`);
    } catch (error) {
      console.error('Failed to add XP:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Check and unlock achievements
  const checkAchievements = async (): Promise<void> => {
    if (!userStats) return;

    setIsLoading(true);
    try {
      const updatedAchievements = userStats.achievements.map(achievement => {
        if (achievement.unlocked) return achievement;

        const achievementDef = ACHIEVEMENTS.find(a => a.id === achievement.id);
        if (!achievementDef) return achievement;

        let progress = achievement.progress;
        let shouldUnlock = false;

        // Calculate progress based on user stats
        switch (achievement.id) {
          case 'first_article':
            progress = Math.min(userStats.totalArticles, 1);
            shouldUnlock = progress >= 1;
            break;
          case 'article_10':
            progress = userStats.totalArticles;
            shouldUnlock = progress >= 10;
            break;
          case 'article_50':
            progress = userStats.totalArticles;
            shouldUnlock = progress >= 50;
            break;
          case 'upvote_100':
            progress = userStats.totalUpvotes;
            shouldUnlock = progress >= 100;
            break;
          case 'quality_90':
            progress = Math.round(userStats.qualityScore);
            shouldUnlock = progress >= 90;
            break;
          case 'streak_7':
            progress = Math.min(userStats.streak, 7);
            shouldUnlock = progress >= 7;
            break;
          case 'streak_30':
            progress = Math.min(userStats.streak, 30);
            shouldUnlock = progress >= 30;
            break;
          default:
            break;
        }

        if (shouldUnlock && !achievement.unlocked) {
          // Unlock achievement and add XP reward
          return {
            ...achievement,
            unlocked: true,
            unlockedAt: new Date(),
            progress: achievementDef.maxProgress,
          };
        }

        return {
          ...achievement,
          progress,
        };
      });

      setUserStats(prev => prev ? {
        ...prev,
        achievements: updatedAchievements,
      } : null);

    } catch (error) {
      console.error('Failed to check achievements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load user stats from localStorage or API
  useEffect(() => {
    if (!isConnected || !address) {
      setUserStats(null);
      return;
    }

    const loadUserStats = async () => {
      setIsLoading(true);
      try {
        // In a real implementation, this would fetch from the blockchain/API
        // For now, we'll use localStorage with mock data
        const storedStats = localStorage.getItem(`gamification_${address}`);
        
        if (storedStats) {
          const stats = JSON.parse(storedStats);
          setUserStats(stats);
        } else {
          // Initialize with default stats
          const defaultStats: UserStats = {
            level: 1,
            xp: 0,
            xpToNextLevel: 100,
            totalArticles: 0,
            totalUpvotes: 0,
            totalDownvotes: 0,
            qualityScore: 0,
            streak: 0,
            achievements: ACHIEVEMENTS.map(ach => ({
              ...ach,
              unlocked: false,
              progress: 0,
            })),
            rank: getRankTitle(1),
          };
          setUserStats(defaultStats);
          localStorage.setItem(`gamification_${address}`, JSON.stringify(defaultStats));
        }
      } catch (error) {
        console.error('Failed to load user stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserStats();
  }, [isConnected, address]);

  // Save stats to localStorage when they change
  useEffect(() => {
    if (userStats && address) {
      localStorage.setItem(`gamification_${address}`, JSON.stringify(userStats));
    }
  }, [userStats, address]);

  return {
    userStats,
    isLoading,
    addXP,
    checkAchievements,
    getLevelProgress,
    getNextLevelXP,
  };
};
