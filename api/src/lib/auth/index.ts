import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const getSession = async () => {
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
};

export const getUser = async () => {
  const session = await getSession();
  return session?.user;
};

// Helper to extract company_id from custom claims or return provided override
export const getCurrentCompanyId = (user: any, requestCompanyId?: string) => {
  const claims = user?.app_metadata?.user_roles;
  if (claims && Object.keys(claims).length > 0) {
    if (requestCompanyId && claims[requestCompanyId]) {
      return requestCompanyId;
    }
    // Default to the first company they have access to
    return Object.keys(claims)[0];
  }
  return null;
};
