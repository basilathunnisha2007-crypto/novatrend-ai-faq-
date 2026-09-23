// orders.js
// Mock order book plus the intent/ID detection used by the tracking flow.
// Swap lookupOrder() for a real database or carrier API call in production.

import { isStaff } from '../middleware/auth.js';

const ORDERS = [
  {
    orderId: 'NT-123456',
    customerEmail: 'demo@novatrend.com',
    trackingNumber: 'TRK7781204455',
    carrier: 'NovaExpress',
    status: 'Out for Delivery',
    location: 'Local delivery hub, Chennai',
    eta: 'today before 8 PM',
    shipping: 'Express Shipping',
    items: ['Nova Wireless Earbuds Pro'],
    history: [
      'Order placed and payment confirmed',
      'Packed at the Bengaluru warehouse',
      'In transit to Chennai',
      'Out for delivery'
    ]
  },
  {
    orderId: 'NT-987654',
    customerEmail: 'demo@novatrend.com',
    trackingNumber: 'TRK5590033127',
    carrier: 'NovaExpress',
    status: 'Shipped',
    location: 'Sorting facility, Hyderabad',
    eta: 'in 2-3 business days',
    shipping: 'Standard Shipping',
    items: ['UltraFit Smartwatch', 'Urban Canvas Backpack'],
    history: [
      'Order placed and payment confirmed',
      'Packed at the Bengaluru warehouse',
      'Arrived at Hyderabad sorting facility'
    ]
  },
  {
    orderId: 'NT-555001',
    customerEmail: 'priya@example.com',
    trackingNumber: 'TRK1200984322',
    carrier: 'NovaExpress',
    status: 'Processing',
    location: 'Bengaluru warehouse',
    eta: 'ships within 24 hours, then 3-5 business days',
    shipping: 'Standard Shipping',
    items: ['Classic Denim Jacket'],
    history: ['Order placed and payment confirmed']
  },
  {
    orderId: 'NT-777888',
    customerEmail: 'priya@example.com',
    trackingNumber: 'TRK9088771234',
    carrier: 'NovaExpress',
    status: 'Delivered',
    location: 'Handed to the recipient at the delivery address',
    eta: 'delivered on 18 Sep',
    shipping: 'Express Shipping',
    items: ['Nova Wireless Earbuds Pro', 'Classic Denim Jacket'],
    history: [
      'Order placed and payment confirmed',
      'Packed at the Bengaluru warehouse',
      'Out for delivery',
      'Delivered'
    ]
  }
];

/** Orders visible to a user: staff see everything, customers see their own. */
export function listOrders(user) {
  if (isStaff(user)) return ORDERS;
  return ORDERS.filter((order) => order.customerEmail === user?.email);
}

export function sampleOrderIds(user) {
  return listOrders(user).map((order) => order.orderId);
}

const TRACKING_INTENT = /\b(track|tracking|where(?:'s| is)?\s+(?:my|the)\s+(?:order|parcel|package|shipment|delivery)|order\s+status|status\s+of\s+my\s+order|shipment\s+status|delivery\s+status|has\s+my\s+order\s+shipped|when\s+will\s+(?:my|the|it)\b.*\b(arrive|deliver|come)|my\s+order\s+is\s+(?:late|delayed|missing|lost))\b/i;

/** True when the customer is asking about a specific shipment, not a policy. */
export function isTrackingIntent(text) {
  return TRACKING_INTENT.test(text);
}

/** Pulls an order number (NT-123456) or tracking number (TRK...) out of free text. */
export function extractOrderId(text) {
  const order = text.match(/\bNT[-\s]?(\d{6})\b/i);
  if (order) return `NT-${order[1]}`;

  const tracking = text.match(/\bTRK\s?(\d{10})\b/i);
  if (tracking) return `TRK${tracking[1]}`;

  // A bare 6-digit number is treated as an order number, e.g. "123456".
  const bare = text.match(/(?:^|\s)(\d{6})(?:\s|$|[.,!?])/);
  return bare ? `NT-${bare[1]}` : null;
}

/**
 * Looks up an order within what the given user may see: managers and admins
 * reach every order, a customer only their own.
 */
export function lookupOrder(id, user) {
  const key = id.toUpperCase();
  return (
    listOrders(user).find((order) => order.orderId === key || order.trackingNumber === key) ?? null
  );
}

/** Message asking for the identifier needed to look the order up. */
export function askForOrderId(user) {
  const ids = sampleOrderIds(user);
  const hint = isStaff(user)
    ? ` As ${user.role} you can look up any order, for example ${ids.slice(0, 2).join(', ')}.`
    : ids.length
      ? ` Orders on your account: ${ids.join(', ')}.`
      : '';
  return `Happy to check that for you! Could you share your order number (it looks like NT-123456) or the tracking number from your shipping email?${hint}`;
}

/** Tracking needs an identified customer, so public visitors are asked to log in. */
export function askToSignIn() {
  return 'Order tracking needs you to be signed in. Please log in with your NovaTrend account and I can look the order up right away. I can still answer shipping, returns, payment and product questions without a login.';
}

export function formatOrderStatus(order, user) {
  const owner = isStaff(user) ? ` Customer: ${order.customerEmail}.` : '';
  return [
    `Order ${order.orderId} (${order.items.join(', ')}) is currently "${order.status}".${owner}`,
    `Latest location: ${order.location}.`,
    `Estimated delivery: ${order.eta} via ${order.carrier} ${order.shipping}.`,
    `Tracking number: ${order.trackingNumber}.`,
    `Progress: ${order.history.join(' -> ')}.`
  ].join(' ');
}

export function formatOrderNotFound(id) {
  return `I couldn't find any order matching "${id}" on your account. Please double-check the number in your confirmation email (format NT-123456), or email support@novatrend.com and our team will trace it for you.`;
}
