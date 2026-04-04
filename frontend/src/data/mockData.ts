// Mock data for development and testing
export interface Article {
  id: string;
  title: string;
  content: string;
  summary: string;
  source: string;
  author: string;
  authorAddress: string;
  timestamp: Date;
  score: number; // Quality score 0-1
  upvotes: number;
  downvotes: number;
  tags: string[];
  isAIGenerated: boolean;
  status: 'pending' | 'approved' | 'rejected';
}

export interface User {
  address: string;
  reputation: number;
  totalArticles: number;
  totalUpvotes: number;
  rewards: string;
  joinedAt: Date;
}

export const mockArticles: Article[] = [
  {
    id: '1',
    title: 'Bitcoin Reaches New All-Time High Amid Institutional Adoption',
    content: `Bitcoin has surged to a new all-time high, crossing the $70,000 mark as institutional investors continue to pour money into cryptocurrency funds. 
    The latest rally comes as major financial institutions announce increased exposure to digital assets, with several banks launching crypto custody services.
    Market analysts attribute this growth to growing acceptance of Bitcoin as a legitimate asset class and hedge against inflation.`,
    summary: 'Bitcoin hits new ATH above $70,000 driven by institutional adoption and growing acceptance as legitimate asset class.',
    source: 'CryptoNews.com',
    author: 'AI News Curator',
    authorAddress: '0x1234...5678',
    timestamp: new Date('2024-04-04T10:00:00Z'),
    score: 0.92,
    upvotes: 156,
    downvotes: 12,
    tags: ['bitcoin', 'institutional', 'price'],
    isAIGenerated: true,
    status: 'approved',
  },
  {
    id: '2',
    title: 'Ethereum Dencun Upgrade Successfully Deploys on Mainnet',
    content: `The Ethereum network has successfully implemented the Dencun upgrade, bringing significant improvements to scalability and gas efficiency.
    This upgrade introduces proto-danksharding (EIP-4844), which reduces transaction costs for layer 2 solutions by up to 90%.
    The Ethereum community has welcomed the upgrade as a major step toward achieving the network's long-term scalability goals.`,
    summary: 'Ethereum Dencun upgrade successfully deploys, introducing proto-danksharding and reducing L2 costs by up to 90%.',
    source: 'Ethereum.org',
    author: 'Dev Reporter',
    authorAddress: '0xabcd...efgh',
    timestamp: new Date('2024-04-04T08:30:00Z'),
    score: 0.88,
    upvotes: 89,
    downvotes: 5,
    tags: ['ethereum', 'upgrade', 'scaling'],
    isAIGenerated: false,
    status: 'approved',
  },
  {
    id: '3',
    title: 'Major Exchange Announces Support for New AI-Powered Trading Features',
    content: `A leading cryptocurrency exchange has announced the launch of AI-powered trading features designed to help users make better investment decisions.
    The new features include predictive analytics, automated portfolio rebalancing, and AI-driven market insights.
    The exchange claims these tools will democratize access to sophisticated trading strategies previously available only to institutional investors.`,
    summary: 'Major exchange launches AI-powered trading features including predictive analytics and automated portfolio management.',
    source: 'ExchangeNews.io',
    author: 'Market Analyst',
    authorAddress: '0x9876...5432',
    timestamp: new Date('2024-04-04T06:15:00Z'),
    score: 0.75,
    upvotes: 45,
    downvotes: 18,
    tags: ['exchange', 'AI', 'trading'],
    isAIGenerated: false,
    status: 'pending',
  },
  {
    id: '4',
    title: 'DeFi Protocol Reports Record TVL Amid Yield Farming Boom',
    content: `A prominent DeFi protocol has reported record total value locked (TVL) as users flock to yield farming opportunities.
    The protocol's innovative tokenomics and high-yield pools have attracted significant liquidity from both retail and institutional investors.
    However, some analysts warn about potential risks associated with high-yield farming strategies.`,
    summary: 'DeFi protocol achieves record TVL as yield farming attracts massive liquidity, but analysts warn of potential risks.',
    source: 'DeFi Times',
    author: 'Yield Hunter',
    authorAddress: '0xdefi...1234',
    timestamp: new Date('2024-04-04T04:45:00Z'),
    score: 0.68,
    upvotes: 23,
    downvotes: 15,
    tags: ['defi', 'yield', 'tvl'],
    isAIGenerated: true,
    status: 'approved',
  },
];

export const mockUser: User = {
  address: '0x1234567890123456789012345678901234567890',
  reputation: 1250,
  totalArticles: 15,
  totalUpvotes: 342,
  rewards: '125.50',
  joinedAt: new Date('2024-01-15T00:00:00Z'),
};

export const trendingTopics = [
  { topic: 'Bitcoin', count: 245, change: '+12%' },
  { topic: 'Ethereum', count: 189, change: '+8%' },
  { topic: 'DeFi', count: 156, change: '+15%' },
  { topic: 'AI in Crypto', count: 134, change: '+25%' },
  { topic: 'Layer 2', count: 98, change: '+5%' },
];

export const newsSources = [
  { name: 'CryptoNews.com', url: 'https://cryptonews.com', isActive: true },
  { name: 'CoinDesk', url: 'https://coindesk.com', isActive: true },
  { name: 'The Block', url: 'https://theblock.co', isActive: true },
  { name: 'DeFi Times', url: 'https://defitimes.io', isActive: false },
  { name: 'Ethereum.org', url: 'https://ethereum.org', isActive: true },
];
