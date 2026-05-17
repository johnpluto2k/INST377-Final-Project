# Pantry Plate

**Authors:** John Bae &amp; Samvitti Nag
**Course:** INST 377 - Final Project
**Stack:** Node.js / Express (Vercel serverless), Supabase (Postgres), vanilla HTML/CSS/JS frontend
**Live site:** https://inst-354-f-inal.vercel.app/
**Repository:** https://github.com/johnpluto2k/INST354-FInal

---

## Project description

Pantry Plate is a recipe finder that helps households cut down on food waste
by cooking from what they already have. The user types ingredients they own
into a pantry list; the app calls the Spoonacular Food API to return recipes
ranked by how many of those ingredients each recipe uses and how few new
groceries the user would have to buy. Recipes can be opened for full
instructions and dietary tags, and saved to a personal favorites list backed
by a Supabase database.

The project app has five pages (Home, Recipe Detail, Favorites, About, Help),
three authored backend endpoints (one external API proxy, one DB read, one
DB write), and two frontend JS libraries (Swiper for the featured carousel,
Chart.js for the pantry-coverage donut chart on each recipe).

## Target browsers

Tested on the most recent versions of **Chrome**, **Edge**, and **Firefox**
on desktop. Mobile Chrome and Mobile Safari render correctly down to a
375px viewport to fit phone screen size (the nav and recipe grid both collapse responsively).
The app does not require any browser extensions in production - all
external API calls go through our backend, so CORS is handled server-side.

## Developer Manual

The audience for the rest of this document is a future developer who
inherits the codebase. It assumes general knowledge of Node, Express, and
web APIs but no prior exposure to Pantry Plate.

- [Quick start](#quick-start)
- [File structure](#file-structure)
- [Pages](#pages)
- [Backend API](#backend-api)
- [External APIs and JS libraries](#external-apis-and-js-libraries)
- [Styling](#styling)
- [Deployment](#deployment)
- [Known bugs and roadmap](#known-bugs-and-roadmap)

### Quick start

1. Clone the repo and install dependencies.

   ```bash
   git clone https://github.com/johnpluto2k/INST354-FInal.git
   cd INST354-FInal
   npm install
   ```

2. Create a Spoonacular account at https://spoonacular.com/food-api and
   grab a free API key from the dashboard.

3. Create a Supabase project at https://supabase.com, then open
   **SQL Editor** and run the SQL from [`docs/SCHEMA.md`](docs/SCHEMA.md)
   to create the `favorites` table.

4. Copy the example env file and fill in your keys.

   ```bash
   cp .env.example .env
   ```

   Then open `.env` and set:

   ```
   SPOONACULAR_API_KEY=...
   SUPABASE_URL=https://<your-project-ref>.supabase.co
   SUPABASE_ANON_KEY=...
   ```

5. Start the dev server.

   ```bash
   npm start
   ```

   The site is now on http://localhost:3000. Confirm the backend is wired up
   by visiting http://localhost:3000/api/health - it should report
   `spoonacular: true` and `supabase: true`.

### Running tests

No automated test suite is currently included. Manual test plan:

- `GET /api/health` returns `{ ok: true, spoonacular: true, supabase: true }`.
- On the Home page, add `tomato`, `rice`, `cheese`, click **Find Recipes**, and
  confirm the status line reads "Found N recipes."
- Click any recipe card -> the Recipe Detail page loads ingredients,
  instructions, dietary tags, and the Chart.js coverage chart.
- Click **Save to Favorites** -> open the Favorites page in a new tab and
  confirm the recipe is listed. Click **Remove** -> it disappears.
- Refresh each page and confirm there are no console errors.

### File structure

```
INST354-FInal/
├── api/
│   └── index.js          Express app (runs as a Vercel serverless function)
├── public/
│   ├── index.html        Home (pantry input + carousel + grid)
│   ├── recipe.html       Recipe Detail
│   ├── favorites.html    Saved Favorites
│   ├── about.html        About / food-waste problem
│   ├── help.html         Usage guide + FAQ
│   ├── css/
│   │   └── styles.css    Catppuccin Mocha palette, Verdana font, bordered sections
│   └── js/
│       ├── common.js     api.get/post/del wrappers, pantry localStorage helper
│       ├── home.js       Pantry chip UI, recipe search, Swiper carousel + grid
│       ├── recipe.js     Recipe detail render + Chart.js coverage chart + save
│       └── favorites.js  List + remove for saved recipes
├── docs/
│   └── SCHEMA.md         Supabase table SQL + where to paste keys
├── server.js             Local dev entrypoint (Vercel ignores this)
├── vercel.json           Routes /api/* to the serverless function, static otherwise
├── package.json
├── .env.example
└── README.md             You are here
```

### Pages

#### Home (`/` -> `public/index.html`)

- Text input plus **Add** button that pushes ingredient chips into
  `localStorage`. Chips can be removed individually or cleared all at once.
- **Find Recipes** calls `GET /api/recipes?ingredients=...` on our backend,
  which proxies Spoonacular's `findByIngredients` endpoint with
  `ranking=2&ignorePantry=true`.
- Top 5 results render in a **Swiper** carousel; the full result set renders
  as a responsive grid. Each card shows the recipe image, title, "uses N of
  your ingredients," and a green/red **missing** count.

#### Recipe Detail (`/recipe?id=...` -> `public/recipe.html`)

- Reads `?id=` from the URL and calls `GET /api/recipes/:id`, which proxies
  Spoonacular's recipe-information endpoint.
- Renders the hero image, title, ready-in-minutes, servings, and dietary
  tags (vegetarian / vegan / gluten-free / dairy-free / healthy / cheap).
- Lists every ingredient; pantry items the user already owns are colored
  green.
- A **Chart.js** doughnut chart visualizes pantry coverage: "in your pantry"
  vs "need to buy."
- **Save to Favorites** button posts the recipe to `POST /api/favorites`.

#### Saved Favorites (`/favorites` -> `public/favorites.html`)

- Calls `GET /api/favorites`, which reads from the Supabase `favorites`
  table.
- Each saved recipe renders as a card with **Open** (jumps to the detail
  page) and **Remove** (`DELETE /api/favorites/:id`).

#### About (`/about`) and Help (`/help`)

- Fully static. About covers the food-waste problem, how the app works, and
  team roles. Help is a step-by-step usage guide plus an FAQ.

### Backend API

All three required endpoints are authored in `api/index.js`. The frontend
only ever talks to these routes - it never calls Spoonacular or Supabase
directly. CORS, JSON parsing, and error handling are centralized here.

| Method | Route                  | Source            | Description |
| ------ | ---------------------- | ----------------- | ----------- |
| GET    | `/api/health`          | -                 | Sanity check that returns whether each env var is set. |
| GET    | `/api/recipes`         | Spoonacular       | Required `?ingredients=tomato,rice,cheese` plus optional `?number=12`. Proxies `findByIngredients`. **Satisfies "1 must get data from an external provider."** |
| GET    | `/api/recipes/:id`     | Spoonacular       | Proxies `recipes/{id}/information` for the detail page. |
| GET    | `/api/favorites`       | Supabase          | Returns all rows from the `favorites` table, newest first. **Satisfies "1 must retrieve data from your database."** |
| POST   | `/api/favorites`       | Supabase          | Body `{ recipe_id, title, image, missed_count }`. Inserts a row. **Satisfies "1 must write data to your DB."** |
| DELETE | `/api/favorites/:id`   | Supabase          | Removes a saved recipe by row id. |

### External APIs and JS libraries

| Service        | Used for                                                         | Auth          |
| -------------- | ---------------------------------------------------------------- | ------------- |
| Spoonacular    | Recipe search (`findByIngredients`) and details (`information`). | API key (env) |
| Supabase       | `favorites` table reads/writes.                                  | Anon key (env) |

| Library    | Where it's used                                                   |
| ---------- | ----------------------------------------------------------------- |
| Swiper 11  | Featured-recipes carousel on the Home page.                       |
| Chart.js 4 | Pantry-coverage doughnut on the Recipe Detail page.               |

Both libraries are loaded from a CDN (jsDelivr) so there is no build step.

### Styling

The frontend uses the Catppuccin Mocha palette with Verdana as the body
font and simple bordered section boxes. The same look carries across all
five pages.

| Token        | Color     |
| ------------ | --------- |
| Background   | `#1e1e2e` |
| Surface      | `#313244` |
| Surface alt  | `#45475a` |
| Text         | `#cdd6f4` |
| Muted text   | `#a6adc8` |
| Accent       | `#cba6f7` |
| Accent hover | `#a675d6` |
| Good (green) | `#a6e3a1` |
| Bad (red)    | `#f38ba8` |

### Deployment

1. Push to `main` on GitHub.
2. In **Vercel -> Add New -> Project**, import the repo.
3. Framework preset: **Other**. Build command and output directory can stay
   on defaults.
4. Under **Environment Variables**, add:

   - `SPOONACULAR_API_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`

5. Click **Deploy**. Subsequent `git push` calls auto-redeploy.

The `vercel.json` in this repo routes `/api/*` to the Express function at
`api/index.js` and serves everything else from `public/`, including
extensionless URLs like `/about` -> `/public/about.html`.

### Known bugs and roadmap

**Known caveats**

- Spoonacular's free tier is rate-limited to ~150 requests per day across
  the whole project. Hitting the limit returns HTTP 402; the Home page
  surfaces this as an error message.
- The favorites list is shared across all visitors. Two people using the
  deployment will see each other's saves. This is intentional for the demo;
  see roadmap.
- Spoonacular occasionally returns recipes with broken image URLs - the
  card layout tolerates this but the image will be blank.
- Ingredient matching is substring-based on the client (an ingredient is
  marked "in pantry" if the recipe ingredient name contains a pantry word).
  This works well for `cheese` -> `parmesan cheese` but can over-match for
  short words like `oil`.

**Roadmap**

1. Add Supabase Auth so each user has their own favorites list.
2. Move the pantry list off `localStorage` and into a per-user
   `pantry` table so it follows the user across devices.
3. Add a "filter by diet" control on the Home page (vegetarian, vegan,
   gluten-free) passed straight through to Spoonacular's `complexSearch`.
4. Cache Spoonacular responses on the server (in-memory or Supabase) to
   stretch the free-tier rate limit further.
5. Add a Cypress or Playwright test suite covering the three rubric flows
   (find recipes, save favorite, remove favorite).

---

## Rubric coverage at a glance

| Rubric item                                            | Where it lives                                |
| ---------------------------------------------------- | --------------------------------------------- |
| README top half (title, description, browsers, manual) | This file, top section                        |
| Developer Manual (install, run, tests, API, roadmap)   | This file, "Developer Manual" section onward  |
| Front end uses Fetch via the backend (>=3 calls)       | `public/js/common.js` (`api.get`, `api.post`, `api.del`); used by every page |
| Contemporary CSS                                       | `public/css/styles.css` (CSS variables, grid, flex) |
| Cross-browser styling                                  | Tested on Chrome / Edge / Firefox             |
| >=2 JS libraries                                       | Swiper (Home) + Chart.js (Recipe Detail)      |
| >=3 application pages                                  | Home, About, Recipe Detail (plus Favorites and Help) |
| Supabase connection                                    | `api/index.js` `createClient`                 |
| 3 authored endpoints (1 read DB, 1 write DB, 1 external) | `GET /api/favorites`, `POST /api/favorites`, `GET /api/recipes` |
| All 3 endpoints used by the front end                  | Home page (`/api/recipes`), Recipe Detail (`POST /api/favorites`), Favorites (`GET /api/favorites`) |
| Deployed to Vercel                                     | https://inst-354-f-inal.vercel.app/           |
