(function () {
  'use strict';

  if (document.getElementById('cm-root')) return;

  const SERVER = 'http://localhost:8000';

  // ── Styles ───────────────────────────────────────────────────────────────────

  const style = document.createElement('style');
  style.textContent = `
    /* ── Theme tokens ── */
    #cm-root {
      --cm-bg:           #0d1117;
      --cm-surface:      #161b22;
      --cm-border:       #30363d;
      --cm-text:         #e6edf3;
      --cm-muted:        #8b949e;
      --cm-placeholder:  #6e7681;
      --cm-blue:         #58a6ff;
      --cm-green:        #238636;
      --cm-green-hover:  #2ea043;
      --cm-disabled-bg:  #21262d;
      --cm-disabled-fg:  #484f58;
      --cm-shadow:       rgba(0,0,0,0.5);
      --cm-shadow-lg:    rgba(0,0,0,0.6);
    }
    @media (prefers-color-scheme: light) {
      #cm-root {
        --cm-bg:           #ffffff;
        --cm-surface:      #f6f8fa;
        --cm-border:       #d0d7de;
        --cm-text:         #1f2328;
        --cm-muted:        #57606a;
        --cm-placeholder:  #8c959f;
        --cm-blue:         #0969da;
        --cm-green:        #1a7f37;
        --cm-green-hover:  #2da44e;
        --cm-disabled-bg:  #eaeef2;
        --cm-disabled-fg:  #8c959f;
        --cm-shadow:       rgba(140,149,159,0.2);
        --cm-shadow-lg:    rgba(140,149,159,0.3);
      }
    }

    #cm-toggle {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background: var(--cm-surface);
      border: 1px solid var(--cm-border);
      color: var(--cm-text);
      font-size: 22px;
      cursor: pointer;
      z-index: 999999;
      box-shadow: 0 4px 16px var(--cm-shadow);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
      padding: 0;
    }
    #cm-toggle:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 24px var(--cm-shadow-lg);
    }
    #cm-panel {
      position: fixed;
      top: 60px;
      right: -420px;
      width: 390px;
      max-height: calc(100vh - 80px);
      background: var(--cm-bg);
      border: 1px solid var(--cm-border);
      border-right: none;
      border-radius: 12px 0 0 12px;
      z-index: 999998;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: -6px 0 32px var(--cm-shadow-lg);
      transition: right 0.28s cubic-bezier(0.4, 0, 0.2, 1);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
      font-size: 14px;
      color: var(--cm-text);
      line-height: 1.5;
    }
    #cm-panel.cm-open { right: 0; }
    #cm-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 16px 13px;
      background: var(--cm-surface);
      border-bottom: 1px solid var(--cm-border);
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
      color: var(--cm-muted);
      cursor: pointer;
      font-size: 18px;
      line-height: 1;
      padding: 2px 4px;
      border-radius: 4px;
      transition: color 0.1s;
    }
    #cm-close:hover { color: var(--cm-text); }
    #cm-status-bar {
      padding: 7px 16px;
      font-size: 12px;
      color: var(--cm-muted);
      background: var(--cm-surface);
      border-bottom: 1px solid var(--cm-border);
      flex-shrink: 0;
    }
    #cm-status-bar.cm-ok  { color: #1a7f37; }
    #cm-status-bar.cm-err { color: #cf222e; }
    #cm-body {
      padding: 16px;
      overflow-y: auto;
      flex: 1;
    }
    #cm-input {
      width: 100%;
      background: var(--cm-surface);
      border: 1px solid var(--cm-border);
      border-radius: 6px;
      color: var(--cm-text);
      padding: 10px 12px;
      font-size: 14px;
      font-family: inherit;
      resize: vertical;
      min-height: 76px;
      box-sizing: border-box;
      outline: none;
      transition: border-color 0.15s;
    }
    #cm-input:focus { border-color: var(--cm-blue); }
    #cm-input::placeholder { color: var(--cm-placeholder); }
    #cm-ask {
      width: 100%;
      margin-top: 10px;
      padding: 9px 0;
      background: var(--cm-green);
      color: #fff;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.15s;
      font-family: inherit;
    }
    #cm-ask:hover:not(:disabled) { background: var(--cm-green-hover); }
    #cm-ask:disabled { background: var(--cm-disabled-bg); color: var(--cm-disabled-fg); cursor: default; }
    #cm-result { margin-top: 4px; }
    #cm-divider {
      border: none;
      border-top: 1px solid var(--cm-border);
      margin: 16px 0 14px;
    }
    .cm-section-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--cm-muted);
      margin-bottom: 8px;
    }
    #cm-answer-text {
      color: var(--cm-text);
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
      background: var(--cm-surface);
      border: 1px solid var(--cm-border);
      border-radius: 6px;
      margin-bottom: 6px;
    }
    .cm-source a {
      color: var(--cm-blue);
      text-decoration: none;
      font-size: 13px;
      line-height: 1.4;
    }
    .cm-source a:hover { text-decoration: underline; }
    .cm-source-date {
      color: var(--cm-muted);
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
      border: 2px solid var(--cm-border);
      border-top-color: var(--cm-blue);
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
