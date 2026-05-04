"""
GenLayer Deploy Script for Crypto News Hub
Deploys ContentRegistry and RewardSystem contracts to Bradbury testnet
"""

from genlayer import deploy_contract

def main():
    # Deploy ContentRegistry
    print("📝 Deploying ContentRegistry...")
    content_registry = deploy_contract(
        contract_path="src/content_registry.py",
        network="bradbury"
    )
    print(f"✅ ContentRegistry deployed at: {content_registry.address}")
    
    # Deploy RewardSystem
    print("💰 Deploying RewardSystem...")
    reward_system = deploy_contract(
        contract_path="src/reward_system.py", 
        network="bradbury"
    )
    print(f"✅ RewardSystem deployed at: {reward_system.address}")
    
    print("\n📋 Update frontend/src/config/constants.ts with these addresses:")
    print(f'  contentRegistry: "{content_registry.address}",')
    print(f'  rewardSystem: "{reward_system.address}",')

if __name__ == "__main__":
    main()
