# AI Contact Outreach App

AI Contact Outreach App is an interactive lab-style application that turns a natural language prompt into organizations, roles, contacts, and personalized outreach drafts.

The project demonstrates an end-to-end outreach workflow using a lightweight frontend and an optional AI-powered backend. It is designed for experimentation, demos, and rapid iteration rather than production deployment.

---

## What This App Does

The app guides a user through the following pipeline:

```

Prompt -> Analysis -> Contacts -> Drafts

````

Users can either run the entire flow automatically or step through each stage and edit results along the way.

---

## Key Features

- Prompt-driven outreach workflow  
- Auto pipeline mode and stage-by-stage mode  
- Editable organizations and roles  
- Contact filtering by seniority and country  
- AI-assisted contact generation using OpenAI (optional backend)  
- Outreach draft generation with tone and channel controls  
- Inline editing and copy-to-clipboard  
- User profile context and local file upload for personalization  
- Frontend works without any build step  

---

## Tech Stack

### Frontend
- Plain HTML, CSS, and JavaScript  
- No frameworks  
- No build tooling  
- Fully client-side  
- Responsive dark UI  

### Backend (Optional)
- Node.js  
- Express  
- OpenAI API  
- CORS enabled  
- JSON-based API  

---

## Project Structure

```text
ai-contact-outreach-app/
├── index.html          # Single-page UI
├── styles.css          # Styling and layout
├── src/
│   ├── app.js          # UI state and workflow logic
│   └── mockApi.js      # Local mock analysis, contacts, and drafts
├── server.js           # Optional Express backend using OpenAI
├── package.json        # Backend dependencies
└── README.md
````

---

## Running the Frontend Only

The frontend works completely on its own using mock data.

### Option 1. Open directly

* Open `index.html` in your browser

### Option 2. Use a local static server (recommended)

**Python**

```bash
python -m http.server 3000
```

**Node**

```bash
npx serve .
```

Then visit:

```text
http://localhost:3000
```

---

## Running the Backend (AI-Powered Contacts)

The backend enhances the contact search using OpenAI.

### 1. Install dependencies

```bash
npm install
```

### 2. Create a `.env` file at the project root

```env
OPENAI_API_KEY=sk-your-key-here
# Optional model override
# OPENAI_MODEL=gpt-4o-mini
```

### 3. Start the server

```bash
npm run dev:server
```

The backend runs at:

```text
http://localhost:4000
```

The frontend is already wired to call the backend for contact search.
You can disable backend usage by toggling the `USE_BACKEND` flag in `src/app.js`.

---

## Backend API

### POST `/api/contacts`

Generates AI-assisted contact suggestions.

**Request**

```json
{
  "prompt": "I want to talk to people working on AI safety policy in Canada",
  "organizations": [],
  "roles": [],
  "max_contacts": 15,
  "user_profile": {
    "name": "Rehman",
    "current_role": "Computer engineering student",
    "goals": "Learn about AI safety policy careers"
  }
}
```

**Response**

```json
{
  "contacts": [
    {
      "id": "ai_contact_1",
      "name": "Alex Chen",
      "title": "Policy Analyst",
      "organization": "Government of Canada",
      "country": "Canada",
      "linkedin_url": "",
      "email": "",
      "email_confidence": 0.6,
      "source": "chatgpt",
      "relevance_score": 0.7
    }
  ]
}
```

---

## Typical Usage Flow

1. Enter a prompt describing who you want to reach
2. Choose tone, channel, and max contacts
3. Add optional profile context or upload a text file
4. Run the flow in auto or stage-by-stage mode
5. Review and edit organizations and roles
6. Search for contacts
7. Generate and edit outreach drafts

All edits happen instantly in the browser.

---

## Limitations

* Contact data may be synthetic when using AI
* No authentication or user accounts
* No persistence or database
* No automated sending of emails or LinkedIn messages
* Intended as a lab and prototype rather than a production app

---

## Future Improvements

* Integrate real contact discovery APIs
* Persist workflows and drafts
* Add email and LinkedIn sending
* Support outreach sequences
* Add contact scoring and deduplication
* Add user authentication and saved projects
* Export drafts to CSV, Markdown, or CRM tools

```
```
