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
const zlib = require('zlib');
const { execFileSync } = require('child_process');

const HOME = os.homedir();
const CACHE = path.join(HOME, '.cache/hangar');
// The status file is written every 10 seconds while the Hangar window is open
const STALE_AFTER = 45;
const now = Math.floor(Date.now() / 1000);

// Colors come as "light,dark" pairs. SwiftBar ignores a pair for an icon's color (sfcolor), so the
// script picks one itself; it runs every 5 seconds, so it follows a switch to or from dark mode.
let dark = false;
try { dark = execFileSync('/usr/bin/defaults', ['read', '-g', 'AppleInterfaceStyle'], { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() === 'Dark'; } catch {}
const pick = (pair) => String(pair).split(',')[dark ? 1 : 0] || String(pair).split(',')[0];

// Each chat's and ticket's mark in its color: a dot for a chat, a rounded square for a ticket. SwiftBar
// recolors SF Symbols in menus to the text color, but shows an image as it is, so the script draws
// one: a 32-pixel PNG at 144 dpi (16 points, sharp on Retina), edges smoothed.
const CRC = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc32 = (buf) => { let c = 0xffffffff; for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function pngChunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
const marks = new Map();
function mark(hex, shape) {
  const key = hex + shape;
  if (marks.has(key)) return marks.get(key);
  const size = 32;
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const rows = [];
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 4); // filter byte 0, then RGBA
    for (let x = 0; x < size; x++) {
      const dx = x + 0.5 - size / 2;
      const dy = y + 0.5 - size / 2;
      // Signed distance to the shape's edge: a circle of radius 9, or a 18-wide square with corners of 4
      let d;
      if (shape === 'dot') d = Math.hypot(dx, dy) - 9;
      else {
        const qx = Math.abs(dx) - 9 + 4;
        const qy = Math.abs(dy) - 9 + 4;
        d = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - 4;
      }
      const alpha = Math.round(255 * Math.min(1, Math.max(0, 0.5 - d)));
      row.set([r, g, b, alpha], 1 + x * 4);
    }
    rows.push(row);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr.set([8, 6, 0, 0, 0], 8); // 8-bit RGBA
  const phys = Buffer.alloc(9);
  phys.writeUInt32BE(5669, 0); phys.writeUInt32BE(5669, 4); phys[8] = 1; // 144 dpi
  const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), pngChunk('IHDR', ihdr), pngChunk('pHYs', phys),
    pngChunk('IDAT', zlib.deflateSync(Buffer.concat(rows))), pngChunk('IEND', Buffer.alloc(0))]).toString('base64');
  marks.set(key, png);
  return png;
}

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
  ...chats.map((c) => ({ name: c.name, label: clean(c.title), note: c.folder, chat: true, color: c.color })),
  ...tickets.map((t) => ({ name: t.name, label: clean(t.name), note: t.draft ? 'no repos yet' : t.repos.join(', '), ticket: t, color: t.color })),
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
const out = [`${title}|${icon}${needs ? ` color=${pick('#b08800,#e3b341')}` : ''}`, '---'];

const row = (it) => {
  const ci = it.ticket?.ci === 'fail' ? ' ✗ CI failed' : '';
  const when = it.state === 'needs-input' || it.state === 'working' ? ` · ${since(it.at)}` : '';
  // Its icon in the chat's or ticket's own color, the one it has in the Hangar panel
  const icon = /^#[0-9a-f]{6},#[0-9a-f]{6}$/i.test(it.color || '')
    ? `image=${mark(pick(it.color), it.chat ? 'dot' : 'square')}`
    : `sfimage=${it.chat ? 'bubble.left' : 'tag'}`;
  out.push(`${it.label}${it.note ? `${DIM}  ${clean(it.note)}${RESET}` : ''}${ci}${when} | href=${link(it.name)} ${icon} ansi=true${ci ? ` color=${pick('#cf222e,#ff7b72')}` : ''}`);
  for (const pr of it.ticket?.prs || []) {
    const checks = { pass: 'CI passed', fail: 'CI failed', pending: 'CI running', none: '' }[pr.checks] || '';
    out.push(`--${clean(pr.repo)}: PR #${pr.number} ${String(pr.state).toLowerCase()}${checks && ['OPEN', 'DRAFT'].includes(pr.state) ? ` · ${checks}` : ''} | href=${pr.url}`);
  }
};
const group = (heading, state, color) => {
  const list = items.filter((it) => it.state === state);
  if (!list.length) return;
  out.push(`${heading} | size=11 color=${pick(color)}`);
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
