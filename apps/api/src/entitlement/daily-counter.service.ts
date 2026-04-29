import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service.js';

export type CounterAction = 'swipe' | 'superLike' | 'rewind' | 'messageBeforeMatch';

const COUNTER_LIMITS: Record<CounterAction, number> = {
  swipe: 50,
  superLike: 1,
  rewind: 0,
  messageBeforeMatch: 0,
};

@Injectable()
export class DailyCounterService {
  constructor(private readonly redis: RedisService) {}

  private key(userId: string, action: CounterAction): string {
    return `daily:${action}:${userId}`;
  }

  private secondsUntilMidnight(): number {
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    return Math.floor((midnight.getTime() - now.getTime()) / 1000);
  }

  async increment(userId: string, action: CounterAction): Promise<{ allowed: boolean; remaining: number }> {
    const key = this.key(userId, action);
    const limit = COUNTER_LIMITS[action];
    const redis = this.redis.getClient();

    const current = await redis.incr(key);
    if (current === 1) {
      await redis.expire(key, this.secondsUntilMidnight());
    }

    const remaining = Math.max(0, limit - current);
    return { allowed: current <= limit, remaining };
  }

  async get(userId: string, action: CounterAction): Promise<{ used: number; remaining: number }> {
    const key = this.key(userId, action);
    const limit = COUNTER_LIMITS[action];
    const redis = this.redis.getClient();

    const used = parseInt((await redis.get(key)) ?? '0', 10);
    return { used, remaining: Math.max(0, limit - used) };
  }

  async reset(userId: string, action: CounterAction): Promise<void> {
    await this.redis.getClient().del(this.key(userId, action));
  }
}
