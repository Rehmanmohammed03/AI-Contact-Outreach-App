import { mockApi } from './mockApi.js';

// Toggle to use backend. Backend base defaults to http://localhost:4000.
const USE_BACKEND = true;
const BACKEND_BASE = window.BACKEND_BASE || 'http://localhost:4000';

const backendApi = {
  async searchContacts(payload) {
    const body = {
      prompt: state.prompt,
      organizations: payload.organizations,
      roles: payload.roles,
      max_contacts: payload.max_contacts,
      user_profile: state.profile
    };

    const res = await fetch(`${BACKEND_BASE}/api/contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error('Backend search failed');
    return res.json();
  }
};

const state = {
  mode: 'auto',
  prompt: '',
  tone: 'semi_formal',
  channel: 'email',
  maxContacts: 15,
  analysis: null,
  organizations: [],
  roles: [],
  contacts: [],
  drafts: [],
  selectedContacts: new Set(),
  loading: { analysis: false, contacts: false, drafts: false },
  profile: {
    name: '',
    current_role: '',
    summary: '',
    goals: '',
    highlights: []
  }
};

const ui = {
  modeRadios: document.querySelectorAll('input[name="mode"]'),
  modeHint: document.getElementById('mode-hint'),
  promptInput: document.getElementById('prompt-input'),
  promptForm: document.getElementById('prompt-form'),
  runBtn: document.getElementById('run-btn'),
  resetBtn: document.getElementById('reset-btn'),
  prefillBtn: document.getElementById('prefill-btn'),
  toneSelect: document.getElementById('tone-select'),
  channelSelect: document.getElementById('channel-select'),
  maxContactsInput: document.getElementById('max-contacts'),
  analysisStatus: document.getElementById('analysis-status'),
  orgInput: document.getElementById('org-input'),
  roleInput: document.getElementById('role-input'),
  orgList: document.getElementById('org-list'),
  roleList: document.getElementById('role-list'),
  analysisSummary: document.getElementById('analysis-summary'),
  searchContactsBtn: document.getElementById('search-contacts-btn'),
  contactsList: document.getElementById('contacts-list'),
  generateDraftsBtn: document.getElementById('generate-drafts-btn'),
  draftsList: document.getElementById('drafts-list'),
  seniorityFilter: document.getElementById('seniority-filter'),
  countryFilter: document.getElementById('country-filter'),
  profileForm: document.getElementById('profile-form'),
  highlightInput: document.getElementById('highlight-input'),
  highlightChips: document.getElementById('highlight-chips'),
  profileUpload: document.getElementById('profile-upload'),
  profileSummary: document.getElementById('profile-summary'),
  toast: document.getElementById('toast'),
  profileName: document.getElementById('profile-name'),
  profileRole: document.getElementById('profile-role'),
  profileGoals: document.getElementById('profile-goals')
};

const SAMPLE_PROMPT = 'I want to talk to people working on AI safety policy in Canada about internships.';
const api = USE_BACKEND ? { ...mockApi, searchContacts: backendApi.searchContacts } : mockApi;

const setLoading = (key, value) => {
  state.loading[key] = value;
  renderStatus();
};

const showToast = message => {
  ui.toast.textContent = message;
  ui.toast.classList.remove('hidden');
  setTimeout(() => ui.toast.classList.add('hidden'), 2800);
};

const getMultiSelectValues = select =>
  Array.from(select.selectedOptions || []).map(o => o.value);

const resetSelections = () => {
  state.contacts = [];
  state.drafts = [];
  state.selectedContacts = new Set();
  renderContacts();
  renderDrafts();
};

const handleModeChange = event => {
  state.mode = event.target.value;
  ui.modeHint.textContent =
    state.mode === 'auto'
      ? 'Auto mode runs analysis → contacts → drafts in one go.'
      : 'Stage mode runs analysis first, then contact search, then drafts.';
};

const handleProfileInput = event => {
  const { name, value } = event.target;
  if (!name) return;
  state.profile[name] = value;
};

const handleHighlightKey = event => {
  if (event.key !== 'Enter') return;
  event.preventDefault();
  const text = event.target.value.trim();
  if (!text) return;
  state.profile.highlights.push(text);
  event.target.value = '';
  renderHighlights();
};

const removeHighlight = idx => {
  state.profile.highlights.splice(idx, 1);
  renderHighlights();
};

const handleFileUpload = event => {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const content = e.target.result;
    const prefix = state.profile.summary ? state.profile.summary + '\n' : '';
    state.profile.summary = prefix + content;
    ui.profileSummary.value = state.profile.summary;
    showToast('Profile text merged into summary');
  };
  reader.readAsText(file);
};

const addOrganization = name => {
  const trimmed = name.trim();
  if (!trimmed) return;
  state.organizations.push({ name: trimmed, type: 'Custom', country: '', justification: 'Added manually.' });
  renderAnalysis();
};

const addRole = title => {
  const trimmed = title.trim();
  if (!trimmed) return;
  state.roles.push({ title: trimmed, org_types: [], justification: 'Added manually.' });
  renderAnalysis();
};

const removeOrganization = name => {
  state.organizations = state.organizations.filter(o => o.name !== name);
  renderAnalysis();
};

const removeRole = title => {
  state.roles = state.roles.filter(r => r.title !== title);
  renderAnalysis();
};

const handlePromptSubmit = async event => {
  event.preventDefault();
  const prompt = ui.promptInput.value.trim();
  if (!prompt) {
    showToast('Please enter a prompt.');
    return;
  }
  state.prompt = prompt;
  state.tone = ui.toneSelect.value;
  state.channel = ui.channelSelect.value;
  state.maxContacts = Number(ui.maxContactsInput.value) || 15;
  resetSelections();

  if (state.mode === 'auto') {
    await runAutoFlow();
  } else {
    await runPromptAnalysis();
  }
};

const runAutoFlow = async () => {
  await runPromptAnalysis();
  if (!state.analysis) return;
  await runContactSearch();
  if (!state.contacts.length) return;
  await runDraftGeneration();
};

const runPromptAnalysis = async () => {
  setLoading('analysis', true);
  try {
    const result = await api.analyzePrompt({
      prompt: state.prompt,
      user_profile_summary: state.profile.summary
    });
    state.analysis = result;
    state.organizations = [...result.organizations];
    state.roles = [...result.roles];
    renderAnalysis();
    showToast('Analysis ready');
  } catch (err) {
    console.error(err);
    showToast('Analysis failed (mock).');
  } finally {
    setLoading('analysis', false);
  }
};

const runContactSearch = async () => {
  if (!state.analysis || !state.organizations.length || !state.roles.length) {
    showToast('Run analysis and keep at least one org and role.');
    return;
  }
  setLoading('contacts', true);
  try {
    const filters = {
      seniority: getMultiSelectValues(ui.seniorityFilter),
      country: ui.countryFilter.value
        .split(',')
        .map(c => c.trim())
        .filter(Boolean)
    };
    const res = await api.searchContacts({
      organizations: state.organizations,
      roles: state.roles,
      max_contacts: state.maxContacts,
      filters
    });
    state.contacts = res.contacts;
    state.selectedContacts = new Set(res.contacts.slice(0, 5).map(c => c.id));
    renderContacts();
    showToast(`Found ${res.contacts.length} contacts.`);
  } catch (err) {
    console.error(err);
    showToast('Contact search failed (mock).');
  } finally {
    setLoading('contacts', false);
  }
};

const runDraftGeneration = async () => {
  const selected = state.contacts.filter(c => state.selectedContacts.has(c.id));
  if (!selected.length) {
    showToast('Select at least one contact.');
    return;
  }
  setLoading('drafts', true);
  try {
    const res = await api.generateOutreachBatch({
      contacts: selected,
      userProfile: state.profile,
      tone: state.tone,
      channel: state.channel
    });
    state.drafts = res.drafts;
    renderDrafts();
    showToast('Drafts generated.');
  } catch (err) {
    console.error(err);
    showToast('Draft generation failed (mock).');
  } finally {
    setLoading('drafts', false);
  }
};

const renderStatus = () => {
  const statuses = [];
  if (state.loading.analysis) statuses.push('Analyzing prompt…');
  if (state.loading.contacts) statuses.push('Searching contacts…');
  if (state.loading.drafts) statuses.push('Writing drafts…');
  ui.analysisStatus.textContent = statuses.join(' • ') || 'Idle';
};

const renderAnalysis = () => {
  ui.analysisSummary.textContent = state.analysis
    ? state.analysis.justification
    : 'Run analysis to see domain breakdown and rationale.';

  ui.orgList.innerHTML = '';
  state.organizations.forEach(org => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:8px;align-items:center;">
        <div>
          <strong>${org.name}</strong><br>
          <small>${org.type || 'Org'} • ${org.country || 'Any'}</small>
          <div class="hint">${org.justification || ''}</div>
        </div>
        <button class="ghost" data-remove-org="${org.name}">✕</button>
      </div>
    `;
    ui.orgList.appendChild(card);
  });

  ui.roleList.innerHTML = '';
  state.roles.forEach(role => {
    const card = document.createElement('div');
    card.className = 'card';
    const types = role.org_types?.join(', ') || 'Any org';
    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:8px;align-items:center;">
        <div>
          <strong>${role.title}</strong><br>
          <small>${types}</small>
          <div class="hint">${role.justification || ''}</div>
        </div>
        <button class="ghost" data-remove-role="${role.title}">✕</button>
      </div>
    `;
    ui.roleList.appendChild(card);
  });

  attachAnalysisRemovalHandlers();
};

const attachAnalysisRemovalHandlers = () => {
  ui.orgList.querySelectorAll('button[data-remove-org]').forEach(btn => {
    btn.addEventListener('click', () => removeOrganization(btn.dataset.removeOrg));
  });
  ui.roleList.querySelectorAll('button[data-remove-role]').forEach(btn => {
    btn.addEventListener('click', () => removeRole(btn.dataset.removeRole));
  });
};

const renderContacts = () => {
  ui.contactsList.innerHTML = '';
  state.contacts.forEach(contact => {
    const card = document.createElement('div');
    card.className = 'contact-card';
    card.innerHTML = `
      <label style="display:flex;gap:10px;align-items:flex-start;">
        <input type="checkbox" data-contact-id="${contact.id}" ${state.selectedContacts.has(contact.id) ? 'checked' : ''}>
        <div>
          <div style="display:flex;justify-content:space-between;gap:8px;">
            <div>
              <strong>${contact.name}</strong>
              <div class="contact-meta">${contact.title} • ${contact.organization}</div>
            </div>
            <span class="score">${contact.relevance_score.toFixed(2)}</span>
          </div>
          <div class="contact-meta">
            <span>${contact.country}</span>
            <span>${contact.email} (${Math.round(contact.email_confidence * 100)}%)</span>
            <span><a href="${contact.linkedin_url}" target="_blank" rel="noreferrer">LinkedIn</a></span>
          </div>
        </div>
      </label>
    `;
    ui.contactsList.appendChild(card);
  });

  ui.contactsList.querySelectorAll('input[type="checkbox"]').forEach(input => {
    input.addEventListener('change', e => {
      const id = e.target.dataset.contactId;
      if (e.target.checked) state.selectedContacts.add(id);
      else state.selectedContacts.delete(id);
    });
  });
};

const renderDrafts = () => {
  ui.draftsList.innerHTML = '';
  state.drafts.forEach(draft => {
    const card = document.createElement('div');
    card.className = 'card draft-card';
    const contact = state.contacts.find(c => c.id === draft.contact_id);
    const name = contact ? contact.name : 'Contact';
    card.innerHTML = `
      <header>
        <div>
          <strong>${name}</strong>
          <div class="hint">${draft.style_metadata.channel || 'email'} • ${draft.style_metadata.tone}</div>
        </div>
        <button class="ghost" data-copy="${draft.id}">Copy</button>
      </header>
      ${draft.subject ? `<input value="${draft.subject}" data-draft-subject="${draft.id}">` : ''}
      <textarea data-draft-body="${draft.id}">${draft.body}</textarea>
    `;
    ui.draftsList.appendChild(card);
  });

  ui.draftsList.querySelectorAll('button[data-copy]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.copy;
      const textarea = ui.draftsList.querySelector(`textarea[data-draft-body="${id}"]`);
      if (textarea) {
        textarea.select();
        document.execCommand('copy');
        showToast('Draft copied to clipboard.');
      }
    });
  });

  ui.draftsList.querySelectorAll('textarea[data-draft-body]').forEach(area => {
    area.addEventListener('input', e => {
      const id = e.target.dataset.draftBody;
      const draft = state.drafts.find(d => d.id === id);
      if (draft) draft.body = e.target.value;
    });
  });

  ui.draftsList.querySelectorAll('input[data-draft-subject]').forEach(input => {
    input.addEventListener('input', e => {
      const id = e.target.dataset.draftSubject;
      const draft = state.drafts.find(d => d.id === id);
      if (draft) draft.subject = e.target.value;
    });
  });
};

const renderHighlights = () => {
  ui.highlightChips.innerHTML = '';
  state.profile.highlights.forEach((item, idx) => {
    const chip = document.createElement('div');
    chip.className = 'chip';
    chip.innerHTML = `<span>${item}</span> <button data-remove-highlight="${idx}">✕</button>`;
    ui.highlightChips.appendChild(chip);
  });
  ui.highlightChips.querySelectorAll('button[data-remove-highlight]').forEach(btn => {
    btn.addEventListener('click', () => removeHighlight(Number(btn.dataset.removeHighlight)));
  });
};

const resetAll = () => {
  state.prompt = '';
  state.analysis = null;
  state.organizations = [];
  state.roles = [];
  state.contacts = [];
  state.drafts = [];
  state.selectedContacts = new Set();
  state.profile = { name: '', current_role: '', summary: '', goals: '', highlights: [] };
  ui.promptInput.value = '';
  ui.profileForm.reset();
  ui.maxContactsInput.value = 15;
  ui.countryFilter.value = '';
  ui.seniorityFilter.selectedIndex = -1;
  ui.toneSelect.value = 'semi_formal';
  ui.channelSelect.value = 'email';
  renderAnalysis();
  renderContacts();
  renderDrafts();
  renderHighlights();
  renderStatus();
};

const hydrateFromUI = () => {
  state.profile.name = ui.profileName.value;
  state.profile.current_role = ui.profileRole.value;
  state.profile.goals = ui.profileGoals.value;
  state.profile.summary = ui.profileSummary.value;
};

const boot = () => {
  ui.modeRadios.forEach(radio => radio.addEventListener('change', handleModeChange));
  ui.promptForm.addEventListener('submit', handlePromptSubmit);
  ui.runBtn.textContent = 'Run flow';
  ui.prefillBtn.addEventListener('click', () => {
    ui.promptInput.value = SAMPLE_PROMPT;
    showToast('Sample prompt loaded');
  });
  ui.resetBtn.addEventListener('click', resetAll);
  ui.searchContactsBtn.addEventListener('click', runContactSearch);
  ui.generateDraftsBtn.addEventListener('click', runDraftGeneration);
  ui.orgInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addOrganization(ui.orgInput.value);
      ui.orgInput.value = '';
    }
  });
  ui.roleInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addRole(ui.roleInput.value);
      ui.roleInput.value = '';
    }
  });
  ui.profileForm.addEventListener('input', handleProfileInput);
  ui.highlightInput.addEventListener('keydown', handleHighlightKey);
  ui.profileUpload.addEventListener('change', handleFileUpload);
  ui.toneSelect.addEventListener('change', e => (state.tone = e.target.value));
  ui.channelSelect.addEventListener('change', e => (state.channel = e.target.value));
  ui.maxContactsInput.addEventListener('change', e => (state.maxContacts = Number(e.target.value) || 15));
  ui.countryFilter.addEventListener('change', () => state.contacts.length && renderContacts());
  renderStatus();
  renderAnalysis();
  renderHighlights();
};

document.addEventListener('DOMContentLoaded', () => {
  boot();
  hydrateFromUI();
});
