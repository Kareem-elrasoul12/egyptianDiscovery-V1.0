# Egyptian Discovery

Next.js App Router website for Egyptian Discovery. Supabase is the live source for catalogue, bookings, accounts, payments, and administration. The local interactive demo is opt-in for development only; production never falls back to sample records.

## Start the site

Install Node.js LTS if Node is not available, then open PowerShell in this folder:

```powershell
npm install
npm run dev
```

Open the URL printed by Next.js, normally `http://localhost:3000`.

## Connect Supabase

1. Create a Supabase project and configure phone OTP authentication with an SMS provider.
2. Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Leave `NEXT_PUBLIC_DEMO_MODE=false`.
3. Apply all SQL files in `supabase/migrations/` in timestamp order.
4. Create a strong secret named `national_id_encryption_key` in Supabase Vault. Keep the secret out of source control and browser code.
5. Set the first trusted administrator role in a private SQL session after the owner account signs in. The migration does not automatically promote a phone number.
6. Configure WhatsApp contact information and actual bank or InstaPay payment instructions in the admin business settings before accepting customers.

Never expose a Supabase secret/service key in `NEXT_PUBLIC_*` variables. Payment proof and identity storage buckets are private.

## Production deployment

- Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in the hosting provider’s project environment for production, preview, and local development as needed. Set `NEXT_PUBLIC_DEMO_MODE=false` in every deployed environment. Production builds disable the demo flag regardless.
- Set `SUPABASE_SECRET_KEY` only as a server-side deployment secret if a trusted server script needs it. Do not add it to client-visible variables or source control.
- Configure phone OTP, private storage buckets, the Vault encryption key, administrator role, business settings, payment instructions, and the scheduled notification secret before launch.
- Publish catalogue rows in Supabase before expecting them on public pages. Anonymous public reads are limited by the database policies to published destinations/products and active trip statuses.
- The public Supabase connection currently returns no published destinations, trips, products, or enabled delivery areas. Confirm the deployment points to the intended project and publish the required records before launch.
- Run `npm run build` after configuring deployment variables. Add the site domain to Supabase Auth’s allowed redirect URLs and configure the production domain in the hosting provider.

The admin dashboard’s map editor and global image override/upload library are browser-local prototypes and are intentionally not shown in the live Supabase admin workspace. Persisted versions and production storage wiring remain to be completed before those controls can be used for operations.

## Use the interactive local demo

The demo is off by default. To opt in for local UX review only, set `NEXT_PUBLIC_DEMO_MODE=true` in `.env.local` and restart Next.js. The flag is ignored in production.

- Open `/` for the redesigned storefront.
- Open `/trips` and place a sample 12-hour seat hold. The hold appears in `/account`.
- Submit a sample InstaPay or bank transfer proof from the account page.
- Open `/admin` → **Bookings & payments** and approve or reject the proof. Approved payments update paid seats and issue a sample receipt.
- Confirm a trip manually once its paid minimum is reached. The customer account then exposes the traveler-details step and remaining-balance flow.
- Add shop items, place a sample order, submit a sample transfer, and move fulfillment through the admin workspace.
- Use **Advance demo clock 13 hours** to expire unpaid holds. Use **Reset demo** to restore the original sample workspace.

Demo records persist in this browser's local storage only. Proof filenames, identity fields, receipts, orders, and admin decisions are simulated; no payment or identity files are uploaded and no data is shared between browsers. Do not treat sample prices, dates, availability, testimonials, or account activity as real business data.

## What is implemented

- Responsive public pages, destination and trip browsing, Arabic/English copy, RTL direction, and light/dark themes.
- Brand redesign based on the supplied logo, with a responsive field atlas, interactive map links, animation, warm ivory/orange/gold/charcoal colors, and reduced-motion support.
- Interactive local demo catalogue, cart, checkout, reservations, payment review, sample receipts, admin workspace, customer dashboard, and order fulfillment.
- Live architecture includes phone OTP sign-in, customer account and history views, database-backed reservation holds, deposit and balance payment submission, private receipt and proof storage, and protected traveler records.
- Live architecture includes manual payment review, trip confirmation, printable receipts, catalog and checkout operations, loyalty and referral workflows, review and gallery moderation, admin controls, configurable settings, and Excel export.

The local demo is a UX and workflow simulation; it is not a production backend and does not persist outside this browser. Live business flows require the migration, Supabase credentials, SMS configuration, Vault secret, catalogue data, and payment instructions. Hosting and production launch are intentionally not selected; complete security review, workflow testing, backups, monitoring, and domain setup first.

## Development status by PRD phase

- Phase 1: public pages and brand system — built; local preview is interactive, but content remains sample data until configured.
- Phase 2: customer account — local demo profile and workflow views are interactive; live phone OTP requires an SMS provider and Supabase.
- Phase 3: booking — local holds, sample payment review, paid-seat tracking, manual confirmation, waitlist, and simulated hold expiry; live concurrency and date-decision workflows require database verification.
- Phase 4: payments — local transfer review and sample receipts; real upload, refund execution, provider setup, and audit verification require Supabase.
- Phase 5: shop — local cart, checkout, stock changes, sample transfer review, and fulfillment; real payment-proof uploads and shipping integrations are pending.
- Phase 6: rewards and community — sample loyalty and moderation interactions; full referral eligibility, activity deduplication, and monthly automation need completion.
- Phase 7: admin — local sample management, settings, customer lookup, and Excel export; full live analytics, audit coverage, and all production management rules need completion.
- Phase 8: build succeeds; complete end-to-end acceptance, security, accessibility, mobile, RTL, database, and workflow checks before launch.
- Phase 9: hosting and launch — pending final testing and the owner’s domain/provider choices.

## Useful commands

```powershell
npm run dev
npm run build
npm start
```
