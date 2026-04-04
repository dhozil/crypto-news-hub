# Crypto News Hub - GenLayer Hackathon Project

AI-powered crypto news platform with community governance and on-chain rewards.

## Overview

Crypto News Hub is an intelligent news aggregation platform that:
- Automatically fetches and curates crypto news using AI
- Allows community members to submit and vote on content
- Rewards quality contributions with on-chain tokens
- Uses GenLayer Intelligent Contracts for content validation

## Architecture

### Frontend (Next.js + TypeScript)
- React-based web application
- MetaMask wallet integration
- Real-time news feed
- Community posting interface

### Smart Contracts (GenLayer)
- Content validation logic
- Reward distribution system
- Governance mechanisms
- AI-powered quality assessment

## Features

### AI-Powered Features
- Automatic news fetching from multiple sources
- Content summarization and quality scoring
- Trend detection and analysis
- Spam and fake news filtering

### Community Features
- Wallet-based authentication
- Content submission and voting
- Token rewards for quality contributions
- Decentralized governance

### Blockchain Integration
- On-chain content storage
- Transparent reward distribution
- Community governance
- Censorship-resistant platform

## Getting Started

### Prerequisites
- Node.js 20.9.0 or higher
- MetaMask wallet
- GEN tokens for testing

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd crypto-news-hub
```

2. Setup Frontend
```bash
cd frontend
npm install
npm run dev
```

3. Setup Contracts (coming soon)
```bash
cd contracts
# GenLayer setup instructions
```

## Technology Stack

### Frontend
- Next.js 14
- TypeScript
- Tailwind CSS
- Ethers.js
- MetaMask SDK

### Blockchain
- GenLayer
- Intelligent Contracts
- Python runtime
- Optimistic Democracy consensus

### AI/ML
- Large Language Models
- Natural Language Processing
- Content analysis algorithms

## Project Structure

```
crypto-news-hub/
├── frontend/          # Next.js web application
│   ├── src/
│   │   ├── app/      # App router pages
│   │   ├── components/ # React components
│   │   ├── hooks/    # Custom hooks
│   │   ├── utils/    # Utility functions
│   │   └── types/    # TypeScript types
│   └── package.json
├── contracts/        # GenLayer smart contracts
│   ├── src/
│   │   ├── contracts/ # Intelligent contracts
│   │   ├── tests/    # Contract tests
│   │   └── utils/    # Contract utilities
│   └── requirements.txt
├── docs/             # Documentation
└── README.md
```

## Development Plan

### Phase 1: Foundation (Week 1)
- [x] Frontend environment setup
- [ ] Contract environment setup
- [ ] Basic UI components
- [ ] Simple contract structure

### Phase 2: Core Features (Week 2)
- [ ] News fetching implementation
- [ ] Content submission system
- [ ] Basic reward logic
- [ ] Wallet integration

### Phase 3: Integration (Week 3)
- [ ] Frontend-contract integration
- [ ] AI content validation
- [ ] Community features
- [ ] Testing and debugging

### Phase 4: Polish (Week 4)
- [ ] UI/UX improvements
- [ ] Performance optimization
- [ ] Documentation
- [ ] Demo preparation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License

## Hackathon Submission

This project is submitted for the GenLayer Testnet Bradbury Hackathon.

### Category
AI-powered dApps and Content Platforms

### Innovation
- First AI-curated news platform on GenLayer
- Community-driven content governance
- On-chain quality validation
- Transparent reward distribution

### Impact
- Reduces information overload in crypto space
- Provides reliable news curation
- Enables community governance
- Demonstrates GenLayer capabilities
