import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/services/auth';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1] || '';

    const user = getCurrentUser(token);
    return NextResponse.json(user);
  } catch (error: any) {
    return NextResponse.json({ detail: "Invalid authentication" }, { status: 401 });
  }
}
