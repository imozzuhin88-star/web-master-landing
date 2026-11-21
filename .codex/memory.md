# Project Memory

Last reviewed: 2026-11-21

## Product

- Russian one-page commercial site for a web master working with small businesses.
- Maintain two explicit modes: static preview and full Node.js application. Static hosting cannot run `server.js`, SQLite, uploads, API routes, Socket.IO, or the real admin panel.
- Prefer the current vanilla HTML/CSS/JavaScript frontend and Express backend. Do not introduce a framework without a clear product need.

## Sources Of Truth

- Detailed state, known issues, and release checklists live in `handoff.md`.
- Public contact, offer, and payment configuration lives in `js/main.js`; matching HTML fallbacks must stay in sync.
- The server needs Node.js 24 and an explicitly loaded environment file. `ADMIN_TOKEN` is a secret and must remain server-side.
- The public landing uses a pixel-console visual system with `larper`, `terminal`, and `paper` themes saved under `web-master-theme` in `localStorage`. Its decorative canvas background respects reduced-motion preferences and is not a backend status indicator.
- Portfolio links are public external URLs: Steam 2.0 and "СтройДом". Keep them verified when editing the portfolio section.

## Current Risks

- First screen now says "Сайты и лендинги"; avoid generic value/conversion marketing copy. The reference-style background is a stationary cross grid, with no hero photograph. Keep floating chat controls fixed and the header sticky; desktop/mobile Chromium positioning checks passed.

- The admin room-selection path is broken until `$$` is declared in `js/admin.js`.
- Payment fields remain placeholders in source configuration, but the public layout hides them. Replace and verify them before accepting real payments.
- Fix P0 chat history and admin room-list behaviour before treating the chat as production-ready.
- GitHub Pages is only a static preview, not the backend deployment target.
- Owner authorized committing and publishing the current redesign to `main` on 2026-11-21. Static asset versions are CSS v9 and JS v11; verify the actual Pages deployment after pushing.

## Memory Upkeep

Update this file after a durable architecture decision, configuration source change, deployment change, resolved or introduced high-priority risk, or a change to public contacts, pricing, or payments. Keep it brief; move detailed history to `handoff.md`.
