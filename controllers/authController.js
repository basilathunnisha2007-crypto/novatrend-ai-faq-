// controllers/authController.js

import { LOGIN_ROLES, User } from '../models/User.js';
import { signToken } from '../middleware/auth.js';

/** POST /api/auth/login - { email, password, role? } -> { token, user } */
export async function login(req, res) {
  const { email, password, role } = req.body ?? {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = await User.findOne({ email: String(email).toLowerCase() });
  if (!user || !user.checkPassword(password)) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  // The login page posts the role of the tab the visitor used; reject a
  // mismatch so a customer cannot sign in through the admin form.
  if (role && user.role !== role) {
    return res.status(403).json({ error: `This account is not a ${role} account.` });
  }

  res.json({ token: signToken(user.toPublic()), user: user.toPublic() });
}

/** POST /api/auth/register - self-service customer signup. */
export async function register(req, res) {
  const { name, email, password } = req.body ?? {};

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are required.' });
  }
  if (await User.exists({ email: String(email).toLowerCase() })) {
    return res.status(409).json({ error: 'A user with that email already exists.' });
  }

  const user = await User.create({
    name,
    email,
    role: 'customer',
    passwordHash: User.hashPassword(password)
  });

  res.status(201).json({ token: signToken(user.toPublic()), user: user.toPublic() });
}

/** GET /api/auth/me - the account behind the current token. */
export function me(req, res) {
  res.json({ user: req.user });
}

export const loginRoles = () => LOGIN_ROLES;
