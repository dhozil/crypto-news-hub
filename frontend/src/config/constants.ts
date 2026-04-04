// Configuration for contract addresses and network settings
export const CONTRACT_ADDRESSES = {
  // Deployed GenLayer Bradbury testnet addresses
  contentRegistry: '0xC9b25E9548CFE0F3E02DB8EE87596C1A2Eb7F520',
  rewardSystem: '0xF5788C609357DC1440AAC302D55e20946b187a4C',
  governance: '0xabcdef1234567890abcdef1234567890abcdef12',
  
  // Local development addresses
  local: {
    contentRegistry: '0xlocalhost:8545',
    rewardSystem: '0xlocalhost:8545',
    governance: '0xlocalhost:8545',
  }
};

export const NETWORK_CONFIG = {
  // GenLayer Testnet Chain
  testnet: {
    chainId: '0x107D', // 4221 in hex - GenLayer Testnet Chain
    chainName: 'GenLayer Testnet Chain',
    nativeCurrency: {
      name: 'GEN',
      symbol: 'GEN',
      decimals: 18,
    },
    rpcUrls: [
      'https://rpc.testnet-chain.genlayer.com',
      'https://testnet-chain.genlayer.com',
      'https://genlayer-testnet.public.blastapi.io'
    ],
    blockExplorerUrls: [
      'https://explorer.testnet-chain.genlayer.com',
      'https://testnet-explorer.genlayer.com'
    ],
  },
  
  // Local development
  localhost: {
    chainId: '0x7a69', // 31337
    chainName: 'GenLayer Local',
    nativeCurrency: {
      name: 'GEN',
      symbol: 'GEN',
      decimals: 18,
    },
    rpcUrls: ['http://localhost:8545'],
  },
};

export const DEFAULT_NETWORK = 'testnet';

export const API_ENDPOINTS = {
  // News fetching API endpoints
  newsSources: [
    'https://api.coindesk.com/v1/news',
    'https://api.cointelegraph.com/news',
    'https://www.theblock.co/api/news',
  ],
  
  // AI/ML endpoints
  aiValidation: 'https://api.genlayer.com/validate',
  aiSummarization: 'https://api.genlayer.com/summarize',
  
  // IPFS for content storage
  ipfsGateway: 'https://ipfs.genlayer.com/ipfs/',
};

export const REWARD_RATES = {
  ARTICLE_SUBMISSION: '10', // 10 GEN per approved article
  UPVOTE_RECEIVED: '1',     // 1 GEN per upvote received
  QUALITY_BONUS: '2',       // 2x multiplier for high quality
  CURATION_REWARD: '0.5',   // 0.5 GEN per curation action
};

export const QUALITY_THRESHOLDS = {
  MINIMUM: 0.6,    // 60% minimum quality score
  GOOD: 0.8,       // 80% for good quality
  EXCELLENT: 0.9,  // 90% for excellent quality
};

export const APP_CONFIG = {
  NAME: 'Crypto News Hub',
  VERSION: '1.0.0',
  DESCRIPTION: 'AI-powered crypto news platform on GenLayer',
  
  // UI/UX settings
  ARTICLES_PER_PAGE: 20,
  MAX_ARTICLE_LENGTH: 10000,
  MIN_ARTICLE_LENGTH: 100,
  MAX_TAGS_PER_ARTICLE: 5,
  
  // Rate limiting
  SUBMISSION_RATE_LIMIT: 5, // Max 5 articles per hour
  VOTE_RATE_LIMIT: 50,      // Max 50 votes per hour
  
  // Cache settings
  CACHE_DURATION: 300000, // 5 minutes
  REFRESH_INTERVAL: 60000, // 1 minute
};

export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: 'Please connect your wallet to continue',
  NETWORK_NOT_SUPPORTED: 'Please switch to GenLayer network',
  INSUFFICIENT_FUNDS: 'Insufficient funds for this transaction',
  TRANSACTION_FAILED: 'Transaction failed. Please try again.',
  ARTICLE_TOO_SHORT: `Article must be at least ${APP_CONFIG.MIN_ARTICLE_LENGTH} characters`,
  ARTICLE_TOO_LONG: `Article must be less than ${APP_CONFIG.MAX_ARTICLE_LENGTH} characters`,
  INVALID_SOURCE: 'Please provide a valid source URL or name',
  CONTRACT_ERROR: 'Smart contract error. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
};

export const SUCCESS_MESSAGES = {
  ARTICLE_SUBMITTED: 'Article submitted successfully! It will be reviewed shortly.',
  VOTE_RECORDED: 'Your vote has been recorded.',
  REWARDS_CLAIMED: 'Rewards claimed successfully!',
  TRANSACTION_SUCCESS: 'Transaction completed successfully.',
};

export const DEMO_MODE = {
  // Switch to false to use real deployed contracts
  enabled: false,  // Changed to false for real blockchain testing
  mockTransactions: true,
  showMockDataWarning: true,
  fallbackToMock: true,
  mockDelay: 1000
};
