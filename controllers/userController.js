// controllers/userController.js
// Admin-only user administration.

import { LOGIN_ROLES, User } from '../models/User.js';

/** GET /api/users */
export async function listUsers(_req, res) {
  const users = await User.find().sort({ createdAt: 1 });
  res.json({ users: users.map((user) => user.toPublic()) });
}

/** GET /api/users/:id */
export async function getUser(req, res) {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  res.json({ user: user.toPublic() });
}

/** POST /api/users - { name, email, password, role } */
export async function createUser(req, res) {
  const { name, email, password, role } = req.body ?? {};

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are required.' });
  }
  if (!LOGIN_ROLES.includes(role)) {
    return res.status(400).json({ error: `Role must be one of ${LOGIN_ROLES.join(', ')}.` });
  }
  if (await User.exists({ email: String(email).toLowerCase() })) {
    return res.status(409).json({ error: 'A user with that email already exists.' });
  }

  const user = await User.create({ name, email, role, passwordHash: User.hashPassword(password) });
  res.status(201).json({ user: user.toPublic() });
}

/** PUT /api/users/:id - { name?, email?, role?, password? } */
export async function updateUser(req, res) {
  const { name, email, role, password } = req.body ?? {};
  if (role && !LOGIN_ROLES.includes(role)) {
    return res.status(400).json({ error: `Role must be one of ${LOGIN_ROLES.join(', ')}.` });
  }

  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  if (name) user.name = name;
  if (email) user.email = email;
  if (role) user.role = role;
  if (password) user.passwordHash = User.hashPassword(password);
  await user.save();

  res.json({ user: user.toPublic() });
}

/** DELETE /api/users/:id */
export async function deleteUser(req, res) {
  if (req.params.id === req.user.id) {
    return res.status(400).json({ error: 'You cannot delete your own account.' });
  }
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  res.json({ deleted: user.toPublic() });
}
