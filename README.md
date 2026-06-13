# Retire Radar

Retire Radar is a retirement countdown and income estimator for everyday workers and FIRE / early-retirement planners.

## Features

- Live countdown to retirement in years, days, hours, and seconds
- Birth-date based retirement date calculation
- Simple first-run inputs with advanced assumptions tucked away
- Projected nest egg estimate
- Annual and monthly retirement income estimate
- Inflation-adjusted spending target
- Shortfall / surplus estimate
- Share-card copy button for viral posting
- Browser-only save by default
- Supabase-ready account and cloud-save flow

## Data storage

The app works immediately with browser storage. To enable accounts and database saving, create a Supabase project and configure `supabase-config.js`.

## Supabase setup

1. Create a Supabase project.
2. Open the SQL editor.
3. Run the SQL in `supabase-schema.sql`.
4. Go to Project Settings -> API.
5. Copy your Project URL and anon / publishable key.
6. Paste them into `supabase-config.js`:

```js
window.RETIRE_RADAR_SUPABASE = {
  url: "https://your-project.supabase.co",
  anonKey: "your-anon-or-publishable-key",
};
```

The database table uses row-level security so signed-in users can only read and write their own retirement plan.

## Run locally

Open `index.html` in a browser.

## Deploy

This repository includes a GitHub Pages workflow. Enable GitHub Pages for GitHub Actions in the repository settings, then pushes to `main` will publish the app.

## Disclaimer

Retire Radar is an educational planning toy, not financial advice. Users should talk with a qualified financial professional before making retirement decisions.
