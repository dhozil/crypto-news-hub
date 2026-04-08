'use client';

// Contract integration hooks for GenLayer
import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
// ✅ FIX 1: Import dari WalletProvider (shared Context), bukan langsung dari useWallet
import { useWallet } from './WalletProvider';
import { CONTRACT_ADDRESSES, DEMO_MODE, NETWORK_CONFIG } from '@/config/constants';

// RPC Failover configuration for GenLayer Testnet Chain
const RPC_URLS = [
  'https://rpc.testnet-chain.genlayer.com',
  'https://testnet-chain.genlayer.com',
  'https://genlayer-testnet.public.blastapi.io'
];

// Contract ABIs (simplified for GenLayer)
const CONTENT_REGISTRY_ABI = [
  // Basic article management
  'function submitArticle(string title, string content, string source, string[] tags, bool isAIGenerated) returns (uint256)',
  'function submitArticleFromUrl(string author, string url, string[] tags, bool isAIGenerated) returns (uint256)',
  'function getArticle(uint256 articleId) view returns (tuple)',
  'function upvoteArticle(uint256 articleId, address voter) returns (bool)',
  'function downvoteArticle(uint256 articleId, address voter) returns (bool)',
  'function getArticlesByStatus(string status) view returns (uint256[])',
  'function getUserArticles(address user) view returns (uint256[])',
  'function getArticleStats() view returns (uint256, uint256, uint256)',
  'function getArticlesByTag(string tag) view returns (uint256[])',
  // User management
  'function registerUser(string user) returns (bool)',
  'function getUserInfo(string user) view returns (tuple)',
  'function getUserIndex(string user) view returns (uint256)',
  // Events
  'event ArticleSubmitted(uint256 indexed articleId, address indexed author, string title)',
  'event ArticleValidated(uint256 indexed articleId, uint256 score, string status)',
  'event ArticleUpvoted(uint256 indexed articleId, address indexed voter)',
  'event ArticleDownvoted(uint256 indexed articleId, address indexed voter)'
];

const REWARD_SYSTEM_ABI = [
  // Reward calculation and distribution
  'function calculateArticleReward(address author, uint256 articleScore, uint256 upvotes, uint256 downvotes) view returns (uint256)',
  'function distributeArticleReward(address author, uint256 articleScore, uint256 upvotes, uint256 downvotes, uint256 articleId) returns (tuple)',
  // AI optimization (view methods with LLM)
  'function getLlmRewardRecommendation() view returns (string)',
  'function getTokenPrice(string tokenSymbol) view returns (uint256)',
  // Staking
  'function stakeTokens(string user, uint256 amount, uint256 currentTime) returns (bool)',
  'function unstakeTokens(string user, uint256 amount, uint256 currentTime) returns (bool)',
  'function getVotingPower(string user) view returns (uint256)',
  // Reward application (deterministic write)
  'function applyRewardRates(uint256 articleRewardGen, uint256 upvoteRewardGen) returns (string)',
  'function getPendingRewards(string user) view returns (uint256)',
  'function claimRewards(string user) returns (uint256)',
  // Events
  'event RewardDistributed(address indexed user, uint256 amount, string reason)',
  'event RewardClaimed(address indexed user, uint256 amount)',
  'event TokensStaked(address indexed user, uint256 amount)',
  'event TokensUnstaked(address indexed user, uint256 amount)'
];

// Create provider with RPC failover
const createProviderWithFailover = async (): Promise<ethers.JsonRpcProvider> => {
  for (const rpcUrl of RPC_URLS) {
    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      await provider.getNetwork();
      console.log(`Connected to RPC: ${rpcUrl}`);
      return provider;
    } catch (error) {
      console.warn(`RPC ${rpcUrl} failed, trying next...`, error);
      continue;
    }
  }
  throw new Error('All RPC endpoints failed');
};

export interface Article {
  id: string;
  title: string;
  content: string;
  summary: string;
  source: string;
  author: string;
  authorAddress: string;
  timestamp: Date;
  score: number;
  upvotes: number;
  downvotes: number;
  tags: string[];
  isAIGenerated: boolean;
  status: 'pending' | 'approved' | 'rejected';
}

export interface ContractState {
  isLoading: boolean;
  error: string | null;
  articles: Article[];
  userRewards: string;
  votingPower: number;
  stakedAmount: string;
}

import { mockArticles } from '@/data/mockData';

export const useContract = () => {
  // ✅ FIX 1: Sekarang pakai shared Context, bukan instance baru
  const { signer, isConnected, address } = useWallet();
  const [state, setState] = useState<ContractState>({
    isLoading: false,
    error: null,
    articles: [],
    userRewards: '0',
    votingPower: 0,
    stakedAmount: '0',
  });

  const getContentRegistryContract = useCallback(() => {
    if (!signer) return null;
    if (DEMO_MODE.enabled) return createMockContract();
    return new ethers.Contract(CONTRACT_ADDRESSES.contentRegistry, CONTENT_REGISTRY_ABI, signer);
  }, [signer]);

  const getRewardSystemContract = useCallback(() => {
    if (!signer) return null;
    if (DEMO_MODE.enabled) return createMockRewardContract();
    return new ethers.Contract(CONTRACT_ADDRESSES.rewardSystem, REWARD_SYSTEM_ABI, signer);
  }, [signer]);

  const createMockContract = () => ({
    submitArticle: async (title: string, content: string, source: string, tags: string[], isAIGenerated: boolean) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { hash: '0xmockhash' };
    },
    getArticle: async (articleId: string) => {
      const article = mockArticles.find(a => a.id === articleId);
      if (!article) throw new Error('Article not found');
      return convertToContractFormat(article);
    },
    upvoteArticle: async (articleId: string, voter: string) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return true;
    },
    downvoteArticle: async (articleId: string, voter: string) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return true;
    },
    getArticlesByStatus: async (status: string) =>
      mockArticles.filter(a => a.status === status).map(a => a.id),
    getUserArticles: async (user: string) =>
      mockArticles.filter(a => a.authorAddress === user).map(a => a.id),
    getArticleStats: async () => {
      const total = mockArticles.length;
      const approved = mockArticles.filter(a => a.status === 'approved').length;
      const pending = mockArticles.filter(a => a.status === 'pending').length;
      return [total, approved, pending];
    }
  });

  const createMockRewardContract = () => ({
    getPendingRewards: async (_user: string) => ethers.parseEther('12.5'),
    getVotingPower: async (_user: string) => ethers.parseEther('100'),
    claimRewards: async (_user: string) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return ethers.parseEther('12.5');
    },
    stakeTokens: async (_user: string, _amount: bigint) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return true;
    }
  });

  const convertToContractFormat = (article: any) => ({
    title: article.title,
    content: article.content,
    summary: article.summary,
    source: article.source,
    author: article.authorAddress,
    timestamp: Math.floor(article.timestamp.getTime() / 1000),
    score: Math.floor(article.score * 1000),
    upvotes: article.upvotes,
    downvotes: article.downvotes,
    tags: article.tags,
    isAIGenerated: article.isAIGenerated,
    status: article.status
  });

  const convertFromContractFormat = (articleData: any, id: string): Article => ({
    id,
    title: articleData.title,
    content: articleData.content,
    summary: articleData.summary,
    source: articleData.source,
    author: articleData.author,
    authorAddress: articleData.author,
    timestamp: new Date(Number(articleData.timestamp) * 1000),
    // ✅ FIX 2: Ganti .toNumber() → Number() — kompatibel dengan ethers v6 BigInt
    score: Number(articleData.score) / 1000,
    upvotes: Number(articleData.upvotes),
    downvotes: Number(articleData.downvotes),
    tags: articleData.tags,
    isAIGenerated: articleData.isAIGenerated,
    status: articleData.status
  });

  // Submit article
  const submitArticle = useCallback(async (
    title: string,
    content: string,
    source: string,
    tags: string[],
    isAIGenerated: boolean = false
  ) => {
    // ✅ FIX 3: Cek isConnected dari shared Context (bukan instance terpisah)
    if (!isConnected || !signer) {
      throw new Error('Wallet not connected. Please connect your MetaMask wallet.');
    }

    const contract = getContentRegistryContract();
    if (!contract) throw new Error('Contract not available');

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const tx = await contract.submitArticle(title, content, source, tags, isAIGenerated);

      if (DEMO_MODE.enabled) {
        const newArticle: Article = {
          id: (mockArticles.length + 1).toString(),
          title,
          content,
          summary: content.substring(0, 200) + '...',
          source,
          author: 'Demo User',
          authorAddress: address || '',
          timestamp: new Date(),
          score: 0.85,
          upvotes: 0,
          downvotes: 0,
          tags,
          isAIGenerated,
          status: 'pending'
        };
        mockArticles.push(newArticle);
        setState(prev => ({ ...prev, articles: [...mockArticles], isLoading: false }));
      } else {
        await tx.wait();
        await fetchArticles();
      }

      return tx.hash;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit article';
      // ✅ FIX 3: isLoading selalu di-reset ke false di catch
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
      throw error;
    }
  }, [isConnected, signer, getContentRegistryContract, address]);

  // Fetch articles
  const fetchArticles = useCallback(async () => {
    // ✅ FIX 3: Guard — jangan set isLoading jika tidak ada signer
    if (!isConnected || !signer) return;

    const contract = getContentRegistryContract();
    if (!contract) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      if (DEMO_MODE.enabled) {
        setState(prev => ({
          ...prev,
          articles: mockArticles.map(a => ({ ...a })),
          isLoading: false
        }));
        return;
      }

      const approvedArticleIds = await contract.getArticlesByStatus('approved');
      const articles: Article[] = [];

      for (const articleId of approvedArticleIds) {
        const articleData = await contract.getArticle(articleId);
        articles.push(convertFromContractFormat(articleData, articleId.toString()));
      }

      articles.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      setState(prev => ({ ...prev, articles, isLoading: false }));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch articles';
      // ✅ FIX 3: isLoading selalu false di catch, pakai mock sebagai fallback
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
        articles: DEMO_MODE.enabled ? mockArticles.map(a => ({ ...a })) : prev.articles
      }));
    }
  }, [isConnected, signer, getContentRegistryContract]);

  // Upvote article
  const upvoteArticle = useCallback(async (articleId: string) => {
    if (!isConnected || !signer) throw new Error('Wallet not connected');

    const contract = getContentRegistryContract();
    if (!contract) throw new Error('Contract not available');

    try {
      const tx = await contract.upvoteArticle(articleId, address!);
      if (DEMO_MODE.enabled) {
        const article = mockArticles.find(a => a.id === articleId);
        if (article) {
          article.upvotes += 1;
          setState(prev => ({ ...prev, articles: [...mockArticles] }));
        }
      } else {
        await tx.wait();
        await fetchArticles();
      }
      return tx.hash;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upvote';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, [isConnected, signer, address, getContentRegistryContract, fetchArticles]);

  // Downvote article
  const downvoteArticle = useCallback(async (articleId: string) => {
    if (!isConnected || !signer) throw new Error('Wallet not connected');

    const contract = getContentRegistryContract();
    if (!contract) throw new Error('Contract not available');

    try {
      const tx = await contract.downvoteArticle(articleId, address!);
      if (DEMO_MODE.enabled) {
        const article = mockArticles.find(a => a.id === articleId);
        if (article) {
          article.downvotes += 1;
          setState(prev => ({ ...prev, articles: [...mockArticles] }));
        }
      } else {
        await tx.wait();
        await fetchArticles();
      }
      return tx.hash;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to downvote';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, [isConnected, signer, address, getContentRegistryContract, fetchArticles]);

  // Fetch user rewards
  const fetchUserRewards = useCallback(async () => {
    if (!isConnected || !signer || !address) return;

    const contract = getRewardSystemContract();
    if (!contract) return;

    try {
      const pendingRewards = await contract.getPendingRewards(address);
      const votingPower = await contract.getVotingPower(address);

      setState(prev => ({
        ...prev,
        userRewards: ethers.formatEther(pendingRewards),
        // ✅ FIX 2: Number() bukan .toNumber() untuk ethers v6
        votingPower: Number(ethers.formatEther(votingPower))
      }));
    } catch (error) {
      console.error('Failed to fetch user rewards:', error);
    }
  }, [isConnected, signer, address, getRewardSystemContract]);

  // Claim rewards
  const claimRewards = useCallback(async () => {
    if (!isConnected || !signer) throw new Error('Wallet not connected');

    const contract = getRewardSystemContract();
    if (!contract) throw new Error('Contract not available');

    try {
      const tx = await contract.claimRewards(address!);
      await tx.wait();
      await fetchUserRewards();
      return tx.hash;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to claim rewards';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, [isConnected, signer, address, getRewardSystemContract, fetchUserRewards]);

  // Stake tokens
  const stakeTokens = useCallback(async (amount: string) => {
    if (!isConnected || !signer) throw new Error('Wallet not connected');

    const contract = getRewardSystemContract();
    if (!contract) throw new Error('Contract not available');

    try {
      const amountWei = ethers.parseEther(amount);
      const tx = await contract.stakeTokens(address!, amountWei);
      await tx.wait();
      await fetchUserRewards();
      return tx.hash;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to stake tokens';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, [isConnected, signer, address, getRewardSystemContract, fetchUserRewards]);

  // Auto-fetch data when wallet connects
  useEffect(() => {
    if (isConnected && signer) {
      fetchArticles();
      fetchUserRewards();
    }
  }, [isConnected, signer]);

  return {
    ...state,
    submitArticle,
    fetchArticles,
    upvoteArticle,
    downvoteArticle,
    claimRewards,
    stakeTokens,
    refreshData: () => {
      fetchArticles();
      fetchUserRewards();
    }
  };
};
