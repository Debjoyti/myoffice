import re

def analyze_rls(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Find all table creations
    tables = re.findall(r'CREATE TABLE public\.(\w+)', content, re.IGNORECASE)
    print(f"Total tables: {len(tables)}")

    # Find RLS enable statements
    rls_enabled = re.findall(r'ALTER TABLE public\.(\w+) ENABLE ROW LEVEL SECURITY', content, re.IGNORECASE)
    print(f"RLS enabled on: {len(rls_enabled)}")

    # Missing RLS
    missing = set(tables) - set(rls_enabled)
    if missing:
        print(f"Missing RLS on: {missing}")

    # Policies with USING (true)
    true_policies = re.findall(r'CREATE POLICY .* USING \(true\)', content, re.IGNORECASE)
    print(f"Policies with USING (true): {len(true_policies)}")

    # Policies with WITH CHECK (true)
    true_checks = re.findall(r'CREATE POLICY .* WITH CHECK \(true\)', content, re.IGNORECASE)
    print(f"Policies with WITH CHECK (true): {len(true_checks)}")

analyze_rls('supabase/migrations/20260423070517_saas_schema.sql')
