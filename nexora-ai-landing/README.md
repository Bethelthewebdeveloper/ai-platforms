# Nexora AI — Concept Landing Page

This is a **concept prototype** for founding-team discussion. It is not the Nexora AI product.

## What this is
A static landing page that explains the planned platform:

- AI tools for individuals and businesses (primary focus)
- Planned integrations
- Future path toward a broader business platform

Nothing here is a live AI product. Tools, pricing, integrations, and waitlist storage are labeled as planned / coming soon / prototype.

## Stack
- HTML
- Tailwind CSS (CDN)
- Vanilla JavaScript
- `css/custom.css` for brand motion and glass styles

No React, no backend, no database.

## How to preview
Open `index.html` in a browser, or serve the folder:

```bash
cd nexora-ai-landing
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

## Files
- `index.html` — page structure and content
- `css/custom.css` — brand extras
- `js/main.js` — mobile nav, scroll reveal, tool cards, form validation

The early-access form only validates in the browser and shows a thank-you message. It does not save submissions.
