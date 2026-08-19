# MediFind

A first working prototype for a medicine finder/reservation app.

## Run
1. Install Node.js (already installed if you followed the setup).
2. Open this folder in VS Code.
3. In the terminal run:
   npm install
   npm run dev
4. Open the local URL shown by Vite.

This prototype uses sample medicine/pharmacy data and localStorage for reservations.
Do not use it for real medicine sales until prescription, pharmacy verification,
payments, privacy/security, and applicable Indian regulatory requirements are implemented.


## V4: Supabase database
1. Create a Supabase project.
2. In Supabase SQL Editor, paste and run `supabase/schema.sql`.
3. Copy `.env.example` to `.env`.
4. Fill in `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, and keep the demo pharmacy ID.
5. Run `npm install` then `npm run dev`.

Supabase's browser client uses the project URL and publishable key. Never put a
service-role key in this Vite app. The included SQL policies are intentionally
open only for local/demo testing and must be replaced with proper authenticated
RLS policies before production.
