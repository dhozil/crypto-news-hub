# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
import datetime
import json

@allow_storage
@dataclass
class RewardPool:
    total_pool: bigint
    distributed_rewards: bigint
    last_distribution_time: bigint
    distribution_rate: bigint  # Rewards per hour

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

@allow_storage
@dataclass
class FraudDetectionResult:
    is_fraudulent: bool
    risk_score: bigint  # 0-1000
    reason: str
    confidence: bigint  # 0-100

@allow_storage
@dataclass
class RewardOptimization:
    optimal_article_reward: bigint
    optimal_upvote_reward: bigint
    market_condition: str
    confidence: bigint

class RewardSystem(gl.Contract):
    reward_pool: RewardPool
    reward_records: DynArray[RewardRecord]
    staking_info: DynArray[StakingInfo]
    fraud_history: DynArray[FraudDetectionResult]
    reward_counter: bigint
    
    # Dynamic reward rates (instance variables)
    article_reward: bigint
    upvote_reward: bigint
    
    # Constants
    QUALITY_BONUS_MULTIPLIER: bigint = 2
    MIN_STAKE_AMOUNT: bigint = 100 * 10**18
    UNLOCK_PERIOD: bigint = 7 * 24 * 3600
    VOTING_POWER_MULTIPLIER: bigint = 1
    MAX_RISK_SCORE: bigint = 700
    
    def __init__(self):
        self.reward_pool = RewardPool(
            total_pool=1000000 * 10**18,
            distributed_rewards=0,
            last_distribution_time=0,
            distribution_rate=100 * 10**18
        )
        self.reward_counter = 0
        self.article_reward = 10 * 10**18  # 10 GEN
        self.upvote_reward = 1 * 10**18    # 1 GEN
    
    def get_user_index(self, user: str) -> int:
        for i, stake in enumerate(self.staking_info):
            if stake.user == user:
                return i
        return -1
    
    # ------------------------
    # LLM FRAUD DETECTION 🕵️
    # ------------------------
    def _detect_fraud_with_llm(
        self,
        user: str,
        activity_type: str,
        activity_data: str
    ) -> FraudDetectionResult:
        """Use LLM to detect potential reward farming/fraud"""
        
        fraud_prompt = f"""
        Analyze this user activity for potential reward system abuse:
        
        User: {user}
        Activity Type: {activity_type}
        Activity Data: {activity_data}
        
        Look for patterns like:
        - Multiple accounts from same user
        - Unnatural activity timing
        - Suspicious reward farming patterns
        - Bot/automated behavior
        
        Respond ONLY in JSON format:
        {{
            "is_fraudulent": true/false,
            "risk_score": number (0-1000),
            "reason": "brief explanation",
            "confidence": number (0-100)
        }}
        """
        
        def fraud_leader():
            return gl.nondet.exec_prompt(fraud_prompt)
        
        def fraud_validator(leader_res) -> bool:
            if not isinstance(leader_res, gl.vm.Return):
                return False
            try:
                leader_data = json.loads(leader_res.calldata)
                my_res = fraud_leader()
                my_data = json.loads(my_res)
                # Consensus: risk scores within 200 points
                return abs(leader_data.get("risk_score", 500) - my_data.get("risk_score", 500)) <= 200
            except:
                return False
        
        try:
            response = gl.vm.run_nondet_unsafe(fraud_leader, fraud_validator)
            result = json.loads(response)
            return FraudDetectionResult(
                is_fraudulent=result.get("is_fraudulent", False),
                risk_score=result.get("risk_score", 500),
                reason=result.get("reason", "Unknown"),
                confidence=result.get("confidence", 50)
            )
        except:
            return FraudDetectionResult(
                is_fraudulent=False,
                risk_score=500,
                reason="Detection failed - default to safe",
                confidence=0
            )
    
    # ------------------------
    # AI REWARD OPTIMIZATION 📊
    # ------------------------
    @gl.public.view
    def get_llm_reward_recommendation(self) -> str:
        """Use LLM to recommend optimal reward rates (VIEW - no state change)"""
        
        # Calculate pool usage for context
        pool_usage = (self.reward_pool.distributed_rewards * 100) // self.reward_pool.total_pool
        
        optimization_prompt = f"""
        Optimize reward rates for a content platform:
        
        Current Stats:
        - Total Pool: {self.reward_pool.total_pool // 10**18} GEN
        - Distributed: {self.reward_pool.distributed_rewards // 10**18} GEN
        - Pool Usage: {pool_usage}%
        - Current Article Reward: {self.article_reward // 10**18} GEN
        - Current Upvote Reward: {self.upvote_reward // 10**18} GEN
        
        Market Conditions:
        - High quality content is being produced regularly
        - User engagement is growing
        - Need to balance incentive vs sustainability
        
        Recommend optimal reward rates:
        
        Respond ONLY in JSON format:
        {{
            "optimal_article_reward": number (in GEN tokens, 1-50),
            "optimal_upvote_reward": number (in GEN tokens, 0.1-5),
            "market_condition": "bullish/bearish/neutral",
            "confidence": number (0-100)
        }}
        """
        
        def optimize_leader():
            return gl.nondet.exec_prompt(optimization_prompt)
        
        def optimize_validator(leader_res) -> bool:
            if not isinstance(leader_res, gl.vm.Return):
                return False
            try:
                leader_data = json.loads(leader_res.calldata)
                my_res = optimize_leader()
                my_data = json.loads(my_res)
                # Consensus: article rewards within 10 GEN variance
                article_diff = abs(leader_data.get("optimal_article_reward", 10) - my_data.get("optimal_article_reward", 10))
                return article_diff <= 10
            except:
                return False
        
        try:
            response = gl.vm.run_nondet_unsafe(optimize_leader, optimize_validator)
            result = json.loads(response)
            article_reward = int(result.get("optimal_article_reward", 10))
            upvote_reward = int(result.get("optimal_upvote_reward", 1))
            market = result.get("market_condition", "neutral")
            confidence = result.get("confidence", 50)
            return f"RECOMMENDATION: Article={article_reward} GEN, Upvote={upvote_reward} GEN, Market={market}, Confidence={confidence}%"
        except Exception as e:
            return f"LLM_ERROR: {str(e)} - Current: Article={self.article_reward // 10**18} GEN, Upvote={self.upvote_reward // 10**18} GEN"
    
    # ------------------------
    # WEB ORACLE - PRICE FEEDS 🌐
    # ------------------------
    def _get_external_price_data(self, token_symbol: str) -> int:
        """Fetch external price data with consensus"""
        
        price_url = f"https://api.coingecko.com/api/v3/simple/price?ids={token_symbol}&vs_currencies=usd"
        
        def price_leader():
            response = gl.nondet.web.get(price_url)
            return response.body.decode("utf-8")
        
        def price_validator(leader_res) -> bool:
            if not isinstance(leader_res, gl.vm.Return):
                return False
            try:
                leader_data = json.loads(leader_res.calldata)
                my_res = price_leader()
                my_data = json.loads(my_res)
                # Consensus: prices within 5% variance
                leader_price = leader_data.get(token_symbol, {}).get("usd", 0)
                my_price = my_data.get(token_symbol, {}).get("usd", 0)
                if leader_price > 0 and my_price > 0:
                    diff = abs(leader_price - my_price)
                    return diff <= max(leader_price, my_price) * 0.05
                return False
            except:
                return False
        
        try:
            response = gl.vm.run_nondet_unsafe(price_leader, price_validator)
            data = json.loads(response)
            # Return price in cents (multiply by 100 for integer)
            return int(data.get(token_symbol, {}).get("usd", 0) * 100)
        except:
            return 0
    
    @gl.public.view
    def get_token_price(self, token_symbol: str) -> int:
        """Get token price in cents with web oracle"""
        return self._get_external_price_data(token_symbol)
    
    # ------------------------
    # ENHANCED REWARD FUNCTIONS
    # ------------------------
    @gl.public.view
    def calculate_article_reward(
        self, 
        author: str,
        article_score: int,
        upvotes: int,
        downvotes: int,
        check_fraud: bool = True
    ) -> Tuple[int, str]:
        """Calculate reward with optional fraud check"""
        
        # 🕵️ FRAUD CHECK
        if check_fraud:
            fraud_result = self._detect_fraud_with_llm(
                author,
                "article_submission",
                f"score:{article_score}, upvotes:{upvotes}, downvotes:{downvotes}"
            )
            
            if fraud_result.is_fraudulent and fraud_result.risk_score > self.MAX_RISK_SCORE:
                return (0, f"Fraud detected: {fraud_result.reason}")
        
        base_reward = self.article_reward
        
        # Quality bonus
        if article_score >= 800:
            base_reward *= self.QUALITY_BONUS_MULTIPLIER
        
        # Engagement bonus
        engagement_score = upvotes - downvotes
        if engagement_score > 10:
            engagement_bonus = min(engagement_score * self.upvote_reward, 50 * 10**18)
            base_reward += engagement_bonus
        
        return (base_reward, "Success")
    
    @gl.public.write
    def distribute_article_reward(
        self,
        author: str,
        article_score: int,
        upvotes: int,
        downvotes: int,
        article_id: int
    ) -> Tuple[bool, str]:
        """Distribute reward with fraud detection"""
        
        reward_amount, message = self.calculate_article_reward(
            author, article_score, upvotes, downvotes, check_fraud=True
        )
        
        if reward_amount == 0:
            return (False, message)
        
        # Check pool balance
        if self.reward_pool.total_pool - self.reward_pool.distributed_rewards < reward_amount:
            return (False, "Insufficient pool balance")
        
        # Create reward record
        reward_record = RewardRecord(
            user=author,
            amount=reward_amount,
            reason=f"Article reward for article #{article_id}",
            timestamp=0,
            is_claimed=False
        )
        
        self.reward_records.append(reward_record)
        self.reward_pool.distributed_rewards += reward_amount
        
        return (True, f"Reward distributed: {reward_amount // 10**18} GEN")
    
    @gl.public.write
    def apply_reward_rates(self, article_reward_gen: int, upvote_reward_gen: int) -> str:
        """Apply reward rates recommended by LLM (WRITE - deterministic)"""
        
        # Validate inputs
        if article_reward_gen < 1 or article_reward_gen > 100:
            return "ERROR: Article reward must be 1-100 GEN"
        if upvote_reward_gen < 1 or upvote_reward_gen > 10:
            return "ERROR: Upvote reward must be 0.1-10 GEN"
        
        # Apply the rates (deterministic state change)
        self.article_reward = article_reward_gen * 10**18
        self.upvote_reward = upvote_reward_gen * 10**17  # upvote in 0.1 GEN increments
        
        return f"APPLIED: Article={article_reward_gen} GEN, Upvote={upvote_reward_gen / 10} GEN"
    
    # ------------------------
    # STAKING FUNCTIONS
    # ------------------------
    @gl.public.write
    def stake_tokens(self, user: str, amount: int, current_time: int = 0) -> bool:
        if amount < self.MIN_STAKE_AMOUNT:
            raise Exception("Amount below minimum stake")
        
        # Use provided time or 0
        timestamp = current_time if current_time > 0 else 0
        
        user_index = self.get_user_index(user)
        if user_index >= 0:
            self.staking_info[user_index].staked_amount += amount
            self.staking_info[user_index].voting_power = self.staking_info[user_index].staked_amount // (10**18)
        else:
            new_stake = StakingInfo(
                user=user,
                staked_amount=amount,
                staking_start_time=timestamp,
                voting_power=amount // (10**18),
                unlock_time=0
            )
            self.staking_info.append(new_stake)
        
        return True
    
    @gl.public.write
    def unstake_tokens(self, user: str, amount: int, current_time: int = 0) -> bool:
        user_index = self.get_user_index(user)
        if user_index < 0:
            raise Exception("No staking info found")
        
        if self.staking_info[user_index].staked_amount < amount:
            raise Exception("Insufficient staked amount")
        
        # Use provided time or calculate based on current
        timestamp = current_time if current_time > 0 else 0
        
        self.staking_info[user_index].staked_amount -= amount
        self.staking_info[user_index].voting_power = self.staking_info[user_index].staked_amount // (10**18)
        self.staking_info[user_index].unlock_time = timestamp + self.UNLOCK_PERIOD
        
        return True
    
    # ------------------------
    # CLAIM & VIEW FUNCTIONS
    # ------------------------
    @gl.public.write
    def claim_rewards(self, user: str) -> int:
        total_claimable = 0
        
        for i, reward in enumerate(self.reward_records):
            if reward.user == user and not reward.is_claimed:
                total_claimable += reward.amount
                self.reward_records[i].is_claimed = True
        
        return total_claimable
    
    @gl.public.view
    def get_pending_rewards(self, user: str) -> int:
        pending = 0
        for reward in self.reward_records:
            if reward.user == user and not reward.is_claimed:
                pending += reward.amount
        return pending
    
    @gl.public.view
    def get_voting_power(self, user: str) -> int:
        user_index = self.get_user_index(user)
        if user_index < 0:
            return 0
        return self.staking_info[user_index].voting_power
    
    @gl.public.view
    def get_reward_pool_stats(self) -> Tuple[int, int, int]:
        return (
            self.reward_pool.total_pool,
            self.reward_pool.distributed_rewards,
            self.reward_pool.total_pool - self.reward_pool.distributed_rewards
        )
    
    @gl.public.view
    def get_fraud_detection_history(self) -> List[int]:
        """Get history of fraud detection results"""
        history = []
        for i, result in enumerate(self.fraud_history):
            history.append(i)
        return history
    
    @gl.public.view
    def get_staking_info(self, user: str) -> Optional[StakingInfo]:
        user_index = self.get_user_index(user)
        if user_index < 0:
            return None
        return self.staking_info[user_index]
