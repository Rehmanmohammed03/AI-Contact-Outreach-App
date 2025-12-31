# Contact Outreach Lab

**Contact Outreach Lab** is a contact discovery and outreach drafting application that helps users identify relevant professionals for a given domain or goal and generate tailored outreach messages. It supports both an end-to-end automated flow and a stage-by-stage, user-in-the-loop workflow.

The project is intentionally built as a lightweight prototype. The current implementation focuses on frontend UX and a minimal backend, while the technical design outlines a scalable, production-ready architecture.

---

## Goals and Scope

The application enables a user to:

- Enter a free-form prompt describing a domain, industry, or goal  
  Example. *“I want to talk to people working on AI safety policy in Canada.”*

- Receive:
  - A breakdown of relevant domains, organizations, roles, and regions
  - Justification for why those contacts are relevant
  - A list of 10–20 specific contacts with LinkedIn and email when available

- Provide a short profile or upload a profile file

- Generate personalized email or LinkedIn outreach drafts for selected contacts

---

## Supported Modes

### Automated Mode
Prompt → analysis → contacts → drafts with minimal user interaction

### Stage-by-Stage Mode
Users review and adjust results at each step before proceeding

---

## Tech Stack

### Frontend
- Vanilla HTML, CSS, and JavaScript
- Single-page layout with no build step
- Mocked analysis and draft generation for fast iteration

### Backend
- Node.js with Express
- Serves static frontend assets
- Exposes a `/api/contacts` endpoint

### AI Integration
- Google Gemini via `@google/generative-ai`
- Defaults to `gemini-1.5-flash`, configurable via `GEMINI_MODEL`
- Automatic mock fallback when no API key is set

### Tooling
- npm for dependency management
- dotenv for environment configuration

---

## Key Files

- **index.html**  
  Page layout with panels for prompt input, user profile, analysis output, contact list, and outreach drafts

- **styles.css**  
  Dark, expressive styling with responsive grid layouts, cards, and chip-based UI elements

- **app.js**  
  Frontend state and UI logic
  - Central state object for mode, prompt, profile, organizations, roles, contacts, drafts, and selections
  - Automated vs staged workflow handling
  - Calls `/api/contacts`
  - Uses mock APIs for analysis and draft generation
  - `USE_BACKEND` toggle for frontend-only mode
  - `BACKEND_BASE` resolves to same-origin or `http://localhost:4000` when running via `file://`

- **mockApi.js**  
  Mock implementations for prompt analysis, contact search, and outreach draft generation

- **server.js**  
  Express server that:
  - Serves the static frontend
  - Provides the `/api/contacts` endpoint
  - Uses Gemini if `GEMINI_API_KEY` or `GOOGLE_API_KEY` is set
  - Returns mock contacts otherwise
  - Falls back to serving `index.html` for non-API routes

- **package.json**  
  Project scripts and dependencies
  - Scripts include `npm start` and `npm run dev:server`
  - Dependencies include `express`, `cors`, `dotenv`, and `@google/generative-ai`

---

## Architecture Overview

### Application Shape

The application is a single-page, vanilla JavaScript frontend served by a minimal Express backend. There is no build step. Static frontend assets live alongside `server.js` and are served directly by Express.

### Entry Points

- **Frontend**  
  `index.html` loads `styles.css` and `app.js`

- **Backend**  
  `server.js` runs Express, serves static files, and exposes `/api/contacts`

---

### Frontend Data Flow (`app.js`)

- A central state object tracks:
  - Workflow mode (automated or staged)
  - Prompt and user profile
  - Organizations and roles
  - Contacts and selected contacts
  - Outreach drafts
  - Loading and UI state flags

- API routing logic:
  - `USE_BACKEND` toggle controls backend usage
  - `BACKEND_BASE` resolves automatically to same-origin or `http://localhost:4000` when opened via `file://`

- Workflow behavior:
  - Automated mode chains analysis → contact search → draft generation
  - Stage-by-stage mode allows individual steps to be executed independently

- Prompt analysis and outreach drafts are generated locally using mock logic
- Contact search is routed to the backend when enabled

- Rendering functions update the DOM for:
  - Analysis cards
  - Contact lists
  - Draft editors
  - Profile highlights

- Event handlers manage:
  - Adding and removing organizations and roles
  - Contact filters (country, seniority)
  - Profile uploads and merges
  - Contact selection
  - Copy-to-clipboard actions

---

### Mock Logic (`mockApi.js`)

- Provides:
  - `analyzePrompt`
  - `searchContacts`
  - `generateOutreachBatch`

- Returns synthetic data with simulated delays
- Used when the backend is disabled or for non-contact steps such as analysis and draft generation

---

### Backend (`server.js`)

- **Static serving**
  - Serves frontend files from the repository root
  - Falls back to `index.html` for non-API routes

- **API**
  - `POST /api/contacts`
  - Uses Gemini when `GEMINI_API_KEY` or `GOOGLE_API_KEY` is set
  - Normalizes the model’s JSON response
  - Returns mock contacts via a local helper when no API key is present

- **AI Provider**
  - `@google/generative-ai`
  - Model defaults to `gemini-1.5-flash`
  - Override via `GEMINI_MODEL`

---

### Configuration

- Optional `.env` file:
  - `GEMINI_API_KEY` or `GOOGLE_API_KEY`
  - `GEMINI_MODEL`

- npm scripts:
  - `npm start`
  - `npm run dev:server`

---

### Deployment and Runtime

- A single Node.js process serves both frontend and backend
- Runs on `$PORT` with a default of `4000`
- Frontend calls same-origin `/api/contacts` to avoid CORS issues
- Mock fallbacks ensure the UI remains fully functional without API keys

---

## Setup and Run

### Install
```bash
npm install
````

### Environment Variables (Optional)

```env
GEMINI_API_KEY=your_api_key_here
# or
GOOGLE_API_KEY=your_api_key_here

GEMINI_MODEL=gemini-1.5-flash
```

### Run Frontend and Backend

```bash
npm start
```

The application will be available at:

```text
http://localhost:4000
```

---

## Frontend-Only Mode

* Open `index.html` directly in a browser
* Or serve locally:

```bash
python -m http.server 3000
```

Then visit:

```text
http://localhost:3000
```

To force mock data:

```js
USE_BACKEND = false
```

in `app.js`.

---

## Behavior Without an API Key

* Backend automatically returns mock contacts
* Application remains fully functional
* Analysis and outreach drafts are mock-generated on the frontend

---

```
```
