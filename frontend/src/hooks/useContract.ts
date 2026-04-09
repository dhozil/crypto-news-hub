'use client';

// Contract integration hooks for GenLayer using genlayer-js
import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from 'genlayer-js';
import { testnetBradbury } from 'genlayer-js/chains';
import { useWallet } from './WalletProvider';
import { CONTRACT_ADDRESSES, DEMO_MODE } from '@/config/constants';
import { mockArticles } from '@/data/mockData';

// Contract address
const CONTRACT_ADDRESS = CONTRACT_ADDRESSES.contentRegistry;

// GenLayer client with MetaMask provider
const createGenLayerClientWithMetaMask = (address: string, provider: any) => {
  console.log('🔥 Creating GenLayer client with address:', address);
  console.log('🔥 Provider available:', !!provider);
  const client = createClient({
    chain: testnetBradbury,
    account: address as `0x${string}`, // Pass address directly
    provider: provider, // Pass MetaMask provider
  });
  console.log('🔥 Client created, methods:', Object.keys(client).slice(0, 10));
  return client;
};

// Types
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
  userReputation: number;
  votingPower: number;
  totalArticles: number;
  approvedArticles: number;
}

// Helpers
const convertFromContractFormat = (articleData: any, id: string): Article => ({
  id,
  title: articleData.title ?? '',
  content: articleData.content ?? '',
  summary: articleData.summary ?? '',
  source: articleData.source ?? '',
  author: 'Community Member',
  authorAddress: articleData.author ?? '',
  timestamp: new Date(Number(articleData.timestamp) * 1000),
  score: Number(articleData.score) / 10,
  upvotes: Number(articleData.upvotes),
  downvotes: Number(articleData.downvotes),
  tags: articleData.tags ?? [],
  isAIGenerated: articleData.is_ai_generated ?? false,
  status: (articleData.status as 'pending' | 'approved' | 'rejected') ?? 'pending',
});

// Delay helper for rate limiting
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// GenLayer Contract Helpers with retry logic
const readContract = async (client: any, functionName: string, args: any[] = [], retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await client.readContract({
        address: CONTRACT_ADDRESS,
        functionName,
        args,
      });
    } catch (error: any) {
      if (error?.message?.includes('rate limit') && i < retries - 1) {
        console.warn(`⏳ Rate limit hit, retrying in ${(i + 1) * 2}s...`);
        await delay((i + 1) * 2000);
        continue;
      }
      throw error;
    }
  }
};

const emitContract = async (client: any, functionName: string, args: any[] = []) => {
  console.log('🔥 emitContract called:', { functionName, args, contractAddress: CONTRACT_ADDRESS });
  console.log('🔥 Client methods:', Object.keys(client));
  
  if (!client.writeContract) {
    console.error('❌ writeContract not found on client!');
    throw new Error('writeContract not available');
  }
  
  return await client.writeContract({
    address: CONTRACT_ADDRESS,
    functionName,
    args,
  });
};

// Mock Contracts (Demo Mode)
const createMockContentContract = () => ({
  submitArticle: async () => ({ hash: '0xmockhash_' + Date.now() }),
  getArticle: async (articleId: string) => {
    const article = mockArticles.find(a => a.id === articleId);
    if (!article) throw new Error('Article not found');
    return article;
  },
  upvoteArticle: async () => true,
  downvoteArticle: async () => true,
  getArticlesByStatus: async (status: string) =>
    mockArticles.filter(a => a.status === status).map(a => a.id),
  getUserArticles: async (user: string) =>
    mockArticles.filter(a => a.authorAddress === user).map(a => a.id),
  getArticleStats: async () => {
    const total = mockArticles.length;
    const approved = mockArticles.filter(a => a.status === 'approved').length;
    const pending = mockArticles.filter(a => a.status === 'pending').length;
    return [total, approved, pending];
  },
  getUserInfo: async (_user: string) => null,
  getUserReputation: async () => BigInt(0),
  registerUser: async () => true,
});

// Main Hook
export const useContract = () => {
  const { signer, isConnected, address } = useWallet();

  const [state, setState] = useState<ContractState>({
    isLoading: false,
    error: null,
    articles: [],
    userRewards: '0',
    userReputation: 0,
    votingPower: 0,
    totalArticles: 0,
    approvedArticles: 0,
  });

  // Track if registration has been attempted (prevent duplicate tx)
  const hasRegisteredRef = useRef(false);
  // Track if already fetching to prevent spam
  const isFetchingRef = useRef(false);

  // GenLayer Client
  const getClient = useCallback(() => {
    console.log('🔥 getClient called, DEMO_MODE:', DEMO_MODE.enabled, 'address:', address);
    if (DEMO_MODE.enabled) return createMockContentContract() as any;
    if (!address || !(window as any).ethereum) {
      console.log('🔥 getClient returning null - no address or ethereum');
      return null;
    }
    return createGenLayerClientWithMetaMask(address, (window as any).ethereum);
  }, [address]);

  // Ensure GenLayer network
  const ensureGenLayerNetwork = useCallback(async (): Promise<boolean> => {
    if (!(window as any).ethereum) return false;
    try {
      const chainId = await (window as any).ethereum.request({ method: 'eth_chainId' });
      if (Number(chainId) === 4221) return true;

      try {
        await (window as any).ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x107D' }],
        });
        return true;
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          await (window as any).ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x107D',
              chainName: 'Genlayer Bradbury Testnet',
              nativeCurrency: { name: 'GEN', symbol: 'GEN', decimals: 18 },
              rpcUrls: ['https://rpc-bradbury.genlayer.com'],
              blockExplorerUrls: ['https://explorer-bradbury.genlayer.com'],
            }],
          });
          return true;
        }
        throw switchError;
      }
    } catch (error) {
      console.error('Network switch failed:', error);
      return false;
    }
  }, []);

  // Auto-register user with ref flag to prevent duplicates
  const ensureUserRegistered = useCallback(async (client: any) => {
    console.log('🔥 ensureUserRegistered called, hasRegisteredRef:', hasRegisteredRef.current);
    if (!address || hasRegisteredRef.current) {
      console.log('🔥 Skipping registration - already done or no address');
      return;
    }
    try {
      console.log('🔥 Checking if user is registered...');
      const userInfo = await readContract(client, 'get_user_info', [address]);
      console.log('🔥 userInfo result:', userInfo);
      if (!userInfo || !userInfo.address) {
        console.log('📝 User not registered, calling emitContract for register_user...');
        hasRegisteredRef.current = true; // Mark as attempted
        const regResult = await emitContract(client, 'register_user', [address]);
        console.log('✅ User registered! Result:', regResult);
      } else {
        console.log('🔥 User already registered');
        hasRegisteredRef.current = true; // Already registered
      }
    } catch (e) {
      console.log('🔥 Error checking registration, trying to register anyway:', e);
      try {
        hasRegisteredRef.current = true; // Mark as attempted even if failed
        const regResult = await emitContract(client, 'register_user', [address]);
        console.log('✅ User registered (fallback)! Result:', regResult);
      } catch (regError) {
        console.warn('Register user failed:', regError);
      }
    }
  }, [address]);

  // Submit Article
  const submitArticle = useCallback(async (
    title: string,
    content: string,
    source: string,
    tags: string[],
    isAIGenerated: boolean = false
  ): Promise<string> => {
    if (!isConnected || !signer || !address) {
      throw new Error('Wallet not connected');
    }

    const onCorrectNetwork = await ensureGenLayerNetwork();
    if (!onCorrectNetwork) {
      throw new Error('Please switch to GenLayer Bradbury Testnet');
    }

    // Tunggu 3 detik untuk avoid rate limit dari fetch sebelumnya
    console.log('🔥 Waiting 3s before submit to avoid rate limit...');
    await delay(3000);

    const client = getClient();
    console.log('🔥 Submit Article - Client:', client);
    if (!client) throw new Error('Contract not available');

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      console.log('🔥 About to ensureUserRegistered...');
      await ensureUserRegistered(client);
      console.log('🔥 About to call emitContract for submit_article...');

      let result;
      try {
        result = await emitContract(client, 'submit_article', [
          address, title, content, source, tags, isAIGenerated
        ]);
      } catch (emitError) {
        console.error('🔥 emitContract FAILED:', emitError);
        throw emitError;
      }
      console.log('🔥 emitContract result:', result);

      if (DEMO_MODE.enabled) {
        const newArticle: Article = {
          id: (mockArticles.length + 1).toString(),
          title, content,
          summary: content.substring(0, 200) + '...',
          source, author: 'Demo User', authorAddress: address,
          timestamp: new Date(), score: 85, upvotes: 0, downvotes: 0,
          tags, isAIGenerated, status: 'pending',
        };
        mockArticles.push(newArticle);
        setState(prev => ({ ...prev, articles: [...mockArticles], isLoading: false }));
        return 'demo_tx_hash';
      }

      console.log('📤 Transaction result:', result);
      await fetchArticles();
      await fetchUserInfo();

      setState(prev => ({ ...prev, isLoading: false }));
      return result.transaction_hash || result.hash || 'tx_hash';

    } catch (error: any) {
      const errorMessage = error?.message ?? 'Failed to submit article';
      console.error('❌ Submit article error:', error);
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
      throw error;
    }
  }, [isConnected, signer, address, getClient, ensureGenLayerNetwork, ensureUserRegistered]);

  // Submit From URL
  const submitArticleFromUrl = useCallback(async (
    url: string, tags: string[], isAIGenerated: boolean = false
  ): Promise<string> => {
    if (!isConnected || !signer || !address) {
      throw new Error('Wallet not connected');
    }

    const onCorrectNetwork = await ensureGenLayerNetwork();
    if (!onCorrectNetwork) throw new Error('Please switch to GenLayer Bradbury Testnet');

    const client = getClient();
    if (!client) throw new Error('Contract not available');

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await ensureUserRegistered(client);
      const result = await emitContract(client, 'submit_article_from_url', [address, url, tags, isAIGenerated]);

      await fetchArticles();
      await fetchUserInfo();

      setState(prev => ({ ...prev, isLoading: false }));
      return result.transaction_hash || result.hash || 'tx_hash';
    } catch (error: any) {
      const errorMessage = error?.message ?? 'Failed to submit article from URL';
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
      throw error;
    }
  }, [isConnected, signer, address, getClient, ensureGenLayerNetwork, ensureUserRegistered]);

  // Fetch Articles
  const fetchArticles = useCallback(async () => {
    if (isFetchingRef.current) {
      console.log('🔥 Skipping fetchArticles - already fetching');
      return;
    }
    
    const client = getClient();
    if (!client) return;

    isFetchingRef.current = true;
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      if (DEMO_MODE.enabled) {
        setState(prev => ({
          ...prev,
          articles: mockArticles.map(a => ({ ...a })),
          totalArticles: mockArticles.length,
          approvedArticles: mockArticles.filter(a => a.status === 'approved').length,
          isLoading: false,
        }));
        return;
      }

      let approvedIds: any[] = [];
      try {
        approvedIds = await readContract(client, 'get_articles_by_status', ['approved']);
      } catch (e) {
        console.warn('getArticlesByStatus failed:', e);
        approvedIds = await readContract(client, 'get_all_articles', []);
      }

      const articles: Article[] = [];
      for (const articleId of approvedIds) {
        try {
          const articleData = await readContract(client, 'get_article', [articleId]);
          if (articleData) {
            articles.push(convertFromContractFormat(articleData, articleId.toString()));
          }
        } catch (e) {
          console.warn(`Failed to fetch article ${articleId}:`, e);
        }
      }

      articles.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      let totalArticles = articles.length;
      let approvedArticles = articles.length;
      try {
        const [total, approved] = await readContract(client, 'get_article_stats', []);
        totalArticles = Number(total);
        approvedArticles = Number(approved);
      } catch { /* ignore */ }

      setState(prev => ({
        ...prev, articles, totalArticles, approvedArticles, isLoading: false,
      }));
      isFetchingRef.current = false;

    } catch (error: any) {
      const errorMessage = error?.message ?? 'Failed to fetch articles';
      console.error('❌ Fetch articles error:', error);
      setState(prev => ({
        ...prev, error: errorMessage, isLoading: false,
        articles: DEMO_MODE.enabled ? mockArticles.map(a => ({ ...a })) : prev.articles,
      }));
    } finally {
      isFetchingRef.current = false;
    }
  }, [getClient]);

  // Fetch User Info
  const fetchUserInfo = useCallback(async () => {
    if (!isConnected || !address) return;

    const client = getClient();
    if (!client) return;

    try {
      if (DEMO_MODE.enabled) {
        setState(prev => ({ ...prev, userRewards: '12.5', userReputation: 100, votingPower: 100 }));
        return;
      }

      let rewards = BigInt(0);
      let reputation = BigInt(0);

      try {
        const userInfo = await readContract(client, 'get_user_info', [address]);
        if (userInfo && userInfo.rewards !== undefined) {
          rewards = BigInt(userInfo.rewards);
          reputation = BigInt(userInfo.reputation);
        }
      } catch {
        console.log('User not registered yet');
      }

      setState(prev => ({
        ...prev,
        userRewards: rewards.toString(),
        userReputation: Number(reputation),
        votingPower: Number(reputation),
      }));

    } catch (error) {
      console.error('Failed to fetch user info:', error);
    }
  }, [isConnected, address, getClient]);

  // Upvote
  const upvoteArticle = useCallback(async (articleId: string): Promise<string> => {
    if (!isConnected || !signer || !address) throw new Error('Wallet not connected');

    const client = getClient();
    if (!client) throw new Error('Contract not available');

    try {
      const result = await emitContract(client, 'upvote_article', [articleId, address]);

      if (DEMO_MODE.enabled) {
        const article = mockArticles.find(a => a.id === articleId);
        if (article) { article.upvotes += 1; }
        return 'demo_upvote_hash';
      }

      console.log('📤 Upvote result:', result);
      await fetchArticles();
      return result.transaction_hash || result.hash || 'tx_hash';
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error?.message ?? 'Failed to upvote' }));
      throw error;
    }
  }, [isConnected, signer, address, getClient, fetchArticles]);

  // Downvote
  const downvoteArticle = useCallback(async (articleId: string): Promise<string> => {
    if (!isConnected || !signer || !address) throw new Error('Wallet not connected');

    const client = getClient();
    if (!client) throw new Error('Contract not available');

    try {
      const result = await emitContract(client, 'downvote_article', [articleId, address]);

      if (DEMO_MODE.enabled) {
        const article = mockArticles.find(a => a.id === articleId);
        if (article) { article.downvotes += 1; }
        return 'demo_downvote_hash';
      }

      console.log('📤 Downvote result:', result);
      await fetchArticles();
      return result.transaction_hash || result.hash || 'tx_hash';
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error?.message ?? 'Failed to downvote' }));
      throw error;
    }
  }, [isConnected, signer, address, getClient, fetchArticles]);

  // Auto fetch on wallet connect - NO AUTO REGISTRATION
  useEffect(() => {
    if (isConnected && signer && address) {
      fetchArticles();
      fetchUserInfo();
      // Reset registration flag on disconnect
      hasRegisteredRef.current = false;
    }
  }, [isConnected, signer, address]); // Minimal deps - only wallet connection changes

  return {
    ...state,
    submitArticle,
    submitArticleFromUrl,
    fetchArticles,
    upvoteArticle,
    downvoteArticle,
    refreshData: () => { fetchArticles(); fetchUserInfo(); },
  };
};
