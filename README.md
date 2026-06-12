# Retire Radar

Retire Radar is a lightweight retirement countdown and income estimator. Users enter a few planning details, then get a live countdown plus projected annual and monthly retirement income.

## Features

- Live countdown to retirement in years, days, hours, and seconds
- Projected nest egg estimate
- Annual and monthly retirement income estimate
- Editable assumptions for savings, contributions, growth, withdrawal rate, and fixed income
- Browser-only saved plan using `localStorage`
- Share-card copy button for social sharing

## Data storage

This first version stores user inputs only in the visitor's browser. That keeps sensitive financial details private for the prototype. A production version should add secure user accounts and encrypted database storage, such as Supabase Auth with Postgres row-level security.

## Run locally

Open `index.html` in a browser.

## Deploy

This repository includes a GitHub Pages workflow. Enable GitHub Pages for GitHub Actions in the repository settings, then pushes to `main` will publish the app.
