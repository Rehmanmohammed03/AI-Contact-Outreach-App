# Contact Outreach Lab (Frontend Mock)

Frontend-only mock of the outreach workflow (prompt → analysis → contacts → drafts) using plain HTML/CSS/JS with local mock data. No backend or build step required.

## Run (frontend only)
- Fastest: open `index.html` in your browser (double-click or “Open in Browser” from your editor).
- Optional local server (helps with CORS and asset paths):  
  - Python: `python -m http.server 3000` then visit http://localhost:3000/  
  - Node (if installed): `npx serve .`

## Run backend (ChatGPT-powered contacts)
1) Install deps: `npm install`  
2) Create `.env` at repo root (comment required here):  
   ```
   # Put your OpenAI API key here
   OPENAI_API_KEY=sk-...
   # Optional model override
   # OPENAI_MODEL=gpt-4o-mini
   ```  
3) Start server: `npm run dev:server` (listens on http://localhost:4000).  
4) Open the frontend (file or static server). The JS is set to call `http://localhost:4000/api/contacts` by default and falls back to the mock only if you disable `USE_BACKEND` in `src/app.js`.

## What’s Included
- `index.html`: Single-page layout with mode toggle (auto vs stage), prompt form, profile inputs, analysis view, contacts list, and drafts editor.
- `styles.css`: Dark, expressive styling, responsive grid, chips, cards.
- `src/app.js`: State + UI logic, staged/auto flow controls, inline editing, copy-to-clipboard, local profile upload/merge. Backend calls enabled for contact search; toggle `USE_BACKEND` if needed.
- `src/mockApi.js`: Mocked prompt analysis, contact search, and outreach draft generation. Used as fallback.
- `server.js`: Express backend wrapping OpenAI to produce structured contacts. **API key lives in `.env` (see comment above).**

## Customizing / Hooking Up a Backend
- In `src/app.js`, backend is already wired for `searchContacts`; adjust `BACKEND_BASE` if your API runs elsewhere.
- Keep request shapes aligned with the spec to minimize frontend changes. Add additional endpoints (analysis, draft generation) as you wire more backend logic.
