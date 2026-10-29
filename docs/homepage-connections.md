# Connected homepage

The Next.js homepage preserves the existing CMS hero, category cards, scheduled promotions and published product shelves. Additional editorial sections connect the routine quiz, bundles, gifts, pre-orders, customer gallery and journal. These new discovery sections are currently code-managed, not Homepage Studio blocks.

Shared desktop/mobile navigation uses actual route state. Search and category cards link to `/shop`; customer account and wishlist icons link to the existing explicitly labelled design previews, not staff login. The text-only ANUSMITA wordmark and footer tagline are retained.

`/shop` reads only active products, with a 48-record page size, bounded queries and stable date/id ordering. Category families are applied before pagination. Prices and stock are never generated from sample data. Checkout remains behind the existing launch configuration. Database failures show an unavailable message.

Account, cart, checkout, information and policy preview pages remain previews; linking them does not enable authentication, payment, publishing or email delivery. Database credentials, owner setup and the bedsheet product import are separate unfinished work. No product quantities or payment data were invented in this update.
