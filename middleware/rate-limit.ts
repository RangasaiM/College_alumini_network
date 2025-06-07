import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

const rateLimiters = {
  // General API rate limit: 100 requests per minute
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'),
    analytics: true,
    prefix: 'ratelimit:api',
  }),

  // Auth endpoints: 10 requests per minute
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'),
    analytics: true,
    prefix: 'ratelimit:auth',
  }),

  // Message endpoints: 30 messages per minute
  messages: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, '1 m'),
    analytics: true,
    prefix: 'ratelimit:messages',
  }),
};

export async function rateLimit(
  req: NextRequest,
  type: keyof typeof rateLimiters = 'api'
) {
  try {
    const ip = req.ip ?? '127.0.0.1';
    const { success, pending, limit, reset, remaining } = await rateLimiters[type].limit(
      `${ip}:${type}`
    );

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Too Many Requests',
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
          },
        }
      );
    }

    return null;
  } catch (error) {
    console.error('Rate limit error:', error);
    return null;
  }
} 