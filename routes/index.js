// routes/index.js
// Every REST route of the API, mounted under /api by server.js.

import { Router } from 'express';

import { ROLES } from '../models/User.js';
import { optionalAuth, requireAuth, requireRole } from '../middleware/auth.js';
import { login, me, register } from '../controllers/authController.js';
import {
  createUser,
  deleteUser,
  getUser,
  listUsers,
  updateUser
} from '../controllers/userController.js';
import {
  createFaq,
  deleteFaq,
  getFaq,
  listCategories,
  listFaqs,
  updateFaq
} from '../controllers/faqController.js';
import { chat } from '../controllers/chatController.js';
import { getHistory, removeHistory, removeTurn } from '../controllers/historyController.js';
import { recentConversations, stats } from '../controllers/dashboardController.js';
import { listOrders, lookupOrder } from '../lib/orders.js';
import { activeGenerator } from '../services/gemini.js';

const router = Router();
const staff = requireRole(ROLES.MANAGER, ROLES.ADMIN);
const admin = requireRole(ROLES.ADMIN);

// --- health ---------------------------------------------------------------
router.get('/health', (_req, res) =>
  res.json({ status: 'ok', store: 'NovaTrend Fashion & Electronics', generator: activeGenerator() }));

// --- auth -----------------------------------------------------------------
router.post('/auth/login', login);
router.post('/auth/register', register);
router.get('/auth/me', requireAuth, me);

// --- users (admin) --------------------------------------------------------
router.get('/users', requireAuth, admin, listUsers);
router.post('/users', requireAuth, admin, createUser);
router.get('/users/:id', requireAuth, admin, getUser);
router.put('/users/:id', requireAuth, admin, updateUser);
router.delete('/users/:id', requireAuth, admin, deleteUser);

// --- FAQs: everyone reads, managers and admins write ----------------------
router.get('/faqs', listFaqs);
router.get('/faqs/categories', listCategories);
router.get('/faqs/:id', getFaq);
router.post('/faqs', requireAuth, staff, createFaq);
router.put('/faqs/:id', requireAuth, staff, updateFaq);
router.delete('/faqs/:id', requireAuth, staff, deleteFaq);

// --- chatbot --------------------------------------------------------------
router.post('/chat', optionalAuth, chat);

// --- history --------------------------------------------------------------
router.get('/history', optionalAuth, getHistory);
router.delete('/history', optionalAuth, removeHistory);
router.delete('/history/:id', optionalAuth, removeTurn);

// --- dashboard ------------------------------------------------------------
router.get('/dashboard/stats', optionalAuth, stats);
router.get('/dashboard/recent', requireAuth, staff, recentConversations);

// --- orders (mock order book) --------------------------------------------
router.get('/orders', requireAuth, (req, res) => res.json({ orders: listOrders(req.user) }));
router.get('/orders/:id', requireAuth, (req, res) => {
  const order = lookupOrder(req.params.id, req.user);
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  res.json({ order });
});

export default router;
