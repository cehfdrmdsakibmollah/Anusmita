# Track Order reference UI

`/track-order` and `/track-order/design-preview` recreate the approved reference artwork, desktop horizontal timeline, mobile vertical timeline, order form, details, history and charcoal footer. Text, form and status components are HTML, not a page-sized screenshot. Only the hero artwork is clipped from the approved asset.

The result is explicitly an **example**. It is initially displayed on desktop to match the reference; mobile opens it after using “Try the example order” or submitting the exact published sample ID and phone. Invalid input has field-specific errors. Valid non-demo input explicitly reports that live lookup is not connected, without claiming an order is missing or exposing another customer's order. No network request, storage, analytics or logs receive the entered phone number.

Demo values: `ANU-10248` / `01700000192`. Normalization accepts local, +880, 00880 and Bangla digits. Matching requires both fields. The delivered step remains pending; sample event times and delivery estimates are never represented as live courier updates.

Existing orders support placed/confirmed/packed/shipped/delivered; there is no courier integration for an out-for-delivery event or ETA. Real lookup needs a server-side phone verification/access-control strategy, distributed abuse limits, minimal response fields and actual courier event data before activation. This UI does not change stock, order status, checkout or customer data.
