# ANUSMITA photo search — staging release acceptance (2026-11-20)

## Scope and launch hold
PR #232 stays **draft**. Only the isolated `anusmita-store-staging` Worker is targeted. Production Worker, live COD, production Atlas products, inventory, orders and existing R2 media were not modified for this work.

The application uses a **two-stage, zero-paid-inference-API** browser-only customer photo search:
1. Canvas structure/colour matching against a bounded public catalogue.
2. If quick matching is uncertain, show clearly labeled catalogue browsing suggestions without claiming a confirmed SKU. CLIP embeddings (Transformers.js, `Xenova/clip-vit-base-patch32` q8) run **only after customer explicitly selects Deep AI Search**. This prevents an automatic ~89 MB model download for every unfamiliar photo. CLIP model files are fetched from a strict same-origin, read-only, allowlisted static-asset mirror; customer photo bytes are *not* sent to the model source.

A browser image match is a suggestion, not verified SKU identification. A confusing near-tie is rejected, and at most five suggestions can be rendered. The system does not query Google Lens or perform web-wide reverse image search.

## Verified hosted acceptance — q8 model
[Staging workflow run 44778156265](https://github.com/cehfdrmdsakibmollah/Anusmita/actions/runs/44778156265) completed successfully in hosted Chromium:
- Mobile viewport, original real catalogue photo K30: correct K30 product details, 4.7 s.
- Mobile viewport, K30 with **synthetic** background and 8-degree rotation: correct K30, 31.5 s on cold model run.
- Desktop viewport, K30 with same synthetic transformation: correct K30, 30.8 s.
- Different published real catalogue photo K29: correct K29, 4.1 s.
- Unrelated uniform-grey image: no suggested products, 30.8 s.

The q8 CLIP model path transferred approximately **89 MB** per cold-model browser context during the hosted tests. The timing includes navigation, attachment preparation, and matching. JS heap metrics do not represent the entire WebAssembly memory footprint. Mobile viewport emulation is **not** real Android/iOS device performance testing.

The CORS failure from direct model-host fetches was fixed by the same-origin model-asset route. The route strictly restricts file names and upstream repository/revision; it is not a general URL proxy.

## Rejected q4 optimization
[Staging workflow run 44779024118](https://github.com/cehfdrmdsakibmollah/Anusmita/actions/runs/44779024118) used q4 for comparison. It reduced transferred model data on the mobile synthetic case to roughly 64 MB, but **desktop synthetic transformed image matching failed**. As a result, q4 was **reverted to q8** at commit `2b0ada8`. Do not claim q4 acceptance.

## What remains before production
1. Real alternate-angle photo benchmark **not yet available**: collect a representative set of customer-style, licensed/authorized photos covering distinct angles, backgrounds, glare, label occlusion and updated packaging. Synthetic rotation is not a replacement. Record top-1 accuracy, precision/false suggestion rate and uncertain rejection rate per SKU.
2. Mobile device acceptance **not yet completed**: test real Android and iOS devices on mobile-data networks. First-run 89 MB transfer and 31.5 s emulated mobile latency are currently substantial. Improve onboarding/consent for large downloads and test warm cache, cancellation and low-memory behavior before release.
3. Review model distribution rights and hosting/bandwidth quotas. Per-search AI API fees are zero in this architecture, but unlimited/permanent free infrastructure cannot be guaranteed.
4. PR #232 code review, authenticated storefront smoke testing, and explicit release signoff remain required. Keep storefront COD mode gated separately until the existing checkout/stock/order acceptance passes.

## Release decision
**No production promotion yet.** q8 staging matching is functionally verified for the five hosted scenarios above; real multi-angle and physical mobile-device acceptance remain open. Do not merge the draft PR or enable live COD based on photo matching tests.

## Fast-mode UX update (2026-11-21)
- User reported a 90 MB CLIP loading delay and an empty suggestion state. Quick Search now returns without triggering CLIP model download; initial image matching may still require loading public catalogue pictures, so speed depends on cache/network.
- Uncertain textured photos display exploratory catalogue cards, explicitly labelled **not identified from the photo**. Blank/featureless images do not get lookalike suggestions. A separate opt-in deep search is provided with first-use size disclosure; customer photo remains local.
- Hosted benchmark now asserts zero CLIP model requests during Quick Search and intentionally clicks Deep AI Search for transformed/unknown image acceptance.
- This update does not provide unlimited lifetime free web-wide Google Lens image search. It is restricted to ANUSMITA's published catalogue and its browser's available compute, model, network and cache.
- Latest frontend and benchmark changes require a new clean successful CI and hosted browser acceptance before production release. Keep PR draft and COD gate unchanged.
