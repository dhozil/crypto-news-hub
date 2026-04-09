# Deploy Instructions - GenLayer Testnet

## Prerequisites
```bash
pip install genlayer-cli
```

## Deploy ContentRegistry

```bash
cd D:\Game\crypto-news-hub\contracts
genlayer deploy src/content_registry.py --name ContentRegistry-v3
```

**Catat contract address yang di-output**, contoh:
```
Contract deployed at: 0x1234567890abcdef...
```

## Deploy RewardSystem

```bash
cd D:\Game\crypto-news-hub\contracts
genlayer deploy src/reward_system.py --name RewardSystem-v3
```

**Catat contract address**

## Update Frontend

Setelah deploy, update file `frontend/.env.local`:

```env
NEXT_PUBLIC_CONTENT_REGISTRY_CONTRACT_ADDRESS=0x[CONTENT_REGISTRY_ADDRESS]
NEXT_PUBLIC_REWARD_SYSTEM_CONTRACT_ADDRESS=0x[REWARD_SYSTEM_ADDRESS]
```

Kemudian restart frontend:
```bash
cd frontend
npm run dev
```

## Method yang Tersedia (100% compatible dengan ABI frontend)

### ContentRegistry
- ✅ `getAllArticles() view returns (uint256[])`
- ✅ `getUserReputation(address user) view returns (uint256)`
- ✅ `getArticleCount() view returns (uint256)`
- ✅ `submitArticle(address author, string title, string content, string source, string[] tags, bool isAIGenerated) returns (uint256)`
- ✅ `upvoteArticle(uint256 articleId, address voter) returns (bool)`
- ✅ `downvoteArticle(uint256 articleId, address voter) returns (bool)`
- ✅ `getUserArticles(address user) view returns (uint256[])`

### RewardSystem
- ✅ `calculateArticleReward(address author, uint256 articleScore, uint256 upvotes, uint256 downvotes) view returns (uint256)`
- ✅ `distributeArticleReward(address author, uint256 articleScore, uint256 upvotes, uint256 downvotes, uint256 articleId) returns (bool)`
- ✅ `stakeTokens(address user, uint256 amount) returns (bool)`
- ✅ `unstakeTokens(address user, uint256 amount) returns (bool)`
- ✅ `claimRewards(address user) returns (uint256)`
- ✅ `getPendingRewards(address user) view returns (uint256)`
- ✅ `getVotingPower(address user) view returns (uint256)`

## Verifikasi Deploy

Setelah deploy, verifikasi dengan:
```bash
genlayer call 0x[CONTENT_REGISTRY_ADDRESS] getArticleCount --network testnet
```

## Troubleshooting

Jika deploy gagal:
1. Cek koneksi internet
2. Pastikan private key sudah di-setup: `genlayer config set private_key YOUR_KEY`
3. Cek balance testnet ETH
