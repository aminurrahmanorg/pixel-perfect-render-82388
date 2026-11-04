# AI-Powered POS — Feature Upgrade Plan

The document's list is reviewed against what a standard POS needs. Items that are missing from it but standard (marked *added*) are included. The work is built in 5 phases so each one can be tested before the next.

## Phase 1 — Customers, Dues & Repayments
- Customers page: name, phone, email, address, membership tier (Regular / Silver / Gold), points balance, credit limit.
- In POS: search for and select a customer (or add a new one quickly), with "Walk-in" as the default.
- Partial payment: whatever is unpaid becomes a due on that customer.
- Repayment entry: collect a due into a cash, bank or wallet account. It shows in account balances.
- Loyalty points: earn X points per amount spent and redeem them as a discount (rates set in Settings).
- Customer profile: purchase history, current due, repayments and lifetime value.
- "Valued customers" ranking by spend, visits and how recently they bought.

## Phase 2 — Discounts & Item-wise VAT
- Item-wise discount in POS (percent or fixed amount), plus a discount on the whole order.
- Discount rules page: by item, by brand or by category, a minimum/maximum quantity, a date range and an on/off switch. The best matching rule applies automatically in POS.
- Products get a brand, a VAT rate per item and an "includes VAT" or "excludes VAT" setting.
- Tax is calculated line by line. The receipt and invoice show the VAT breakdown.
- Manager PIN to approve a discount above a set limit *(added)*.

## Phase 3 — Inventory & Barcodes
- Stock quantity per product, a low-stock alert level, SKU and barcode.
- Barcode generator (Code128/EAN) and printable label sheets.
- In POS, a scanner or the camera adds an item by its barcode.
- Stock moves automatically on sale, return, purchase and manual adjustment. This history is the stock ledger.
- Product search and filters: category, brand, stock status, price range.
- Stock purchase entry from a supplier, which increases stock and records the cost *(added)*.

## Phase 4 — Returns, Roles & Staff
- Return against an original POS order: pick the lines and quantities. The refund is worked out in proportion to the discount and VAT that were applied, so the totals match.
- Refund to an account or to the customer's due. Stock goes back up.
- Roles: Owner, Manager, Cashier. Profit, cost and reports are visible only to Owner and Manager. Team access in Settings gets a role selector.
- Salesperson tagging on each POS order.
- Commission rules: a percent of sales, or tiered targets (for example 2% up to 50k and 4% above). A monthly commission statement, with payout recorded like salaries.
- Shift open/close with cash count and the difference *(added)*.

## Phase 5 — Dashboard & Reports
- Colorful POS dashboard cards: sales, returns, VAT collected, discounts given, dues outstanding, repayments collected, and profit (authorized users only).
- Reports, all for any date range with print and CSV export:
  - Sales analysis (by item, category, brand, staff, hour)
  - Sales summary
  - Profit & Loss (already exists, extended with returns, VAT and commission)
  - Credit list (customers with dues)
  - Aged receivables (0–30 / 31–60 / 61–90 / 90+ days)
  - Collection statement
  - Stock ledger

## AI Layer (added across the phases, using Lovable AI with no extra key)
- **AI Business Assistant chat**: ask in Bangla or English, for example "how much profit did I make last week?" or "who owes the most?". It answers from the live data.
- **Smart reorder suggestions**: predicts when each product will run out from sales speed, and suggests how much to order.
- **Sales forecast**: the next 7 to 30 days on the dashboard.
- **Daily AI summary**: insights such as "Sales are down 12%; Earbuds are selling fast; 3 customers' dues are older than 60 days".
- **Customer insights**: warns about customers likely to stop buying, and suggests upsell/cross-sell items in POS ("often bought with...").
- **AI discount advisor**: suggests which slow items to discount.
- **Unusual activity alerts**: too many returns or discounts from one cashier, or large voids.
- **AI product entry**: generates a product name, category and description from a photo.

## Technical details
- New tables: customers, customer_payments, loyalty settings on restaurants, discount_rules, brands, stock_movements, suppliers, purchases, returns plus return_items, commission_rules, shifts, and a role column on store_members. Products gain sku, barcode, brand_id, stock_qty, reorder_level, vat_rate, vat_inclusive. Sales gain customer_id, salesperson_id, paid_amount, due_amount, item-level discount and vat columns.
- Every table is scoped by `current_store_owner()` with row-level security and activity-log triggers. A security-definer `has_store_role()` decides which roles can see profit.
- Shared calculation code: line discount → VAT (inclusive or exclusive) → order discount → points. The return proration is in the same code, with unit tests for each rule.
- AI runs in server functions through the Lovable AI Gateway. The chat uses tool-calling over read-only summary queries scoped to the store.
- Barcodes are drawn with the `jsbarcode` package. Camera scanning uses `@zxing/browser`, loaded only in the browser.

## Suggested order
Phase 1 → 2 → 3 → 4 → 5, with the AI features added at the end of each phase. Approving this plan starts Phase 1 together with the AI assistant chat.
