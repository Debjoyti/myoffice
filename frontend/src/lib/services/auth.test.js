import { loginUser, registerUser, getCurrentUser } from './auth';

describe('Auth Service', () => {
  it('registers a user correctly and can login', () => {
    const regRes = registerUser({ email: "test1@demo.com", password: "password123", name: "Test 1" });
    expect(regRes.access_token).toBeDefined();

    const loginRes = loginUser({ email: "test1@demo.com", password: "password123" });
    expect(loginRes.access_token).toBeDefined();
    // In our mock, different tokens are generated but login succeeds
  });

  it('can fetch current user', () => {
    const regRes = registerUser({ email: "test2@demo.com", password: "password123", name: "Test 2" });
    const user = getCurrentUser(`Bearer ${regRes.access_token}`);
    expect(user.email).toBe("test2@demo.com");
  });
});
