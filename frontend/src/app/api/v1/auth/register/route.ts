import { NextResponse } from 'next/server';
import { registerSchema, registerUser } from '@/lib/services/auth';
import { z } from 'zod';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = registerSchema.parse(body);

    const result = registerUser(data);

    return NextResponse.json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    if (error.message === "Email already registered") {
      return NextResponse.json({ detail: "Email already registered" }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
