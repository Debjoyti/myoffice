import { NextResponse } from 'next/server';
import { loginSchema, loginUser } from '@/lib/services/auth';
import { z } from 'zod';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = loginSchema.parse(body);

    const result = loginUser(data);

    return NextResponse.json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    if (error.message === "Invalid credentials") {
      return NextResponse.json({ detail: "Invalid credentials" }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
