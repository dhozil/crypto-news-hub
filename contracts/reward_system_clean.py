# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
import datetime

@allow_storage
@dataclass
class RewardPool:
    total_pool: bigint
    distributed_rewards: bigint
    last_distribution_time: bigint
    distribution_rate: bigint

@allow_storage
@dataclass
class RewardRecord:
    user: str
    amount: bigint
    reason: str
    timestamp: bigint
    is_claimed: bool

@allow_storage
@dataclass
class StakingInfo:
    user: str
    staked_amount: bigint
    staking_start_time: bigint
    voting_power: bigint
    unlock_time: bigint

class RewardSystem(gl.Contract):
    reward_pool: RewardPool
    reward_records: DynArray[RewardRecord]
    staking_info: DynArray[StakingInfo]
    reward_counter: bigint
    
    ARTICLE_REWARD: bigint = 10 * 10**18
    UPVOTE_REWARD: bigint = 1 * 10**18
    QUALITY_BONUS_MULTIPLIER: bigint = 2
    
    MIN_STAKE_AMOUNT: bigint = 100 * 10**18
    UNLOCK_PERIOD: bigint = 7 * 24 * 3600
    VOTING_POWER_MULTIPLIER: bigint = 1
    
    def __init__(self):
        # Initialize with empty arrays - GenLayer will handle initialization
        self.reward_counter = 0
    
    def get_user_index(self, user: str) -> bigint:
        for i, stake in enumerate(self.staking_info):
            if stake.user == user:
                return i
        return -1
    
    @gl.public.view
    def calculate_article_reward(self, author: str, article_score: bigint, upvotes: bigint, downvotes: bigint) -> bigint:
        base_reward = self.ARTICLE_REWARD
        
        if article_score >= 800:
            base_reward *= self.QUALITY_BONUS_MULTIPLIER
        
        engagement_score = upvotes - downvotes
        if engagement_score > 10:
            engagement_bonus = min(engagement_score * self.UPVOTE_REWARD, 50 * 10**18)
            base_reward += engagement_bonus
        
        return base_reward
    
    @gl.public.write
    def distribute_article_reward(self, author: str, article_score: bigint, upvotes: bigint, downvotes: bigint, article_id: bigint) -> bool:
        reward_amount = self.calculate_article_reward(author, article_score, upvotes, downvotes)
        
        if reward_amount == 0:
            return False
        
        if self.reward_pool.total_pool - self.reward_pool.distributed_rewards < reward_amount:
            return False
        
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
        self.reward_pool.distributed_rewards += reward_amount
        
        return True
    
    @gl.public.view
    def calculate_curation_reward(self, curator: str, article_id: bigint, curation_type: str) -> bigint:
        if curation_type == 'upvote':
            return self.UPVOTE_REWARD
        elif curation_type == 'quality_check':
            return 2 * self.UPVOTE_REWARD
        else:
            return 0
    
    @gl.public.write
    def distribute_curation_reward(self, curator: str, article_id: bigint, curation_type: str) -> bool:
        reward_amount = self.calculate_curation_reward(curator, article_id, curation_type)
        
        if reward_amount == 0:
            return False
        
        if self.reward_pool.total_pool - self.reward_pool.distributed_rewards < reward_amount:
            return False
        
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
        self.reward_pool.distributed_rewards += reward_amount
        
        return True
    
    @gl.public.write
    def stake_tokens(self, user: str, amount: bigint) -> bool:
        if amount < self.MIN_STAKE_AMOUNT:
            raise Exception("Amount below minimum stake")
        
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
                unlock_time=0
            )
            self.staking_info.append(new_stake)
        
        return True
    
    @gl.public.write
    def unstake_tokens(self, user: str, amount: bigint) -> bool:
        user_index = self.get_user_index(user)
        if user_index < 0:
            raise Exception("No staking info found")
        
        if self.staking_info[user_index].staked_amount < amount:
            raise Exception("Insufficient staked amount")
        
        self.staking_info[user_index].staked_amount -= amount
        self.staking_info[user_index].voting_power = self.staking_info[user_index].staked_amount // (10**18)
        self.staking_info[user_index].unlock_time = int(datetime.datetime.now().timestamp()) + self.UNLOCK_PERIOD
        
        return True
    
    @gl.public.write
    def claim_rewards(self, user: str) -> bigint:
        total_claimable = 0
        
        for i, reward in enumerate(self.reward_records):
            if reward.user == user and not reward.is_claimed:
                total_claimable += reward.amount
                self.reward_records[i].is_claimed = True
        
        return total_claimable
    
    @gl.public.view
    def get_pending_rewards(self, user: str) -> bigint:
        pending = 0
        for reward in self.reward_records:
            if reward.user == user and not reward.is_claimed:
                pending += reward.amount
        
        return pending
    
    @gl.public.view
    def get_voting_power(self, user: str) -> bigint:
        user_index = self.get_user_index(user)
        if user_index < 0:
            return 0
        
        return self.staking_info[user_index].voting_power
    
    @gl.public.view
    def get_staking_info(self, user: str) -> Optional[StakingInfo]:
        user_index = self.get_user_index(user)
        if user_index < 0:
            return None
        return self.staking_info[user_index]
    
    @gl.public.view
    def get_reward_pool_stats(self) -> Tuple[bigint, bigint, bigint]:
        return (
            self.reward_pool.total_pool,
            self.reward_pool.distributed_rewards,
            self.reward_pool.total_pool - self.reward_pool.distributed_rewards
        )
    
    @gl.public.view
    def get_user_reward_history(self, user: str) -> DynArray[bigint]:
        user_rewards = DynArray[bigint]()
        for i, reward in enumerate(self.reward_records):
            if reward.user == user:
                user_rewards.append(i)
        
        return user_rewards
