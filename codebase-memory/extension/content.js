(function () {
  'use strict';

  if (document.getElementById('cm-root')) return;

  const SERVER = 'http://localhost:8000';

  // ── Styles ───────────────────────────────────────────────────────────────────

  const style = document.createElement('style');
  style.textContent = `
    #cm-toggle {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background: #161b22;
      border: 1px solid #30363d;
      color: #e6edf3;
      font-size: 22px;
      cursor: pointer;
      z-index: 999999;
      box-shadow: 0 4px 16px rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
      padding: 0;
    }
    #cm-toggle:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 24px rgba(0,0,0,0.6);
    }
    #cm-panel {
      position: fixed;
      top: 60px;
      right: -420px;
      width: 390px;
      max-height: calc(100vh - 80px);
      background: #0d1117;
      border: 1px solid #30363d;
      border-right: none;
      border-radius: 12px 0 0 12px;
      z-index: 999998;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: -6px 0 32px rgba(0,0,0,0.6);
      transition: right 0.28s cubic-bezier(0.4, 0, 0.2, 1);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
      font-size: 14px;
      color: #e6edf3;
      line-height: 1.5;
    }
    #cm-panel.cm-open { right: 0; }
    #cm-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 16px 13px;
      background: #161b22;
      border-bottom: 1px solid #30363d;
      flex-shrink: 0;
    }
    #cm-header-title {
      font-weight: 600;
      font-size: 15px;
      letter-spacing: -0.01em;
    }
    #cm-close {
      background: none;
      border: none;
      color: #8b949e;
      cursor: pointer;
      font-size: 18px;
      line-height: 1;
      padding: 2px 4px;
      border-radius: 4px;
      transition: color 0.1s;
    }
    #cm-close:hover { color: #e6edf3; }
    #cm-status-bar {
      padding: 7px 16px;
      font-size: 12px;
      color: #8b949e;
      background: #161b22;
      border-bottom: 1px solid #30363d;
      flex-shrink: 0;
    }
    #cm-status-bar.cm-ok  { color: #3fb950; }
    #cm-status-bar.cm-err { color: #f85149; }
    #cm-body {
      padding: 16px;
      overflow-y: auto;
      flex: 1;
    }
    #cm-input {
      width: 100%;
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 6px;
      color: #e6edf3;
      padding: 10px 12px;
      font-size: 14px;
      font-family: inherit;
      resize: vertical;
      min-height: 76px;
      box-sizing: border-box;
      outline: none;
      transition: border-color 0.15s;
    }
    #cm-input:focus { border-color: #58a6ff; }
    #cm-input::placeholder { color: #6e7681; }
    #cm-ask {
      width: 100%;
      margin-top: 10px;
      padding: 9px 0;
      background: #238636;
      color: #fff;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.15s;
      font-family: inherit;
    }
    #cm-ask:hover:not(:disabled) { background: #2ea043; }
    #cm-ask:disabled { background: #21262d; color: #484f58; cursor: default; }
    #cm-result { margin-top: 4px; }
    #cm-divider {
      border: none;
      border-top: 1px solid #30363d;
      margin: 16px 0 14px;
    }
    .cm-section-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #8b949e;
      margin-bottom: 8px;
    }
    #cm-answer-text {
      color: #e6edf3;
      line-height: 1.65;
      white-space: pre-wrap;
    }
    #cm-sources-label { margin-top: 16px; }
    .cm-source {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 8px;
      padding: 8px 10px;
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 6px;
      margin-bottom: 6px;
    }
    .cm-source a {
      color: #58a6ff;
      text-decoration: none;
      font-size: 13px;
      line-height: 1.4;
    }
    .cm-source a:hover { text-decoration: underline; }
    .cm-source-date {
      color: #8b949e;
      font-size: 11px;
      white-space: nowrap;
      flex-shrink: 0;
      padding-top: 1px;
    }
    #cm-spinner {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px 0;
    }
    #cm-spinner::after {
      content: '';
      width: 22px;
      height: 22px;
      border: 2px solid #30363d;
      border-top-color: #58a6ff;
      border-radius: 50%;
      animation: cm-spin 0.65s linear infinite;
    }
    @keyframes cm-spin { to { transform: rotate(360deg); } }
  `;
  document.head.appendChild(style);

  // ── DOM ──────────────────────────────────────────────────────────────────────

  const root = document.createElement('div');
  root.id = 'cm-root';
  root.innerHTML = `
    <button id="cm-toggle" title="Codebase Memory">🧠</button>
    <div id="cm-panel">
      <div id="cm-header">
        <span id="cm-header-title">Codebase Memory</span>
        <button id="cm-close" title="Close">✕</button>
      </div>
      <div id="cm-status-bar">Connecting to local server…</div>
      <div id="cm-body">
        <textarea id="cm-input" placeholder="Ask about this codebase…&#10;e.g. Why did we add load tests?"></textarea>
        <button id="cm-ask" disabled>Ask</button>
        <div id="cm-spinner" style="display:none"></div>
        <div id="cm-result" style="display:none">
          <hr id="cm-divider">
          <div class="cm-section-label">Answer</div>
          <div id="cm-answer-text"></div>
          <div class="cm-section-label" id="cm-sources-label">Sources</div>
          <div id="cm-sources-list"></div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(root);

  const toggle    = document.getElementById('cm-toggle');
  const panel     = document.getElementById('cm-panel');
  const closeBtn  = document.getElementById('cm-close');
  const statusBar = document.getElementById('cm-status-bar');
  const input     = document.getElementById('cm-input');
  const askBtn    = document.getElementById('cm-ask');
  const spinner   = document.getElementById('cm-spinner');
  const result    = document.getElementById('cm-result');
  const answerEl  = document.getElementById('cm-answer-text');
  const sourcesEl = document.getElementById('cm-sources-list');

  // ── Status check ─────────────────────────────────────────────────────────────

  async function checkStatus() {
    statusBar.className = '';
    statusBar.textContent = 'Connecting…';
    try {
      const res = await fetch(`${SERVER}/status`, { signal: AbortSignal.timeout(4000) });
      const data = await res.json();
      if (data.ok) {
        statusBar.textContent = `${data.repo} · ${data.pr_count} PRs indexed`;
        statusBar.className = 'cm-ok';
        askBtn.disabled = false;
      } else {
        statusBar.textContent = 'No data — run python ingest.py first';
        statusBar.className = 'cm-err';
        askBtn.disabled = true;
      }
    } catch {
      statusBar.textContent = 'Server offline — run python server.py first';
      statusBar.className = 'cm-err';
      askBtn.disabled = true;
    }
  }

  // ── Panel toggle ─────────────────────────────────────────────────────────────

  toggle.addEventListener('click', () => {
    const opening = !panel.classList.contains('cm-open');
    panel.classList.toggle('cm-open');
    if (opening) checkStatus();
  });

  closeBtn.addEventListener('click', () => panel.classList.remove('cm-open'));

  // ── Query ────────────────────────────────────────────────────────────────────

  async function runQuery() {
    const question = input.value.trim();
    if (!question) return;

    askBtn.disabled = true;
    result.style.display = 'none';
    spinner.style.display = 'flex';

    try {
      const res = await fetch(`${SERVER}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();

      answerEl.textContent = data.answer;
      sourcesEl.innerHTML = (data.sources || []).map(s => `
        <div class="cm-source">
          <a href="${s.pr_url}" target="_blank">PR #${s.pr_number} — ${s.pr_title}</a>
          <span class="cm-source-date">${s.merged_at}</span>
        </div>
      `).join('');

      result.style.display = 'block';
    } catch {
      answerEl.textContent = 'Could not reach server. Is python server.py running?';
      sourcesEl.innerHTML = '';
      result.style.display = 'block';
    } finally {
      spinner.style.display = 'none';
      askBtn.disabled = false;
    }
  }

  askBtn.addEventListener('click', runQuery);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) runQuery();
  });

})();
