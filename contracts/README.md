# GenLayer Crypto News Hub - Smart Contracts

## Overview

This directory contains the GenLayer Intelligent Contracts for the AI Crypto News Hub platform.

## Contract Structure

### Core Contracts

1. **ContentRegistry.sol** - Manages article storage and metadata
2. **RewardSystem.sol** - Handles token distribution and rewards
3. **Governance.sol** - Community voting and platform management
4. **NewsOracle.sol** - AI-powered content validation

### Key Features

- **AI Content Validation** - LLM-based quality assessment
- **Community Governance** - On-chain voting mechanisms
- **Reward Distribution** - Automatic token rewards
- **Content Curation** - Quality scoring and filtering

## Setup Instructions

### Prerequisites
- Python 3.8+
- GenLayer CLI tools
- Access to GenLayer testnet

### Installation

```bash
# Install GenLayer development tools
pip install genlayer-dev

# Setup development environment
genlayer init

# Install dependencies
pip install -r requirements.txt
```

### Development Workflow

```bash
# Deploy to local testnet
genlayer deploy --local

# Test contracts
genlayer test

# Deploy to testnet
genlayer deploy --network bradbury
```

## Contract Architecture

### ContentRegistry
```python
@contract
class ContentRegistry:
    def submit_article(self, content: str, source: str) -> ArticleID:
        # Submit new article for validation
        
    def validate_article(self, article_id: ArticleID) -> QualityScore:
        # AI-powered quality assessment
        
    def get_article(self, article_id: ArticleID) -> Article:
        # Retrieve article metadata
```

### RewardSystem
```python
@contract
class RewardSystem:
    def calculate_rewards(self, user: address) -> RewardAmount:
        # Calculate user rewards based on contributions
        
    def distribute_rewards(self) -> bool:
        # Distribute pending rewards
        
    def stake_for_voting(self, amount: uint) -> bool:
        # Stake tokens for governance power
```

### Governance
```python
@contract
class Governance:
    def vote_on_proposal(self, proposal_id: uint, vote: bool) -> bool:
        # Vote on platform proposals
        
    def create_proposal(self, description: str) -> ProposalID:
        # Create new governance proposal
        
    def execute_proposal(self, proposal_id: uint) -> bool:
        # Execute approved proposal
```

## Testing

### Unit Tests
```bash
# Run all tests
genlayer test

# Run specific test
genlayer test test_content_validation.py
```

### Integration Tests
```bash
# Test full workflow
genlayer test --integration

# Test with mock data
genlayer test --mock
```

## Deployment

### Local Development
```bash
# Start local testnet
genlayer node --local

# Deploy contracts
genlayer deploy --local --network local
```

### Testnet Deployment
```bash
# Deploy to Bradbury testnet
genlayer deploy --network bradbury

# Verify deployment
genlayer verify --network bradbury
```

## Security Considerations

- **Input Validation** - All user inputs are validated
- **Access Control** - Role-based permissions
- **Rate Limiting** - Prevent spam and abuse
- **Audit Trail** - All actions are logged

## Monitoring

### Event Logging
```python
# Log article submissions
@event
def ArticleSubmitted(article_id: ArticleID, author: address):
    pass

# Log reward distributions
@event
def RewardDistributed(user: address, amount: uint):
    pass
```

### Performance Metrics
- Article processing time
- AI validation accuracy
- Gas usage per transaction
- User activity statistics

## Integration with Frontend

### Contract Addresses
```javascript
// Mainnet (future)
const CONTENT_REGISTRY = "0x...";
const REWARD_SYSTEM = "0x...";
const GOVERNANCE = "0x...";

// Testnet Bradbury
const CONTENT_REGISTRY = "0x...";
const REWARD_SYSTEM = "0x...";
const GOVERNANCE = "0x...";
```

### ABI Interfaces
```javascript
// Content Registry ABI
const contentRegistryABI = [
    "function submitArticle(string content, string source) returns (uint256)",
    "function validateArticle(uint256 articleId) returns (uint256)",
    "function getArticle(uint256 articleId) returns (tuple)"
];

// Reward System ABI
const rewardSystemABI = [
    "function calculateRewards(address user) returns (uint256)",
    "function distributeRewards() returns (bool)",
    "function stakeForVoting(uint256 amount) returns (bool)"
];
```

## Future Enhancements

### Phase 2 Features
- Advanced AI models
- Cross-chain integration
- Mobile app support
- Enterprise features

### Phase 3 Features
- Decentralized storage
- Advanced governance
- Token economics
- Marketplace integration
