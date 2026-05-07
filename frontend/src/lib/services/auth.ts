import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

// Shared logic from backend/api/index.py

// This is a stub for the Supabase DB connection.
// In a full production implementation, we would query Supabase Postgres directly.
// For parity with the python backend's in-memory mock during this migration step,
// and since this is a serverless environment where in-memory state is lost,
// we will export a mock implementation to pass tests, but note it here.
import { supabase } from '../db/supabase';

// Use global to mock persistent state across fast refreshes in development
const globalAny: any = global;

if (!globalAny.usersMock) {
  globalAny.usersMock = {
      "superadmin@demo.com": {
          "id": "mock-uuid-superadmin",
          "email": "superadmin@demo.com",
          "password": "password123",
          "name": "Demo SuperAdmin",
          "role": "superadmin",
          "organization_id": "default",
          "email_verified": true,
          "subscription_status": "active",
          "subscription_end_date": new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          "enabled_services": ["dashboard", "employees"],
          "created_at": new Date().toISOString(),
      },
      "admin@demo.com": {
          "id": "mock-uuid-admin",
          "email": "admin@demo.com",
          "password": "password123",
          "name": "Demo Admin",
          "role": "admin",
          "organization_id": "default",
          "email_verified": true,
          "subscription_status": "active",
          "created_at": new Date().toISOString(),
      }
  };
}

export const usersMock = globalAny.usersMock;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
});

export function loginUser(data: z.infer<typeof loginSchema>) {
    // In production: const { data: user, error } = await supabase.from('users').select().eq('email', data.email).single();
    const user = usersMock[data.email];
    if (!user || user.password !== data.password) {
        throw new Error("Invalid credentials");
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;
    return {
        access_token: "mock-token-" + user.id,
        token_type: "bearer",
        user: userWithoutPassword
    };
}

export function registerUser(data: z.infer<typeof registerSchema>) {
    // In production: const { data: existingUser } = await supabase.from('users').select().eq('email', data.email).single();
    if (usersMock[data.email]) {
        throw new Error("Email already registered");
    }

    const newUser = {
        id: "mock-uuid-" + Date.now().toString() + Math.random().toString(),
        email: data.email,
        password: data.password, // Keep password for state
        name: data.name,
        role: "admin",
        organization_id: "mock-uuid-org-" + Date.now().toString(),
        email_verified: true,
        subscription_status: "active",
        created_at: new Date().toISOString(),
    };

    // Store the newly created user in our mock so login works later in the same session
    // In production: await supabase.from('users').insert(newUser);
    usersMock[data.email] = newUser;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = newUser;

    return {
        access_token: "mock-token-" + newUser.id,
        token_type: "bearer",
        user: userWithoutPassword
    };
}

export function getCurrentUser(token: string) {
    if (!token) throw new Error("Invalid authentication");
    // decode mock token "mock-token-{id}"
    const id = token.replace('Bearer mock-token-', '').replace('mock-token-', '');

    // In production: const { data: user } = await supabase.from('users').select().eq('id', id).single();
    const user = Object.keys(usersMock).map(k => usersMock[k]).find(u => u.id === id);
    if (!user) throw new Error("Invalid authentication");

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
}
