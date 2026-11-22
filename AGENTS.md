# ShopLedger

## Stack
- Node.js application using Express 4 and body-parser for JSON request parsing.
- Browser UI is served from `public/`; application data is stored in `data/db.json`.

## Module map
- `routes/customers.js` — reads customer and settlement lists; records Khata settlements.
- `routes/orders.js` — lists, reads, creates, and cancels orders.
- `routes/products.js` — lists products and active coupons.
- `routes/reports.js` — dashboard, GST reconciliation, pricing preview, and admin export endpoints.
- `lib/coupons.js` — normalizes, validates, calculates, and lists coupons.
- `lib/dates.js` — formats today’s date, normalizes date keys, and determines fiscal year labels.
- `lib/inventory.js` — finds products, checks/reserves/releases stock, and summarizes inventory.
- `lib/invoice.js` — calculates invoice figures and renders printable HTML invoices.
- `lib/ledger.js` — reads customer balances, charges/reverses Khata orders, and records settlements.
- `lib/orders.js` — adds, finds, cancels, and filters orders.
- `lib/pricing.js` — calculates subtotals, discounts, per-line tax, and order totals.
- `lib/reports.js` — builds dashboard summaries and invoice/order GST reconciliation.
- `lib/store.js` — reads and writes `data/db.json` and appends audit entries.
- `lib/tax.js` — resolves GST rates and splits tax into CGST and SGST.

## Commands
- Start the app: `npm start` (runs `node server.js`).
- Run tests with Node’s built-in test runner: `node --test`.

## Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket
Invoice total and GST breakdown do not match what the customer was billed.
Allowed files: `lib/invoice.js` (`lib/tax.js` only if truly needed).
