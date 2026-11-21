# Project Memory

Last reviewed: 2026-11-22

## Product

- Russian one-page commercial site for a web master working with small businesses.
- Maintain two explicit modes: static preview and full Node.js application. Static hosting cannot run `server.js`, SQLite, uploads, API routes, Socket.IO, or the real admin panel.
- Prefer the current vanilla HTML/CSS/JavaScript frontend and Express backend. Do not introduce a framework without a clear product need.

## Sources Of Truth

- Detailed state, known issues, and release checklists live in `handoff.md`.
- Public contact, offer, and payment configuration lives in `js/main.js`; matching HTML fallbacks must stay in sync.
- The server needs Node.js 24 and an explicitly loaded environment file. `ADMIN_TOKEN` is a secret and must remain server-side.
- The public landing uses a pixel-console visual system with `larper`, `terminal`, and `paper` themes saved under `web-master-theme` in `localStorage`. Its decorative canvas background respects reduced-motion preferences and is not a backend status indicator.
- The Larper theme uses a shared gradient field that moves with scrolling where supported. Section reveals and the field honor reduced motion. The Steam case keeps a stable preview area when switching screens.
- Portfolio links are public external URLs: Steam 2.0 and "СтройДом". Keep them verified when editing the portfolio section.
- The Steam 2.0 case uses desktop and mobile screenshots and opens the brief with Steam 2.0 as the reference and «Сайт под ключ» as the service. Pricing links preselect services, and the brief previews the message before opening a messenger.

## Current Risks

- First screen now says "Сайты и лендинги"; avoid generic value/conversion marketing copy. The reference-style background is a stationary cross grid, with no hero photograph. Keep floating chat controls fixed and the header sticky; desktop/mobile Chromium positioning checks passed.

- The admin room-selection path is broken until `$$` is declared in `js/admin.js`.
- Payment fields remain placeholders in source configuration, but the public layout hides them. Replace and verify them before accepting real payments.
- Fix P0 chat history and admin room-list behaviour before treating the chat as production-ready.
- GitHub Pages is only a static preview, not the backend deployment target.
- Owner authorized committing and publishing the current redesign to `main` on 2026-11-21. This static release uses CSS v16 and JS v18. On GitHub Pages the chat launcher offers Telegram and WhatsApp, and the browser does not post leads to an API.

- Owner authorized committing, pushing to `main`, and publishing the approved animation preview on 2026-11-22. New public `js/portfolio-motion.js` and `css/portfolio-motion.css` provide tile entrance, miniature assembly, card tilt/glare, process line, and Steam desktop/mobile screenshot morphing. No pixel trail or replay controls. Motion is visible on a first visit unless explicitly disabled in `web-master-motion`; reduced motion uses gentle opacity-only entrances. Early `js/startup.js` sets manual scroll restoration: plain URLs and #top start at the hero, explicit section links remain supported. Static release assets: style CSS v17, main JS v19, portfolio motion CSS v1 / JS v2, startup JS v1. Backend behavior remains unchanged.

## Memory Upkeep

Update this file after a durable architecture decision, configuration source change, deployment change, resolved or introduced high-priority risk, or a change to public contacts, pricing, or payments. Keep it brief; move detailed history to `handoff.md`.
