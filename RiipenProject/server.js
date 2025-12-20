import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { OpenAI } from 'openai';

const app = express();
const port = process.env.PORT || 4000;

// Put your API key in a .env file at repo root: OPENAI_API_KEY=sk-...
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(cors());
app.use(express.json());

app.post('/api/contacts', async (req, res) => {
  const { prompt, organizations = [], roles = [], max_contacts = 15, user_profile = {} } = req.body || {};
  if (!prompt) {
    return res.status(400).json({ error: 'prompt is required' });
  }

  const max = Math.min(Math.max(Number(max_contacts) || 10, 5), 30);
  try {
    const system = [
      'You are an expert contact researcher. Given a prompt and optional orgs/roles, return JSON only.',
      'Use up to the requested max_contacts. Include realistic but synthetic data if unsure.',
      'JSON schema: { "contacts": [ { "name": "", "title": "", "organization": "", "country": "", "linkedin_url": "", "email": "", "email_confidence": 0-1, "relevance_score": 0-1, "source": "chatgpt" } ] }'
    ].join(' ');

    const user = {
      prompt,
      organizations,
      roles,
      max_contacts: max,
      user_profile
    };

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0.5,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        {
          role: 'user',
          content: `Return contacts JSON for this: ${JSON.stringify(user)}`
        }
      ]
    });

    const content = completion.choices?.[0]?.message?.content || '{}';
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
      source: c.source || 'chatgpt',
      relevance_score: typeof c.relevance_score === 'number' ? c.relevance_score : 0.7
    }));

    res.json({ contacts: normalized });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch contacts', details: err.message });
  }
});

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});
