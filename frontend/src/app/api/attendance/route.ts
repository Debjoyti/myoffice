import { NextResponse } from 'next/server';
import { createEnterpriseApiHandler } from '@/lib/api-handler';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const checkInSchema = z.object({
  action: z.enum(['check_in', 'check_out']),
  location_data: z.any().optional(),
});

export const POST = createEnterpriseApiHandler({
  moduleName: 'Attendance',
  actionName: 'LogAttendance',
  schema: checkInSchema,
  requiredRoles: ['employee', 'manager', 'hr', 'company_admin', 'super_admin'],
  handler: async (req, ctx, body) => {
    const supabase = await createClient();
    const today = new Date().toISOString().split('T')[0];
    
    // Get the employee record for the current user
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('id')
      .eq('user_id', ctx.id)
      .single();
      
    if (empError || !employee) {
      return NextResponse.json({ error: 'Employee record not found for user' }, { status: 404 });
    }

    if (body!.action === 'check_in') {
      const { data, error } = await supabase
        .from('attendance_records')
        .upsert({
          company_id: ctx.company_id,
          employee_id: employee.id,
          date: today,
          check_in: new Date().toISOString(),
          status: 'present',
          location_data: body!.location_data || {}
        }, { onConflict: 'employee_id, date' })
        .select()
        .single();
        
      if (error) throw error;
      return NextResponse.json({ data, message: 'Checked in successfully' });
      
    } else {
      const { data, error } = await supabase
        .from('attendance_records')
        .update({
          check_out: new Date().toISOString(),
          location_data: body!.location_data || {}
        })
        .match({ employee_id: employee.id, date: today })
        .select()
        .single();
        
      if (error) throw error;
      return NextResponse.json({ data, message: 'Checked out successfully' });
    }
  }
});
