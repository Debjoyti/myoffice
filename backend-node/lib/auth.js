import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const SECRET_KEY = process.env.SECRET_KEY || 'your-secret-key-change-in-production';
const ACCESS_TOKEN_EXPIRE = '24h';

export function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(plain, hashed) {
  return bcrypt.compareSync(plain, hashed);
}

export function createToken(userId) {
  return jwt.sign({ sub: userId }, SECRET_KEY, { expiresIn: ACCESS_TOKEN_EXPIRE });
}

export function verifyToken(token) {
  try {
    const payload = jwt.verify(token, SECRET_KEY);
    return payload.sub;
  } catch {
    return null;
  }
}
