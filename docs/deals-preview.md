# Flash Deals reference implementation

`/deals` and `/deals/design-preview` render the supplied desktop/mobile design using native headings, controls, navigation, product cards and a text-only footer. Decorative reference art is clipped from the approved image. Mobile shows the complete eight-item collection rather than concealing half the catalogue to match the abbreviated image.

Filters, search, sorting, accessible native deal dialogs, mobile navigation and device-local saved previews work. The labelled sample countdown starts at 08:24:36 once per browser tab/session, survives refresh in sessionStorage, reaches zero and disables offer actions. It is explicitly a preview countdown, not a merchant offer schedule. Browser storage failure falls back to the current visit. No fictional products enter cart or checkout; enquiries link to the existing assistant. Sample offers are noindex. A real promotion needs published product/SKU data, approved prices and server-enforced start/expiry dates before replacing the preview.

The reference's desktop tote old price contradicts its 15% discount. We use the reference mobile's correct ৳2,000 → ৳1,700. Product images and all prices are samples.
