import re

def analyze_auth(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Check for functions bypassing RLS
    security_definer = re.findall(r'security definer', content, re.IGNORECASE)
    print(f"Functions with SECURITY DEFINER: {len(security_definer)}")

    # Check for direct references to auth.users
    auth_users = re.findall(r'auth\.users', content, re.IGNORECASE)
    print(f"References to auth.users: {len(auth_users)}")

    # Check for user metadata usage
    raw_user_meta = re.findall(r'raw_user_meta_data', content, re.IGNORECASE)
    print(f"Usage of raw_user_meta_data: {len(raw_user_meta)}")

analyze_auth('supabase/migrations/20260423070516_init_schema.sql')
