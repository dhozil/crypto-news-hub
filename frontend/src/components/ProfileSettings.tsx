'use client';

// Profile settings component
import { useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useGamification } from '@/hooks/useGamification';
import { 
  X, 
  User, 
  Bell, 
  Shield, 
  Globe, 
  Moon, 
  Sun, 
  Volume2,
  Eye,
  EyeOff,
  Save,
  RotateCcw,
  Settings
} from 'lucide-react';

interface ProfileSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProfileSettings = ({ isOpen, onClose }: ProfileSettingsProps) => {
  const { address } = useWallet();
  const { userStats } = useGamification();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(false);
  const [publicProfile, setPublicProfile] = useState(true);
  const [showBalance, setShowBalance] = useState(true);
  const [language, setLanguage] = useState('en');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Simulate saving settings
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Save to localStorage
      const settings = {
        isDarkMode,
        notifications,
        emailAlerts,
        publicProfile,
        showBalance,
        language
      };
      localStorage.setItem(`settings_${address}`, JSON.stringify(settings));
      
      console.log('Settings saved:', settings);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setIsDarkMode(false);
    setNotifications(true);
    setEmailAlerts(false);
    setPublicProfile(true);
    setShowBalance(true);
    setLanguage('en');
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Settings className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Profile Settings</h2>
              <p className="text-sm text-gray-600">Manage your account preferences</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Settings Content */}
        <div className="p-6 space-y-6">
          {/* Profile Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">Profile Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Wallet Address:</span>
                <span className="font-mono text-gray-900">
                  {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Current Level:</span>
                <span className="text-gray-900">Level {userStats?.level || 1}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total XP:</span>
                <span className="text-gray-900">{(userStats?.xp || 0).toLocaleString()} XP</span>
              </div>
            </div>
          </div>

          {/* Appearance Settings */}
          <div>
            <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Appearance
            </h3>
            <div className="space-y-4">
              {/* Dark Mode */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                  <div>
                    <div className="font-medium text-gray-900">Dark Mode</div>
                    <div className="text-sm text-gray-600">Toggle dark theme</div>
                  </div>
                </div>
                <button
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isDarkMode ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isDarkMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Language */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">Language</div>
                  <div className="text-sm text-gray-600">Choose your preferred language</div>
                </div>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="en">English</option>
                  <option value="id">Bahasa Indonesia</option>
                  <option value="zh">中文</option>
                  <option value="es">Español</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div>
            <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </h3>
            <div className="space-y-4">
              {/* Push Notifications */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">Push Notifications</div>
                  <div className="text-sm text-gray-600">Receive browser notifications</div>
                </div>
                <button
                  onClick={() => setNotifications(!notifications)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notifications ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Email Alerts */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">Email Alerts</div>
                  <div className="text-sm text-gray-600">Receive email notifications</div>
                </div>
                <button
                  onClick={() => setEmailAlerts(!emailAlerts)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    emailAlerts ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      emailAlerts ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Privacy Settings */}
          <div>
            <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Privacy
            </h3>
            <div className="space-y-4">
              {/* Public Profile */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">Public Profile</div>
                  <div className="text-sm text-gray-600">Make your profile visible to others</div>
                </div>
                <button
                  onClick={() => setPublicProfile(!publicProfile)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    publicProfile ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      publicProfile ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Show Balance */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  <div>
                    <div className="font-medium text-gray-900">Show Balance</div>
                    <div className="text-sm text-gray-600">Display your token balance publicly</div>
                  </div>
                </div>
                <button
                  onClick={() => setShowBalance(!showBalance)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    showBalance ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      showBalance ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Default
          </button>
          
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
