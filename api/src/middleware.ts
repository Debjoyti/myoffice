import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { PRSKError } from '@/lib/errors/prsk-error';

// Initialize Redis for Upstash rate limiting
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || 'https://mock-url.upstash.io',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || 'mock-token',
});

// Default rate limits: 100 req/min per user
const defaultRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'),
  analytics: true,
});

export async function middleware(request: NextRequest) {
  try {
    const requestHeaders = new Headers(request.headers);

    const res = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    const supabase = createMiddlewareClient({ req: request, res });

    // 1. Idempotency Key Check
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      const idempotencyKey = request.headers.get('Idempotency-Key');
      // For finance/payouts endpoints, this would be strictly required.
    }

    // 2. Auth Check
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error || !session) {
      throw new PRSKError({
        code: 'UNAUTHORIZED',
        status: 401,
        message: 'Missing or invalid authentication token.',
      });
    }

    // 3. Rate Limit
    // Use user ID as the rate limit key. Fallback to IP if needed.
    const rateLimitKey = session.user.id;
    const { success, limit, reset, remaining } = await defaultRatelimit.limit(rateLimitKey);

    if (!success) {
      throw new PRSKError({
        code: 'RATE_LIMITED',
        status: 429,
        message: 'Rate limit exceeded.',
      });
    }

    // Inject company_id and role into headers for downstream processing if provided via custom claims or query params
    const companyId = request.headers.get('x-company-id') || request.nextUrl.searchParams.get('company_id');
    if (companyId) {
      requestHeaders.set('x-company-id', companyId);
      // Re-create the response to include the modified request headers
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }

    // Add rate limit info to headers
    res.headers.set('X-RateLimit-Limit', limit.toString());
    res.headers.set('X-RateLimit-Remaining', remaining.toString());
    res.headers.set('X-RateLimit-Reset', reset.toString());

    return res;
  } catch (error: any) {
    if (error instanceof PRSKError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message, details: error.details } },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

export const config = {
  matcher: ['/api/v1/:path*'],
};
