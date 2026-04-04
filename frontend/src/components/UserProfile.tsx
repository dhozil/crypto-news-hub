'use client';

// User profile and gamification stats component
import { useState } from 'react';
import { useGamification } from '@/hooks/useGamification';
import { useWallet } from '@/hooks/useWallet';
import { 
  Trophy, 
  Star, 
  Target, 
  Zap, 
  Award, 
  TrendingUp, 
  Calendar,
  User,
  Settings,
  LogOut
} from 'lucide-react';

interface UserProfileProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const UserProfile = ({ isOpen, onClose }: UserProfileProps = {}) => {
  const { address, disconnectWallet } = useWallet();
  const { userStats, isLoading, getLevelProgress } = useGamification();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'stats' | 'achievements'>('stats');

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatXP = (xp: number) => {
    return xp.toLocaleString();
  };

  if (!address) return null;

  return (
    <div className="relative">
      {/* Profile Button */}
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <User className="w-4 h-4" />
          </div>
          <div className="text-left">
            <div className="text-sm font-semibold">
              Level {userStats?.level || 1}
            </div>
            <div className="text-xs opacity-90">
              {userStats?.rank || 'Novice Writer'}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs opacity-90">XP</div>
          <div className="text-sm font-bold">
            {formatXP(userStats?.xp || 0)}
          </div>
        </div>
      </button>

      {/* Profile Dropdown */}
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-4 text-white">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-semibold">{formatAddress(address)}</div>
                  <div className="text-sm opacity-90">{userStats?.rank || 'Novice Writer'}</div>
                </div>
              </div>
              <button
                onClick={() => setIsDropdownOpen(false)}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>

            {/* Level Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Level {userStats?.level || 1}</span>
                <span>{formatXP(userStats?.xpToNextLevel || 100)} XP to next level</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div 
                  className="bg-white rounded-full h-2 transition-all duration-500"
                  style={{ width: `${getLevelProgress()}%` }}
                />
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === 'stats'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Stats
              </div>
            </button>
            <button
              onClick={() => setActiveTab('achievements')}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === 'achievements'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Trophy className="w-4 h-4" />
                Achievements
              </div>
            </button>
          </div>

          {/* Content */}
          <div className="p-4 max-h-96 overflow-y-auto">
            {activeTab === 'stats' ? (
              <StatsTab userStats={userStats} isLoading={isLoading} />
            ) : (
              <AchievementsTab userStats={userStats} isLoading={isLoading} />
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={() => {
                disconnectWallet();
                setIsDropdownOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Disconnect Wallet
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Stats Tab Component
const StatsTab = ({ userStats, isLoading }: { userStats: any, isLoading: boolean }) => {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const stats = [
    {
      icon: <Target className="w-5 h-5 text-blue-600" />,
      label: 'Total Articles',
      value: userStats?.totalArticles || 0,
      color: 'text-blue-600',
    },
    {
      icon: <Zap className="w-5 h-5 text-yellow-600" />,
      label: 'Total Upvotes',
      value: userStats?.totalUpvotes || 0,
      color: 'text-yellow-600',
    },
    {
      icon: <Star className="w-5 h-5 text-purple-600" />,
      label: 'Quality Score',
      value: `${userStats?.qualityScore || 0}%`,
      color: 'text-purple-600',
    },
    {
      icon: <Calendar className="w-5 h-5 text-green-600" />,
      label: 'Current Streak',
      value: `${userStats?.streak || 0} days`,
      color: 'text-green-600',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              {stat.icon}
              <span className="text-sm text-gray-600">{stat.label}</span>
            </div>
            <div className={`text-2xl font-bold ${stat.color}`}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-3">Recent Activity</h4>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Daily streak maintained!</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Article submitted</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span>New achievement unlocked</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Achievements Tab Component
const AchievementsTab = ({ userStats, isLoading }: { userStats: any, isLoading: boolean }) => {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const achievements = userStats?.achievements || [];
  const unlockedCount = achievements.filter((a: any) => a.unlocked).length;
  const totalCount = achievements.length;

  return (
    <div className="space-y-4">
      {/* Achievement Summary */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-gray-900">Achievement Progress</h4>
            <p className="text-sm text-gray-600">{unlockedCount} of {totalCount} unlocked</p>
          </div>
          <div className="text-2xl font-bold text-purple-600">
            {Math.round((unlockedCount / totalCount) * 100)}%
          </div>
        </div>
        <div className="w-full bg-white rounded-full h-2 mt-3">
          <div 
            className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-full h-2 transition-all duration-500"
            style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
          />
        </div>
      </div>

      {/* Achievement List */}
      <div className="space-y-3">
        {achievements.map((achievement: any, index: number) => (
          <div
            key={achievement.id}
            className={`border rounded-lg p-4 transition-all duration-300 ${
              achievement.unlocked
                ? 'border-purple-200 bg-purple-50'
                : 'border-gray-200 bg-gray-50 opacity-60'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`text-2xl ${achievement.unlocked ? '' : 'grayscale'}`}>
                {achievement.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h5 className={`font-semibold ${
                    achievement.unlocked ? 'text-gray-900' : 'text-gray-600'
                  }`}>
                    {achievement.title}
                  </h5>
                  {achievement.unlocked && (
                    <Award className="w-4 h-4 text-purple-600" />
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                
                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Progress</span>
                    <span>{achievement.progress}/{achievement.maxProgress}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-500 ${
                        achievement.unlocked
                          ? 'bg-purple-600'
                          : 'bg-gray-400'
                      }`}
                      style={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                    />
                  </div>
                </div>

                {/* XP Reward */}
                <div className="flex items-center gap-1 mt-2 text-xs">
                  <Zap className="w-3 h-3 text-yellow-600" />
                  <span className="text-yellow-600 font-medium">
                    +{achievement.xpReward} XP
                  </span>
                  {achievement.unlocked && achievement.unlockedAt && (
                    <span className="text-gray-500">
                      • Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserProfile;
