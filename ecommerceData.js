// ecommerceData.js
// Exporting the knowledge base string for import into server.js

export const ECOMMERCE_KNOWLEDGE_BASE = `
Store Name: NovaTrend Fashion & Electronics

1. Shipping & Delivery:
- Free shipping on orders over $50.
- Standard Shipping: 3-5 business days ($4.99 for orders under $50).
- Express Shipping: 1-2 business days ($14.99).
- International Shipping: Available to select countries, takes 7-14 business days.

2. Returns & Refunds:
- 30-day hassle-free return window for unworn clothing with original tags.
- Electronics must be returned in unopened original packaging within 14 days.
- Refunds are processed to the original payment method within 5 business days after inspection.

3. Payment Methods:
- We accept Credit/Debit Cards (Visa, MasterCard, Amex), PayPal, Apple Pay, and Klarna Pay-in-4.

4. Order Tracking & Status:
- Where is my order: track it any time at novatrend.com/track or from "My Account > Orders" using your order number (format NT-123456) and email.
- A tracking link and number are emailed within 24 hours of the order being packed.
- When will my order/package arrive (delivery date): the estimated delivery time is 3-5 business days for Standard, 1-2 business days for Express, and 7-14 business days for International, counted from the day the order ships (orders placed before 2 PM ship the same business day).
- Order status meanings: Processing (payment confirmed, being packed), Shipped (in transit, tracking active), Out for Delivery (arriving today), Delivered.
- Delayed or stuck tracking: allow 48 hours for the carrier to scan; if the order is more than 3 business days past its estimated delivery date, contact support@novatrend.com for a replacement or refund.
- Missing or lost parcel: report within 14 days of the estimated delivery date and we will open a carrier claim.
- Change of address or cancellation is possible only while the order is still in Processing status.

5. Featured Products Catalog:
- Nova Wireless Earbuds Pro: $89.99 (Features: Active Noise Cancellation, 30hr battery, IPX5 water resistance).
- UltraFit Smartwatch: $129.99 (Features: Heart rate monitor, GPS, sleep tracking, 7-day battery life).
- Urban Canvas Backpack: $45.00 (Features: Water-resistant canvas, 15-inch laptop compartment).
- Classic Denim Jacket: $65.00 (100% organic cotton, relaxed fit, available in sizes S-XXL).
`;

/**
 * Splits the knowledge base into numbered sections, one retrievable chunk per
 * topic. Used for retrieval scoring and for citing sources in API responses.
 */
export function parseKnowledgeBase(text = ECOMMERCE_KNOWLEDGE_BASE) {
  const [storeLine] = text.trim().split('\n');
  const storeName = storeLine.replace(/^Store Name:\s*/, '').trim();

  const sections = text
    .split(/\n(?=\d+\.\s)/)
    .slice(1)
    .map((block) => {
      const lines = block.trim().split('\n');
      const heading = lines[0].replace(/^\d+\.\s*/, '').replace(/:$/, '').trim();
      const bullets = lines
        .slice(1)
        .map((line) => line.replace(/^-\s*/, '').trim())
        .filter(Boolean);
      return {
        id: heading.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        category: heading,
        question: heading,
        answer: bullets.join(' '),
        bullets
      };
    });

  // One chunk per bullet: retrieval stays precise on long sections such as the
  // product catalog, where a whole-section vector dilutes each product.
  const chunks = sections.flatMap((section) =>
    section.bullets.map((bullet, i) => ({
      id: `${section.id}-${i + 1}`,
      category: section.category,
      question: section.category,
      answer: bullet
    })));

  return { storeName, sections, chunks };
}
