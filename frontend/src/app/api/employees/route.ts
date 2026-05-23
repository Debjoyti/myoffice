import { NextResponse } from 'next/server';
import { createEnterpriseApiHandler } from '@/lib/api-handler';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const employeeSchema = z.object({
  employee_code: z.string().min(1),
  department_id: z.string().uuid().optional(),
  designation: z.string().min(1),
  date_of_joining: z.string().date(),
  basic_salary: z.number().min(0),
  user_id: z.string().uuid().optional(),
  manager_id: z.string().uuid().optional(),
});

export const POST = createEnterpriseApiHandler({
  moduleName: 'HRMS',
  actionName: 'CreateEmployee',
  schema: employeeSchema,
  requiredRoles: ['hr', 'company_admin', 'super_admin'],
  handler: async (req, ctx, body) => {
    const supabase = await createClient();

    // Insert employee
    const { data, error } = await supabase
      .from('employees')
      .insert({
        company_id: ctx.company_id,
        ...body
      })
      .select()
      .single();
      
    if (error) {
      return NextResponse.json({ error: 'Failed to create employee', details: error.message }, { status: 400 });
    }
    
    return NextResponse.json({ data, message: 'Employee created successfully' }, { status: 201 });
  }
});

export const GET = createEnterpriseApiHandler({
  moduleName: 'HRMS',
  actionName: 'ListEmployees',
  requiredRoles: ['hr', 'company_admin', 'super_admin', 'manager', 'employee'],
  handler: async (req, ctx) => {
    const supabase = await createClient();
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    
    const { data, error, count } = await supabase
      .from('employees')
      .select('*, users(full_name, email), departments(name)', { count: 'exact' })
      .eq('company_id', ctx.company_id)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });
      
    if (error) {
      return NextResponse.json({ error: 'Failed to fetch employees', details: error.message }, { status: 400 });
    }
    
    return NextResponse.json({ data, meta: { total: count, limit, offset } });
  }
});
