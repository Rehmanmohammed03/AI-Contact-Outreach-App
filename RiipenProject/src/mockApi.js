const sampleOrganizations = [
  {
    name: 'Innovation, Science and Economic Development Canada',
    type: 'Government agency',
    country: 'Canada',
    justification: 'Canadian ministry that drives innovation and technology policy with AI oversight.'
  },
  {
    name: 'Vector Institute',
    type: 'Research institute',
    country: 'Canada',
    justification: 'Flagship AI research institute with a focus on responsible AI.'
  },
  {
    name: 'CIFAR',
    type: 'Non-profit',
    country: 'Canada',
    justification: 'Supports global AI research and policy collaboration.'
  },
  {
    name: 'National Research Council Canada',
    type: 'Government lab',
    country: 'Canada',
    justification: 'Runs applied research programs across AI safety and standards.'
  }
];

const sampleRoles = [
  {
    title: 'Policy Analyst, AI',
    org_types: ['Government agency'],
    justification: 'Shapes AI-related regulation and recommendations.'
  },
  {
    title: 'Research Scientist, Responsible AI',
    org_types: ['Research institute', 'University'],
    justification: 'Builds frameworks and experiments around AI safety.'
  },
  {
    title: 'Program Manager, AI Policy',
    org_types: ['Non-profit', 'Government agency'],
    justification: 'Coordinates programs that connect researchers and policymakers.'
  },
  {
    title: 'Ethics Advisor, AI',
    org_types: ['Government lab', 'Research institute'],
    justification: 'Advises on ethics and compliance for AI initiatives.'
  }
];

const namePool = [
  'Alex Chen', 'Priya Patel', 'Sofia Garcia', 'Jordan Lee', 'Samir Khan',
  'Noah Martins', 'Yara El-Sayed', 'Clara Rossi', 'Leo Dupont', 'Isabelle Roy',
  'Avery Morgan', 'Ethan Wong', 'Layla Rahman', 'Mateo Silva', 'Talia Cohen'
];

const domains = ['ised-isde.gc.ca', 'vectorinstitute.ai', 'cifar.ca', 'nrc-cnrc.gc.ca'];

const mockDelay = (ms = 420) => new Promise(resolve => setTimeout(resolve, ms));

const pick = arr => arr[Math.floor(Math.random() * arr.length)];

const buildEmail = (name, domain) =>
  name.toLowerCase().replace(/[^a-z]/g, '.') + '@' + domain;

export const mockApi = {
  async analyzePrompt(input) {
    await mockDelay();
    const prompt = input?.prompt || '';
    const countries = prompt.toLowerCase().includes('canada') ? ['Canada'] : ['United States', 'Canada'];
    const domain = prompt.match(/ai|policy/i) ? 'AI safety policy' : 'Outreach';

    return {
      domain,
      countries,
      org_types: ['Government agency', 'Research institute', 'Non-profit'],
      organizations: sampleOrganizations,
      roles: sampleRoles,
      justification: `Based on the prompt "${prompt.slice(0, 120)}", these organizations and roles are closest to the requested domain.`
    };
  },

  async searchContacts({ organizations = [], roles = [], max_contacts = 15, filters = {} }) {
    await mockDelay(500);
    const contacts = [];
    const seniorityFilter = filters.seniority?.length ? filters.seniority : ['mid', 'senior', 'junior'];
    const countries = filters.country?.length
      ? filters.country.map(c => c.trim()).filter(Boolean)
      : organizations.map(o => o.country).filter(Boolean);

    for (const org of organizations) {
      for (const role of roles) {
        if (contacts.length >= max_contacts) break;
        const name = pick(namePool);
        const seniority = pick(seniorityFilter);
        const country = countries.length ? pick(countries) : org.country || 'Canada';
        const score = (Math.random() * 0.2) + 0.75;
        contacts.push({
          id: `contact_${contacts.length + 1}`,
          name,
          title: `${seniority === 'senior' ? 'Senior ' : ''}${role.title}`,
          organization: org.name,
          country,
          linkedin_url: `https://www.linkedin.com/in/${name.toLowerCase().replace(/[^a-z]/g, '-')}`,
          email: buildEmail(name, pick(domains)),
          email_confidence: Math.random() * 0.2 + 0.75,
          source: 'mock search',
          relevance_score: score
        });
      }
    }

    return { contacts: contacts.slice(0, max_contacts) };
  },

  async generateOutreachBatch({ contacts = [], userProfile = {}, tone = 'semi_formal', channel = 'linkedin' }) {
    await mockDelay(500);
    const toneLabel = tone.replace('_', ' ');
    const drafts = contacts.map((contact, idx) => {
      const intro = userProfile.summary
        ? `I'm ${userProfile.name || 'someone'} ${userProfile.summary}. `
        : `I'm ${userProfile.name || 'a professional'} exploring opportunities. `;
      const subject = `Quick question about ${contact.organization}`;
      const body = [
        `Hi ${contact.name.split(' ')[0]},`,
        '',
        `${intro}I'm reaching out because your ${contact.title} role at ${contact.organization} intersects with my focus on ${userProfile.goals || 'AI policy pathways'}.`,
        'Would you be open to a 15 minute chat about how your team approaches AI safety and where newcomers can contribute?',
        '',
        'Thanks!',
        userProfile.name || 'Your name'
      ].join('\n');

      return {
        id: `draft_${idx + 1}`,
        contact_id: contact.id,
        subject: channel === 'email' ? subject : undefined,
        body,
        style_metadata: { tone: toneLabel, length: 'short', channel }
      };
    });

    return { drafts };
  }
};
