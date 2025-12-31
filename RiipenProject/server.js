import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();
const port = process.env.PORT || 4000;
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const hasApiKey = Boolean(apiKey);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname);

// Put your Gemini API key in a .env file at repo root: GEMINI_API_KEY=...
const genAI = hasApiKey ? new GoogleGenerativeAI(apiKey) : null;

app.use(cors());
app.use(express.json());

app.post('/api/contacts', async (req, res) => {
  const { prompt, organizations = [], roles = [], max_contacts = 15, user_profile = {} } = req.body || {};
  if (!prompt) {
    return res.status(400).json({ error: 'prompt is required' });
  }

  const max = Math.min(Math.max(Number(max_contacts) || 10, 5), 30);

  // If no API key, return mock contacts so the app still works.
  if (!hasApiKey) {
    console.warn('OPENAI_API_KEY missing: returning mock contacts');
    return res.json({ contacts: buildMockContacts({ organizations, roles, max }) });
  }

  try {
    const system = [
      'You are an expert contact researcher. Given a prompt and optional orgs/roles, return JSON only.',
      'Use up to the requested max_contacts. Include realistic but synthetic data if unsure.',
      'JSON schema: { "contacts": [ { "name": "", "title": "", "organization": "", "country": "", "linkedin_url": "", "email": "", "email_confidence": 0-1, "relevance_score": 0-1, "source": "gemini" } ] }'
    ].join(' ');

    const user = {
      prompt,
      organizations,
      roles,
      max_contacts: max,
      user_profile
    };

    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-1.5-flash'
    });

    const completion = await model.generateContent({
      systemInstruction: { text: system },
      generationConfig: { responseMimeType: 'application/json' },
      contents: [
        {
          role: 'user',
          parts: [{ text: `Return contacts JSON for this: ${JSON.stringify(user)}` }]
        }
      ]
    });

    const content = completion.response?.text() || '{}';
    let parsed = {};
    try {
      parsed = JSON.parse(content);
    } catch (err) {
      parsed = { contacts: [] };
    }

    const contacts = Array.isArray(parsed.contacts) ? parsed.contacts : [];
    const normalized = contacts.slice(0, max).map((c, idx) => ({
      id: c.id || `ai_contact_${idx + 1}`,
      name: c.name || 'Unknown',
      title: c.title || 'Contact',
      organization: c.organization || 'Unknown org',
      country: c.country || 'Unknown',
      linkedin_url: c.linkedin_url || '',
      email: c.email || '',
      email_confidence: typeof c.email_confidence === 'number' ? c.email_confidence : 0.6,
      source: c.source || 'gemini',
      relevance_score: typeof c.relevance_score === 'number' ? c.relevance_score : 0.7
    }));

    res.json({ contacts: normalized });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch contacts', details: err.message });
  }
});

// Serve the frontend assets from the same server so one command runs everything.
app.use(express.static(publicDir));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(publicDir, 'index.html'));
});

function buildMockContacts({ organizations = [], roles = [], max = 15 }) {
  const names = [
    'Alex Chen', 'Priya Patel', 'Sofia Garcia', 'Jordan Lee', 'Samir Khan',
    'Noah Martins', 'Yara El-Sayed', 'Clara Rossi', 'Leo Dupont', 'Isabelle Roy'
  ];
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const safeMax = Math.min(Math.max(max, 5), 30);
  const contacts = [];

  const orgs = organizations.length ? organizations : [{ name: 'Example Org', country: 'Canada' }];
  const rs = roles.length ? roles : [{ title: 'Policy Analyst' }];

  for (const org of orgs) {
    for (const role of rs) {
      if (contacts.length >= safeMax) break;
      const name = pick(names);
      contacts.push({
        id: `mock_contact_${contacts.length + 1}`,
        name,
        title: role.title || 'Contact',
        organization: org.name || 'Org',
        country: org.country || 'Canada',
        linkedin_url: `https://www.linkedin.com/in/${name.toLowerCase().replace(/[^a-z]/g, '-')}`,
        email: `${name.toLowerCase().replace(/[^a-z]/g, '.')}@example.org`,
        email_confidence: 0.8,
        source: 'mock',
        relevance_score: 0.8
      });
    }
  }

  return contacts.slice(0, safeMax);
}

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});
