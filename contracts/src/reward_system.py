# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
import datetime

@allow_storage
@dataclass
class RewardPool:
    total_pool: int
    distributed_rewards: int
    last_distribution_time: int
    distribution_rate: int  # Rewards per hour

@allow_storage
@dataclass
class RewardRecord:
    user: str
    amount: int
    reason: str
    timestamp: int
    is_claimed: bool

@allow_storage
@dataclass
class StakingInfo:
    user: str
    staked_amount: int
    staking_start_time: int
    voting_power: int
    unlock_time: int

class RewardSystem(gl.Contract):
    # State variables with proper GenStudio syntax
    reward_pool: RewardPool
    reward_records: DynArray[RewardRecord]
    staking_info: DynArray[StakingInfo]
    reward_counter: int
    
    # Reward rates (in GEN tokens)
    ARTICLE_REWARD: int = 10 * 10**18  # 10 GEN per approved article
    UPVOTE_REWARD: int = 1 * 10**18     # 1 GEN per upvote received
    QUALITY_BONUS_MULTIPLIER: int = 2   # 2x bonus for high quality
    
    # Staking parameters
    MIN_STAKE_AMOUNT: int = 100 * 10**18  # 100 GEN minimum stake
    UNLOCK_PERIOD: int = 7 * 24 * 3600   # 7 days unlock period
    VOTING_POWER_MULTIPLIER: int = 1     # 1 voting power per GEN staked
    
    def __init__(self):
        """Initialize the reward system"""
        self.reward_pool = RewardPool(
            total_pool=1000000 * 10**18,  # 1M GEN initial pool
            distributed_rewards=0,
            last_distribution_time=int(datetime.datetime.now().timestamp()),
            distribution_rate=100 * 10**18  # 100 GEN per hour
        )
        self.reward_records = DynArray[RewardRecord]()
        self.staking_info = DynArray[StakingInfo]()
        self.reward_counter = 0
    
    def get_user_index(self, user: str) -> int:
        """Get user index in staking info"""
        for i, stake in enumerate(self.staking_info):
            if stake.user == user:
                return i
        return -1
    
    @gl.public.view
    def calculate_article_reward(
        self, 
        author: str,
        article_score: int,
        upvotes: int,
        downvotes: int
    ) -> int:
        """Calculate reward for an approved article"""
        
        base_reward = self.ARTICLE_REWARD
        
        # Quality bonus
        if article_score >= 800:  # High quality (0.8+)
            base_reward *= self.QUALITY_BONUS_MULTIPLIER
        
        # Engagement bonus
        engagement_score = upvotes - downvotes
        if engagement_score > 10:
            engagement_bonus = min(engagement_score * self.UPVOTE_REWARD, 50 * 10**18)
            base_reward += engagement_bonus
        
        return base_reward
    
    @gl.public.write
    def distribute_article_reward(
        self,
        author: str,
        article_score: int,
        upvotes: int,
        downvotes: int,
        article_id: int
    ) -> bool:
        """Distribute reward for an approved article"""
        
        reward_amount = self.calculate_article_reward(author, article_score, upvotes, downvotes)
        
        if reward_amount == 0:
            return False
        
        # Check if reward pool has sufficient funds
        if self.reward_pool.total_pool - self.reward_pool.distributed_rewards < reward_amount:
            return False
        
        # Create reward record
        reward_id = self.reward_counter
        self.reward_counter += 1
        
        reward_record = RewardRecord(
            user=author,
            amount=reward_amount,
            reason=f"Article reward for article #{article_id}",
            timestamp=int(datetime.datetime.now().timestamp()),
            is_claimed=False
        )
        
        self.reward_records.append(reward_record)
        
        # Update pool
        self.reward_pool.distributed_rewards += reward_amount
        
        return True
    
    @gl.public.view
    def calculate_curation_reward(
        self,
        curator: str,
        article_id: int,
        curation_type: str  # 'upvote', 'downvote', 'quality_check'
    ) -> int:
        """Calculate reward for content curation activities"""
        
        if curation_type == 'upvote':
            return self.UPVOTE_REWARD
        elif curation_type == 'quality_check':
            return 2 * self.UPVOTE_REWARD  # Higher reward for quality checking
        else:
            return 0
    
    @gl.public.write
    def distribute_curation_reward(
        self,
        curator: str,
        article_id: int,
        curation_type: str
    ) -> bool:
        """Distribute reward for curation activity"""
        
        reward_amount = self.calculate_curation_reward(curator, article_id, curation_type)
        
        if reward_amount == 0:
            return False
        
        # Check pool balance
        if self.reward_pool.total_pool - self.reward_pool.distributed_rewards < reward_amount:
            return False
        
        # Create reward record
        reward_id = self.reward_counter
        self.reward_counter += 1
        
        reward_record = RewardRecord(
            user=curator,
            amount=reward_amount,
            reason=f"Curation reward for {curation_type} on article #{article_id}",
            timestamp=int(datetime.datetime.now().timestamp()),
            is_claimed=False
        )
        
        self.reward_records.append(reward_record)
        
        # Update pool
        self.reward_pool.distributed_rewards += reward_amount
        
        return True
    
    @gl.public.write
    def stake_tokens(self, user: str, amount: int) -> bool:
        """Stake tokens for voting power"""
        
        if amount < self.MIN_STAKE_AMOUNT:
            raise Exception("Amount below minimum stake")
        
        # Update or create staking info
        user_index = self.get_user_index(user)
        if user_index >= 0:
            self.staking_info[user_index].staked_amount += amount
            self.staking_info[user_index].voting_power = self.staking_info[user_index].staked_amount // (10**18)
        else:
            new_stake = StakingInfo(
                user=user,
                staked_amount=amount,
                staking_start_time=int(datetime.datetime.now().timestamp()),
                voting_power=amount // (10**18),
                unlock_time=0  # No unlock time for additional stakes
            )
            self.staking_info.append(new_stake)
        
        return True
    
    @gl.public.write
    def unstake_tokens(self, user: str, amount: int) -> bool:
        """Unstake tokens (with unlock period)"""
        
        user_index = self.get_user_index(user)
        if user_index < 0:
            raise Exception("No staking info found")
        
        if self.staking_info[user_index].staked_amount < amount:
            raise Exception("Insufficient staked amount")
        
        # Update staking info
        self.staking_info[user_index].staked_amount -= amount
        self.staking_info[user_index].voting_power = self.staking_info[user_index].staked_amount // (10**18)
        
        # Set unlock time
        self.staking_info[user_index].unlock_time = int(datetime.datetime.now().timestamp()) + self.UNLOCK_PERIOD
        
        return True
    
    @gl.public.write
    def claim_rewards(self, user: str) -> int:
        """Claim all pending rewards for a user"""
        
        total_claimable = 0
        
        # Find all unclaimed rewards for user
        for i, reward in enumerate(self.reward_records):
            if reward.user == user and not reward.is_claimed:
                total_claimable += reward.amount
                self.reward_records[i].is_claimed = True
        
        return total_claimable
    
    @gl.public.view
    def get_pending_rewards(self, user: str) -> int:
        """Get total pending rewards for a user"""
        
        pending = 0
        for reward in self.reward_records:
            if reward.user == user and not reward.is_claimed:
                pending += reward.amount
        
        return pending
    
    @gl.public.view
    def get_voting_power(self, user: str) -> int:
        """Get voting power for a user"""
        
        user_index = self.get_user_index(user)
        if user_index < 0:
            return 0
        
        return self.staking_info[user_index].voting_power
    
    @gl.public.view
    def get_staking_info(self, user: str) -> Optional[StakingInfo]:
        """Get staking information for a user"""
        user_index = self.get_user_index(user)
        if user_index < 0:
            return None
        return self.staking_info[user_index]
    
    @gl.public.view
    def get_reward_pool_stats(self) -> Tuple[int, int, int]:
        """Get reward pool statistics"""
        
        return (
            self.reward_pool.total_pool,
            self.reward_pool.distributed_rewards,
            self.reward_pool.total_pool - self.reward_pool.distributed_rewards
        )
    
    @gl.public.view
    def get_user_reward_history(self, user: str) -> List[int]:
        """Get reward history for a user"""
        
        user_rewards = []
        for i, reward in enumerate(self.reward_records):
            if reward.user == user:
                user_rewards.append(i)
        
        return user_rewards
    
    @gl.public.write
    def add_to_reward_pool(self, amount: int) -> bool:
        """Add tokens to reward pool (admin function)"""
        
        self.reward_pool.total_pool += amount
        return True
    
    @gl.public.write
    def update_reward_rates(self, article_reward: int, upvote_reward: int) -> bool:
        """Update reward rates (admin function)"""
        
        self.ARTICLE_REWARD = article_reward
        self.UPVOTE_REWARD = upvote_reward
        return True
