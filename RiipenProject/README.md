# Contact Outreach Lab

Frontend + backend served together via one Node app (prompt -> analysis -> contacts -> drafts).

## Run (frontend + backend together)
1) Install deps: `npm install`
2) (Optional) Create `.env` at repo root if you have a Gemini key:
   ```
   # Put your Google Gemini API key here
   GEMINI_API_KEY=...
   # Optional model override
   # GEMINI_MODEL=gemini-1.5-flash
   ```
3) Start everything: `npm start` (serves frontend + API on http://localhost:4000 or $PORT).
4) Open http://localhost:4000 in your browser. The frontend calls same-origin `/api/contacts`. If no `GEMINI_API_KEY` is present, the API automatically returns mock contacts so the app still works. Disable `USE_BACKEND` in `src/app.js` to force all mocks.

## Frontend-only option
- Fastest: open `index.html` in your browser (double-click or “Open in Browser” from your editor).
- Optional local server (helps with CORS and asset paths):
  - Python: `python -m http.server 3000` then visit http://localhost:3000/
  - Node: `npx serve .`

## What's Included
- `index.html`: Single-page layout with mode toggle (auto vs stage), prompt form, profile inputs, analysis view, contacts list, and drafts editor.
- `styles.css`: Dark, expressive styling, responsive grid, chips, cards.
- `src/app.js`: State + UI logic, staged/auto flow controls, inline editing, copy-to-clipboard, local profile upload/merge. Backend calls enabled for contact search; toggle `USE_BACKEND` if needed.
- `src/mockApi.js`: Mocked prompt analysis, contact search, and outreach draft generation. Used as fallback.
- `server.js`: Express backend wrapping OpenAI to produce structured contacts. **API key lives in `.env`.**

## Customizing / Hooking Up a Backend
- In `src/app.js`, backend is already wired for `searchContacts`; adjust `BACKEND_BASE` if your API runs elsewhere.
- Keep request shapes aligned with the spec to minimize frontend changes. Add additional endpoints (analysis, draft generation) as you wire more backend logic.
