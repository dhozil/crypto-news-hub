'use client';

// Contract integration hooks for GenLayer
import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWallet } from './useWallet';
import { CONTRACT_ADDRESSES, DEMO_MODE, NETWORK_CONFIG } from '@/config/constants';

// RPC Failover configuration for GenLayer Testnet Chain
const RPC_URLS = [
  'https://rpc.testnet-chain.genlayer.com',
  'https://testnet-chain.genlayer.com',
  'https://genlayer-testnet.public.blastapi.io'
];

// Contract ABIs (simplified for GenLayer)
const CONTENT_REGISTRY_ABI = [
  'function submitArticle(string title, string content, string source, string[] tags, bool isAIGenerated) returns (uint256)',
  'function getArticle(uint256 articleId) returns (tuple)',
  'function upvoteArticle(uint256 articleId, address voter) returns (bool)',
  'function downvoteArticle(uint256 articleId, address voter) returns (bool)',
  'function getArticlesByStatus(string status) returns (uint256[])',
  'function getUserArticles(address user) returns (uint256[])',
  'function getArticleStats() returns (uint256, uint256, uint256)',
  'event ArticleSubmitted(uint256 indexed articleId, address indexed author, string title)',
  'event ArticleValidated(uint256 indexed articleId, uint256 score, string status)',
  'event ArticleUpvoted(uint256 indexed articleId, address indexed voter)',
  'event ArticleDownvoted(uint256 indexed articleId, address indexed voter)'
];

const REWARD_SYSTEM_ABI = [
  'function calculateArticleReward(address author, uint256 articleScore, uint256 upvotes, uint256 downvotes) returns (uint256)',
  'function distributeArticleReward(address author, uint256 articleScore, uint256 upvotes, uint256 downvotes, uint256 articleId) returns (bool)',
  'function stakeTokens(address user, uint256 amount) returns (bool)',
  'function unstakeTokens(address user, uint256 amount) returns (bool)',
  'function claimRewards(address user) returns (uint256)',
  'function getPendingRewards(address user) view returns (uint256)',
  'function getVotingPower(address user) view returns (uint256)',
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
      // Test connection
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

// Mock data for demo mode
import { mockArticles } from '@/data/mockData';

export const useContract = () => {
  const { signer, isConnected, address } = useWallet();
  const [state, setState] = useState<ContractState>({
    isLoading: false,
    error: null,
    articles: [],
    userRewards: '0',
    votingPower: 0,
    stakedAmount: '0',
  });

  // Get contract instances
  const getContentRegistryContract = useCallback(() => {
    if (!signer) return null;
    
    // In demo mode, return mock contract
    if (DEMO_MODE.enabled) {
      return createMockContract();
    }
    
    return new ethers.Contract(CONTRACT_ADDRESSES.contentRegistry, CONTENT_REGISTRY_ABI, signer);
  }, [signer]);

  const getRewardSystemContract = useCallback(() => {
    if (!signer) return null;
    
    // In demo mode, return mock contract
    if (DEMO_MODE.enabled) {
      return createMockRewardContract();
    }
    
    const provider = signer.provider;
    return new ethers.Contract(CONTRACT_ADDRESSES.rewardSystem, REWARD_SYSTEM_ABI, signer);
  }, [signer]);

  // Mock contract functions for demo
  const createMockContract = () => {
    return {
      submitArticle: async (title: string, content: string, source: string, tags: string[], isAIGenerated: boolean) => {
        // Simulate transaction delay
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
      getArticlesByStatus: async (status: string) => {
        return mockArticles
          .filter(a => a.status === status)
          .map(a => a.id);
      },
      getUserArticles: async (user: string) => {
        return mockArticles
          .filter(a => a.authorAddress === user)
          .map(a => a.id);
      },
      getArticleStats: async () => {
        const total = mockArticles.length;
        const approved = mockArticles.filter(a => a.status === 'approved').length;
        const pending = mockArticles.filter(a => a.status === 'pending').length;
        return [total, approved, pending];
      }
    };
  };

  const createMockRewardContract = () => {
    return {
      getPendingRewards: async (user: string) => {
        return ethers.parseEther('12.5'); // Mock 12.5 GEN pending
      },
      getVotingPower: async (user: string) => {
        return ethers.parseEther('100'); // Mock 100 voting power
      },
      claimRewards: async (user: string) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return ethers.parseEther('12.5');
      },
      stakeTokens: async (user: string, amount: bigint) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return true;
      }
    };
  };

  const convertToContractFormat = (article: any) => {
    return {
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
    };
  };

  const convertFromContractFormat = (articleData: any, id: string): Article => {
    return {
      id,
      title: articleData.title,
      content: articleData.content,
      summary: articleData.summary,
      source: articleData.source,
      author: 'Mock Author', // Would resolve address to name
      authorAddress: articleData.author,
      timestamp: new Date(articleData.timestamp * 1000),
      score: articleData.score.toNumber() / 1000,
      upvotes: articleData.upvotes.toNumber(),
      downvotes: articleData.downvotes.toNumber(),
      tags: articleData.tags,
      isAIGenerated: articleData.isAIGenerated,
      status: articleData.status
    };
  };

  // Submit article
  const submitArticle = useCallback(async (
    title: string,
    content: string,
    source: string,
    tags: string[],
    isAIGenerated: boolean = false
  ) => {
    if (!isConnected || !signer) {
      throw new Error('Wallet not connected');
    }

    const contract = getContentRegistryContract();
    if (!contract) throw new Error('Contract not available');

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const tx = await contract.submitArticle(title, content, source, tags, isAIGenerated);
      
      if (DEMO_MODE.enabled) {
        // In demo mode, add to mock articles
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
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
      throw error;
    }
  }, [isConnected, signer, getContentRegistryContract, address]);

  // Fetch articles
  const fetchArticles = useCallback(async () => {
    if (!isConnected || !signer) return;

    const contract = getContentRegistryContract();
    if (!contract) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      if (DEMO_MODE.enabled) {
        // In demo mode, use mock articles
        setState(prev => ({ 
          ...prev, 
          articles: mockArticles.map(a => ({ ...a })), 
          isLoading: false 
        }));
        return;
      }

      // Get approved articles
      const approvedArticleIds = await contract.getArticlesByStatus('approved');
      
      const articles: Article[] = [];
      
      for (const articleId of approvedArticleIds) {
        const articleData = await contract.getArticle(articleId);
        articles.push(convertFromContractFormat(articleData, articleId.toString()));
      }

      // Sort by timestamp (newest first)
      articles.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      setState(prev => ({ ...prev, articles, isLoading: false }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch articles';
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
      
      // Fallback to mock data on error
      if (DEMO_MODE.enabled) {
        setState(prev => ({ 
          ...prev, 
          articles: mockArticles.map(a => ({ ...a })), 
          isLoading: false 
        }));
      }
    }
  }, [isConnected, signer, getContentRegistryContract]);

  // Upvote article
  const upvoteArticle = useCallback(async (articleId: string) => {
    if (!isConnected || !signer) {
      throw new Error('Wallet not connected');
    }

    const contract = getContentRegistryContract();
    if (!contract) throw new Error('Contract not available');

    try {
      const tx = await contract.upvoteArticle(articleId, address!);
      
      if (DEMO_MODE.enabled) {
        // Update mock article
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
      const errorMessage = error instanceof Error ? error.message : 'Failed to upvote article';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, [isConnected, signer, address, getContentRegistryContract, fetchArticles]);

  // Downvote article
  const downvoteArticle = useCallback(async (articleId: string) => {
    if (!isConnected || !signer) {
      throw new Error('Wallet not connected');
    }

    const contract = getContentRegistryContract();
    if (!contract) throw new Error('Contract not available');

    try {
      const tx = await contract.downvoteArticle(articleId, address!);
      
      if (DEMO_MODE.enabled) {
        // Update mock article
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
      const errorMessage = error instanceof Error ? error.message : 'Failed to downvote article';
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
      const pendingRewards = await contract.getPendingRewards(address!);
      const votingPower = await contract.getVotingPower(address!);
      
      setState(prev => ({
        ...prev,
        userRewards: ethers.formatEther(pendingRewards),
        votingPower: votingPower.toNumber()
      }));
    } catch (error) {
      console.error('Failed to fetch user rewards:', error);
    }
  }, [isConnected, signer, address, getRewardSystemContract]);

  // Claim rewards
  const claimRewards = useCallback(async () => {
    if (!isConnected || !signer) {
      throw new Error('Wallet not connected');
    }

    const contract = getRewardSystemContract();
    if (!contract) throw new Error('Contract not available');

    try {
      const tx = await contract.claimRewards(address!);
      await tx.wait();
      
      // Refresh rewards
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
    if (!isConnected || !signer) {
      throw new Error('Wallet not connected');
    }

    const contract = getRewardSystemContract();
    if (!contract) throw new Error('Contract not available');

    try {
      const amountWei = ethers.parseEther(amount);
      const tx = await contract.stakeTokens(address!, amountWei);
      await tx.wait();
      
      // Refresh user data
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
  }, [isConnected, signer, fetchArticles, fetchUserRewards]);

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
