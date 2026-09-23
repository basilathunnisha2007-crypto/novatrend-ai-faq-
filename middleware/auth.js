// middleware/auth.js
// JWT issuing/verification and role-based access control.
// Roles: public (not logged in) < customer < manager < admin.

import jwt from 'jsonwebtoken';
import { ROLES } from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-only-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '8h';

export const PUBLIC_USER = { id: null, name: 'Guest', email: null, role: ROLES.PUBLIC };

export function signToken(user) {
  return jwt.sign({ sub: user.id, name: user.name, email: user.email, role: user.role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
}

function readToken(req) {
  const [scheme, token] = (req.headers.authorization ?? '').split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  const payload = jwt.verify(token, JWT_SECRET);
  return { id: payload.sub, name: payload.name, email: payload.email, role: payload.role };
}

const unauthorized = (res, error) => res.status(401).json({ error });

const tokenError = (error) =>
  error instanceof jwt.TokenExpiredError ? 'Token expired, please log in again.' : 'Invalid token.';

/** Requires a valid `Authorization: Bearer <token>` header. */
export function requireAuth(req, res, next) {
  try {
    const user = readToken(req);
    if (!user) return unauthorized(res, 'Missing bearer token.');
    req.user = user;
    next();
  } catch (error) {
    unauthorized(res, tokenError(error));
  }
}

/** Accepts anonymous traffic: unauthenticated requests become the public role. */
export function optionalAuth(req, res, next) {
  try {
    req.user = readToken(req) ?? PUBLIC_USER;
    next();
  } catch (error) {
    unauthorized(res, tokenError(error));
  }
}

/** Restricts a route to the given roles; use after requireAuth. */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Forbidden: requires role ${roles.join(' or ')}.` });
    }
    next();
  };
}

export const isStaff = (user) => user?.role === ROLES.MANAGER || user?.role === ROLES.ADMIN;
