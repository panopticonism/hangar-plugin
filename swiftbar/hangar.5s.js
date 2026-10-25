#!/usr/bin/env node
// <xbar.title>Hangar</xbar.title>
// <xbar.desc>What each Hangar chat's and ticket's Claude is doing, and failing CI.</xbar.desc>
// <swiftbar.hideAbout>true</swiftbar.hideAbout>
// <swiftbar.hideRunInTerminal>true</swiftbar.hideRunInTerminal>
// <swiftbar.hideLastUpdated>true</swiftbar.hideLastUpdated>
// <swiftbar.hideDisablePlugin>true</swiftbar.hideDisablePlugin>
// <swiftbar.hideSwiftBar>true</swiftbar.hideSwiftBar>
//
// The Hangar in the Mac menu bar (SwiftBar runs this every 5 seconds). The Hangar extension installs
// it, with the Node it runs on, when its hangar.menuBar setting is on, and keeps it up to date. It reads:
//   ~/.cache/hangar/status.json   the Hangar window's chats, tickets, PRs and CI, and which Claudes run
//   ~/.cache/hangar/agents/       what each Claude is doing, from its hooks (fresher than the above)
//   ~/.cache/hangar/chats/        the chats, for when the Hangar window isn't open
const fs = require('fs');
const os = require('os');
const path = require('path');

const HOME = os.homedir();
const CACHE = path.join(HOME, '.cache/hangar');
// The status file is written every 10 seconds while the Hangar window is open
const STALE_AFTER = 45;
const now = Math.floor(Date.now() / 1000);

const readJson = (file) => { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; } };
const jsonIn = (dir) => { try { return fs.readdirSync(dir).filter((f) => f.endsWith('.json') && !f.startsWith('.')).map((f) => readJson(path.join(dir, f))).filter(Boolean); } catch { return []; } };

const status = readJson(path.join(CACHE, 'status.json'));
const open = !!status && now - status.at < STALE_AFTER;
const agents = Object.fromEntries(jsonIn(path.join(CACHE, 'agents')).filter((a) => a.ticket).map((a) => [a.ticket, a]));
// Links and "Open Hangar" go to the editor (VSCodium, Cursor, VS Code) and extension that wrote the status
const scheme = status?.scheme || 'vscodium';
const extension = status?.extension || 'panopticonism.hangar';
const app = status?.app || 'VSCodium';
const workspace = status?.workspace || path.join(HOME, '.local/share/hangar/Hangar.code-workspace');

const chats = open ? status.chats
  : jsonIn(path.join(CACHE, 'chats')).filter((c) => c.id).map((c) => ({ name: `chat:${c.id}`, title: c.title || 'New chat', folder: path.basename(c.cwd || c.root || ''), at: c.at || 0 }));
const tickets = status?.tickets || [];

// A Claude only counts as running if the open Hangar window has its terminal: the hooks can't tell
// when a window closes, so their last word may be "working" for a Claude that's gone
function stateOf(name) {
  if (!open || !status.running.includes(name)) return 'stopped';
  const s = agents[name]?.state;
  return s === 'needs-input' ? 'needs-input' : s === 'working' || s === 'starting' ? 'working' : 'idle';
}

function since(seconds) {
  const s = Math.max(0, now - seconds);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  return `${Math.round(s / 86400)} d ago`;
}

// SwiftBar reads "text | params": a | in a title would end it early
const clean = (t) => String(t).replace(/\|/g, '¦').replace(/\n/g, ' ');
const DIM = '\u001b[90m';
const RESET = '\u001b[0m';
// The Hangar's own links carry its key, so it opens them without asking (a link from anywhere else asks)
let key = '';
try { key = fs.readFileSync(path.join(HOME, '.local/share/hangar/link-key'), 'utf8').trim(); } catch {}
const link = (name) => `${scheme}://${extension}/open?ticket=${encodeURIComponent(name)}${key ? `&key=${key}` : ''}`;

const items = [
  ...chats.map((c) => ({ name: c.name, label: clean(c.title), note: c.folder, chat: true })),
  ...tickets.map((t) => ({ name: t.name, label: clean(t.name), note: t.draft ? 'no repos yet' : t.repos.join(', '), ticket: t })),
].map((it) => ({ ...it, state: stateOf(it.name), at: agents[it.name]?.at || 0 }));
items.sort((a, b) => b.at - a.at);

const failing = tickets.filter((t) => t.ci === 'fail');
const count = (s) => items.filter((it) => it.state === s).length;
const needs = count('needs-input');
const working = count('working');

// The menu bar: the hangar, then what's waiting on you, else what's working, and failing CI
const iconFile = path.join(HOME, '.local/share/hangar/menubar.png');
let icon = '';
try { icon = ` templateImage=${fs.readFileSync(iconFile).toString('base64')}`; } catch { icon = ' sfimage=airplane'; }
const title = [needs ? `${needs} waiting on you` : working ? `${working} working` : '', failing.length ? `✗ ${failing.length} CI` : ''].filter(Boolean).join(' · ');
const out = [`${title}|${icon}${needs ? ' color=#b08800,#e3b341' : ''}`, '---'];

const row = (it) => {
  const ci = it.ticket?.ci === 'fail' ? ' ✗ CI failed' : '';
  const when = it.state === 'needs-input' || it.state === 'working' ? ` · ${since(it.at)}` : '';
  const icon = it.chat ? 'bubble.left' : 'tag';
  out.push(`${it.label}${it.note ? `${DIM}  ${clean(it.note)}${RESET}` : ''}${ci}${when} | href=${link(it.name)} sfimage=${icon} ansi=true${ci ? ' color=#cf222e,#ff7b72' : ''}`);
  for (const pr of it.ticket?.prs || []) {
    const checks = { pass: 'CI passed', fail: 'CI failed', pending: 'CI running', none: '' }[pr.checks] || '';
    out.push(`--${clean(pr.repo)}: PR #${pr.number} ${String(pr.state).toLowerCase()}${checks && ['OPEN', 'DRAFT'].includes(pr.state) ? ` · ${checks}` : ''} | href=${pr.url}`);
  }
};
const group = (heading, state, color) => {
  const list = items.filter((it) => it.state === state);
  if (!list.length) return;
  out.push(`${heading} | size=11 color=${color}`);
  list.forEach(row);
};

if (!open) out.push(`The Hangar window isn't open | size=11 color=gray`);
group('Waiting on you', 'needs-input', '#b08800,#e3b341');
group('Working', 'working', '#0969da,#58a6ff');
group('Idle', 'idle', 'gray');
const stopped = items.filter((it) => it.state === 'stopped');
if (stopped.length) {
  out.push(`Not running (${stopped.length}) | size=11 color=gray`);
  for (const it of stopped) {
    const before = out.length;
    row(it);
    // One level down, in a submenu, so a long list doesn't fill the menu
    for (let i = before; i < out.length; i++) out[i] = `--${out[i]}`;
  }
  // The submenu needs a parent row; the heading above becomes it
  const at = out.findIndex((l) => l.startsWith(`Not running (${stopped.length})`));
  out[at] = `Not running (${stopped.length}) | color=gray`;
}
if (!items.length) out.push('No chats or tickets yet | color=gray');
out.push('---');
out.push(`Open Hangar | bash=/usr/bin/open param1=-a param2="${app}" param3="${workspace}" terminal=false`);
out.push('Refresh | refresh=true');
console.log(out.join('\n'));
