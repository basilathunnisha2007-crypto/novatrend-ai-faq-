// controllers/dashboardController.js
// Each role sees only the numbers it is allowed to see.

import { History } from '../models/History.js';
import { Faq } from '../models/Faq.js';
import { ROLES, User } from '../models/User.js';
import { listOrders } from '../lib/orders.js';
import { activeGenerator } from '../services/gemini.js';
import { countHistory, historyScope, listHistory } from '../services/historyService.js';

/** GET /api/dashboard/stats */
export async function stats(req, res) {
  const user = req.user;
  const scope = historyScope(user, req.get('x-guest-id'));
  const [conversations, recent, faqs] = await Promise.all([
    countHistory(scope),
    listHistory(scope, 1),
    Faq.countDocuments()
  ]);

  const dashboard = {
    role: user.role,
    name: user.name,
    generator: activeGenerator(),
    conversations,
    lastAsked: recent[0]?.createdAt ?? null,
    faqs
  };

  if (user.role !== ROLES.PUBLIC) {
    const orders = listOrders(user);
    dashboard.orders = orders.length;
    dashboard.ordersByStatus = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] ?? 0) + 1;
      return acc;
    }, {});
    dashboard.inTransit = orders.filter((order) => order.status !== 'Delivered').length;
  }

  if (user.role === ROLES.MANAGER || user.role === ROLES.ADMIN) {
    const [totalChats, faqsByCategory] = await Promise.all([
      History.countDocuments(),
      Faq.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { _id: 1 } }])
    ]);
    dashboard.totalConversations = totalChats;
    dashboard.faqsByCategory = faqsByCategory.reduce((acc, row) => {
      acc[row._id] = row.count;
      return acc;
    }, {});
  }

  if (user.role === ROLES.ADMIN) {
    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    dashboard.users = usersByRole.reduce((total, row) => total + row.count, 0);
    dashboard.usersByRole = usersByRole.reduce((acc, row) => {
      acc[row._id] = row.count;
      return acc;
    }, {});
  }

  res.json({ dashboard });
}

/** GET /api/dashboard/recent - latest chats across the store (staff only). */
export async function recentConversations(_req, res) {
  const turns = await History.find().sort({ createdAt: -1 }).limit(20).populate('userId', 'name email role');
  res.json({
    turns: turns.map((turn) => ({
      ...turn.toPublic(),
      user: turn.userId ? { name: turn.userId.name, email: turn.userId.email } : { name: 'Guest' }
    }))
  });
}
