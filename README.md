# ZeroWaste India

ZeroWaste helps people and community organizations in India share surplus food
with nearby recipients. Donors can publish food listings, and recipients can
find available food on a map and request a pickup.

## Features

- Sign up and sign in as a donor or receiver.
- Publish a food donation with its type, quantity, expiry, pickup window,
  location, and an optional image.
- Browse available donations on an interactive map.
- Request a pickup for an available donation.
- Manage your profile and view your donations.
- Provide administrative pages for authorized admin accounts.

## Technology

- React 18, TypeScript, and Vite
- Tailwind CSS and shadcn/ui components
- Supabase Auth, Postgres, and Storage
- Leaflet and OpenStreetMap for maps
- React Router and TanStack Query

## Requirements

- Node.js 18 or newer
- npm
- A Supabase project for authentication and persistent application data

## Get started

1. Clone the repository and enter the project directory.
2. Install dependencies:

   ```sh
   npm install
   ```

3. Configure Supabase as described in [Supabase setup](#supabase-setup).
4. Start the development server:

   ```sh
   npm run dev
   ```

5. Open the local URL printed by Vite in your browser.

Vite is configured to use port `8080` by default. If that port is already in
use, Vite will report the address it selected.

## Supabase setup

The application uses Supabase for account authentication, profiles, donations,
pickup requests, and image storage. To connect your own Supabase project:

1. Create a project in Supabase.
2. Create a `.env.local` file in the project root.
3. Set the project URL and **publishable/anon key**:

   ```dotenv
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-publishable-key
   ```

   Vite exposes variables prefixed with `VITE_` to browser code. Use only the
   project's publishable (anon) key here; never put a Supabase service-role key
   or other secret in a `VITE_` variable.

4. Apply the SQL migrations in `supabase/migrations/` in timestamp order. You
   can use the Supabase CLI (`supabase link` followed by `supabase db push`) or
   run the migration SQL through the Supabase SQL Editor.
5. Enable the email sign-in method in your Supabase project's authentication
   settings and configure any confirmation/redirect URLs for your environment.

The migrations create the application tables, access policies, and storage
buckets used by the app. Keep Row Level Security enabled and review policies
before changing them. The admin page requires an account with the `admin` role;
grant that role only through a trusted administrative process, never through
user-controlled client input.

## Available commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server. |
| `npm run build` | Build the production app into `dist/`. |
| `npm run build:dev` | Build using Vite's development mode. |
| `npm run preview` | Serve the production build locally for a preview. |
| `npm run lint` | Run ESLint across the project. |

## Application routes

| Path | Page | Access |
| --- | --- | --- |
| `/` | Home | Public |
| `/map` | Browse donations on the map | Public |
| `/about` | About ZeroWaste | Public |
| `/login` | Sign in | Public |
| `/register` | Create an account | Public |
| `/donate` | Create a donation listing | Signed-in users |
| `/donations` | Donation management | Signed-in users |
| `/profile` | Profile and account details | Signed-in users |
| `/admin` | Admin dashboard | Admin accounts |

## Project structure

```text
src/
  components/       Shared UI, authentication, donation, layout, and map components
  data/             Sample application data
  hooks/            Authentication and UI hooks
  integrations/     Supabase client and generated database types
  lib/              Shared utilities
  pages/            Route-level pages
  types/            Application data types
supabase/
  migrations/       Database schema, access policies, and workflow migrations
```

## Maps and image uploads

Map tiles are provided by OpenStreetMap through Leaflet. Follow OpenStreetMap's
attribution requirements and tile usage policy when deploying the application
or serving substantial traffic. Donation images are uploaded to Supabase
Storage; the database migrations configure the buckets and associated access
policies.

## Open to contributions

ZeroWaste India is open to community contributions. Whether you want to fix a
bug, improve the user experience, document setup steps, or propose a new
feature, we welcome thoughtful pull requests and issue reports.

If you are exploring the codebase for the first time, start with a small change,
share your idea in an issue, and help us improve the platform for food recovery
communities across India.

## Contributing

1. Fork the repository and create a branch for your change.
2. Keep your work focused and easy to review.
3. Install dependencies with `npm install`.
4. Run the relevant checks before opening a pull request:

   ```sh
   npm run lint
   npm run build
   ```

5. Open a pull request with a clear summary, the problem it solves, and any
   screenshots or setup notes that help reviewers verify the change.
6. Include reproduction or manual verification steps for behavior changes,
   since there is currently no automated test script defined in
   `package.json`.

Code and documentation contributions are both welcome. For larger ideas,
please open an issue first so the approach can be discussed before significant
work begins.

## Future scope

The current platform provides the foundation for a broader food recovery and
redistribution ecosystem in India. Future enhancements could include:

- Volunteer matching and route optimization for pickups.
- Real-time donation alerts for nearby NGOs, shelters, and community kitchens.
- Multi-language support for local communities and district-level operations.
- Dashboard analytics for impact tracking, food saved, and pickup efficiency.
- Integration with local food safety and compliance workflows.
- Better donor-recipient matching based on geography, inventory type, and
  urgency.
- Community moderation tools and reporting for safer, more trusted exchanges.

These improvements would help turn ZeroWaste into a stronger local resilience
platform for reducing food waste and connecting surplus food with people who
need it.
