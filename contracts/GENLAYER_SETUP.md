# GenLayer CLI Installation & Setup Guide

## Quick Setup Commands

### 1. Install GenLayer CLI
```bash
# Install via pip
pip install genlayer

# Or install from source
git clone https://github.com/genlayerlabs/genlayer-cli.git
cd genlayer-cli
pip install -e .
```

### 2. Setup Environment
```bash
# Check installation
genlayer --version

# Set network (Bradbury testnet)
genlayer network set bradbury

# Check network info
genlayer network info

# List available networks
genlayer network list
```

### 3. Deploy Contracts
```bash
# Navigate to contracts directory
cd contracts

# Deploy Content Registry
genlayer deploy --contract src/content_registry.py --network bradbury

# Deploy Reward System  
genlayer deploy --contract src/reward_system.py --network bradbury

# Check deployment status
genlayer status
```

### 4. Test Contracts
```bash
# Run local tests
genlayer test --local

# Run specific test
genlayer test src/tests/test_simple.py

# Test on testnet
genlayer test --network bradbury
```

### 5. Verify Deployment
```bash
# Get contract addresses
genlayer contracts list

# Verify contract
genlayer verify --contract <contract-address> --network bradbury

# Check contract state
genlayer state --contract <contract-address>
```

## Common Issues & Solutions

### Issue: "genlayer command not found"
```bash
# Solution: Add to PATH
export PATH=$PATH:~/.local/bin
# Or use python -m
python -m genlayer --version
```

### Issue: "Network not found"
```bash
# Solution: Update CLI
pip install --upgrade genlayer

# Or manually set network
genlayer network set bradbury
```

### Issue: "Contract deployment failed"
```bash
# Solution: Check contract syntax
genlayer validate --contract src/content_registry.py

# Check dependencies
genlayer deps --contract src/content_registry.py
```

## Contract ABI Generation

### Generate ABI for Frontend
```bash
# Generate ABI files
genlayer abi --contract src/content_registry.py --output abi/
genlayer abi --contract src/reward_system.py --output abi/

# Generate TypeScript types
genlayer types --contract src/content_registry.py --output types/
genlayer types --contract src/reward_system.py --output types/
```

## Frontend Integration

### Update Contract Addresses
After deployment, update frontend constants:
```typescript
// frontend/src/config/constants.ts
export const CONTRACT_ADDRESSES = {
  contentRegistry: '0x...', // Replace with deployed address
  rewardSystem: '0x...',    // Replace with deployed address
};
```

### Test Integration
```bash
# Test frontend connection
cd frontend
npm run test

# Or test manually
npm run dev
# Visit http://localhost:3000
```

## Development Workflow

### Local Development
```bash
# Terminal 1: Start local node
genlayer node --local

# Terminal 2: Deploy contracts
genlayer deploy --contract src/content_registry.py --network local
genlayer deploy --contract src/reward_system.py --network local

# Terminal 3: Run frontend
cd frontend
npm run dev
```

### Testnet Development
```bash
# Deploy to testnet
genlayer deploy --contract src/content_registry.py --network bradbury

# Test transactions
genlayer call --contract <address> --method submitArticle --params '{"title":"Test","content":"..."}'

# Check state
genlayer state --contract <address>
```

## Monitoring & Debugging

### View Logs
```bash
# View contract logs
genlayer logs --contract <address>

# View transaction logs
genlayer logs --tx <tx-hash>

# View network logs
genlayer logs --network bradbury
```

### Debug Contracts
```bash
# Debug mode
genlayer deploy --contract src/content_registry.py --debug

# Step through execution
genlayer debug --contract <address> --method <method>

# Inspect state
genlayer inspect --contract <address>
```

## Next Steps

1. **Install GenLayer CLI** using the commands above
2. **Deploy contracts** to Bradbury testnet
3. **Update frontend** with deployed contract addresses
4. **Test full integration** end-to-end
5. **Prepare for demo** with real blockchain data

## Resources

- [GenLayer Documentation](https://docs.genlayer.com)
- [GenLayer CLI GitHub](https://github.com/genlayerlabs/genlayer-cli)
- [Bradbury Testnet Info](https://bradbury.genlayer.com)
- [Contract Examples](https://github.com/genlayerlabs/examples)
