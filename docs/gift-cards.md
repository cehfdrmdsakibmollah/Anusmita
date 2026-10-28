# Gift card design preview

Routes: `/gift-cards` and `/gift-cards/design-preview` (noindex).

Implements the approved pink/ivory reference with responsive artwork, Classic/Blush/Celebration selection, live BDT values, recipient form, optional message, delivery preference, FAQ, and existing charcoal footer.

All recipient fields remain in component memory. No network request, persistent storage, payment, balance, voucher code or scheduled email is created. Continue to checkout validates the form and opens an explicitly labelled preview summary. Actual checkout requires a separately implemented payment-confirmed issuance and redemption backend and approved terms.

Scheduled dates must be real future dates in Bangladesh time. No expiry/refund promises are invented. Artwork is from the user-approved reference; the currency amount is live text. Mobile stacks the complete form for accessible linear navigation.

Validation: unit tests cover valid details, required fields, supported values, impossible/past dates, Bangladesh date boundaries and message length; production build and TypeScript checks.
