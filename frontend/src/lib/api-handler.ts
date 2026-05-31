import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { DEV_SESSION_COOKIE } from '@/lib/dev-auth';

export type UserContext = {
  id: string;
  email: string;
  company_id: string;
  role: string;
};

export type ApiHandlerConfig<T> = {
  schema?: z.ZodType<T>;
  requireAuth?: boolean;
  requiredRoles?: string[];
  moduleName: string;
  actionName: string;
  handler: (req: Request, ctx: UserContext, body: T | null) => Promise<NextResponse>;
};

export function createEnterpriseApiHandler<T>(config: ApiHandlerConfig<T>) {
  return async function (req: Request) {
    try {
      const supabase = await createClient();

      let userCtx: UserContext | null = null;

      // 1. Authentication & Tenancy
      if (config.requireAuth !== false) {
        // Always try demo cookie first (supports one-click demo login in all environments)
        const cookieStore = await cookies();
        const devCookie = cookieStore.get(DEV_SESSION_COOKIE);
        if (devCookie) {
          try {
            const devUser = JSON.parse(devCookie.value);
            userCtx = {
              id: devUser.user_id,
              email: devUser.email,
              company_id: devUser.company_id,
              role: devUser.role,
            };
          } catch { /* invalid cookie, fall through to Supabase auth */ }
        }

        if (!userCtx) {
          const { data: { session }, error: authError } = await supabase.auth.getSession();

          if (authError || !session) {
            return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
          }

          // Fetch user profile to get company_id and role
          const { data: userProfile, error: profileError } = await supabase
            .from('users')
            .select('company_id, role, id, email')
            .eq('id', session.user.id)
            .single();

          if (profileError || !userProfile) {
            return NextResponse.json({ error: 'User profile not found', code: 'NO_PROFILE' }, { status: 403 });
          }

          userCtx = userProfile as UserContext;
        }

        // 2. RBAC (Role-Based Access Control)
        if (config.requiredRoles && config.requiredRoles.length > 0) {
          if (!config.requiredRoles.includes(userCtx.role) && userCtx.role !== 'super_admin') {
            return NextResponse.json({ error: 'Forbidden. Insufficient permissions.', code: 'FORBIDDEN' }, { status: 403 });
          }
        }
      }

      // 3. Validation
      let parsedBody: T | null = null;
      if (['POST', 'PUT', 'PATCH'].includes(req.method) && config.schema) {
        try {
          const body = await req.json();
          parsedBody = config.schema.parse(body);
        } catch (error) {
          if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Validation failed', details: error.errors, code: 'VALIDATION_ERROR' }, { status: 400 });
          }
          return NextResponse.json({ error: 'Invalid JSON body', code: 'INVALID_JSON' }, { status: 400 });
        }
      }

      // 4. Execute Business Logic
      const response = await config.handler(req, userCtx!, parsedBody);

      return response;

    } catch (error: any) {
      console.error(`[API Error] ${config.moduleName}.${config.actionName}:`, error);
      return NextResponse.json({
        error: 'Internal Server Error',
        message: error.message || 'An unexpected error occurred'
      }, { status: 500 });
    }
  };
}
