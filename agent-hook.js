#!/usr/bin/env node
// Claude Code hook for Hangar: records what a ticket's or chat's Claude is doing (working,
// needs-input, idle, ended) in ~/.cache/hangar/agents/<ticket>.json, with the session id so a
// stopped one can be resumed. Only sessions Hangar started have HANGAR_TICKET; for any other it
// does nothing.
// Usage (from ~/.claude/settings.json hooks): node agent-hook.js <state>, hook JSON on stdin.
const fs = require('fs');
const os = require('os');
const path = require('path');

const ticket = process.env.HANGAR_TICKET;
const state = process.argv[2];
if (!ticket || !state) process.exit(0);

let input = {};
try { input = JSON.parse(fs.readFileSync(0, 'utf8')) || {}; } catch {}
const session = input.session_id || '';

// Notifications are how Claude asks for something (a permission, a question), but it also sends
// one when it has sat idle for a minute ("Claude is waiting for your input") and after signing in.
// Those aren't questions: the state stays as it was.
const NOT_ASKING = new Set(['idle_prompt', 'auth_success']);
if (state === 'needs-input' && (NOT_ASKING.has(input.notification_type)
    || (!input.notification_type && /waiting for your input/i.test(input.message || '')))) process.exit(0);

const dir = path.join(os.homedir(), '.cache/hangar/agents');
const file = path.join(dir, `${ticket.replace(/\//g, '_')}.json`);
let known = '';
try { known = JSON.parse(fs.readFileSync(file, 'utf8')).session || ''; } catch {}

// /clear and resume end one session and start another; the hooks run in the background, so the
// old session's end can land after the new one's start. It only counts for the current one.
if (state === 'ended' && session && known && session !== known) process.exit(0);

// Written next to it and renamed into place, so Hangar never reads a half-written file
function writeAtomic(target, value) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const tmp = path.join(path.dirname(target), `.${path.basename(target)}.${process.pid}.tmp`);
  fs.writeFileSync(tmp, JSON.stringify(value));
  fs.renameSync(tmp, target);
}

writeAtomic(file, { ticket, state, session: session || known, at: Math.floor(Date.now() / 1000) });

// The words of a shell command, quotes taken off, split into its commands (&&, ||, ;, |, newlines)
function commandsIn(line) {
  const cmds = [[]];
  const re = /\s*(?:'([^']*)'|"((?:[^"\\]|\\.)*)"|(&&|\|\||[;|\n])|((?:[^\s'";|&]|&(?!&))+))/g;
  let m;
  while ((m = re.exec(line)) && m[0]) {
    if (m[3]) cmds.push([]);
    else cmds[cmds.length - 1].push(m[1] ?? (m[2] != null ? m[2].replace(/\\(.)/g, '$1') : m[4]));
  }
  return cmds.filter((c) => c.length);
}

// The branches the worktrees a command makes are on: git worktree add -b/-B <branch> (or the branch
// it checks out), git gtr new <branch>. A guess from the command's words: Hangar only takes it once
// it has found a worktree on that branch.
function worktreeBranches(line) {
  const found = [];
  for (const words of commandsIn(line)) {
    const add = words.findIndex((w, i) => w === 'add' && words[i - 1] === 'worktree');
    const gtrNew = words.findIndex((w, i) => w === 'new' && /(^|\/)(git-)?gtr$/.test(words[i - 1] || ''));
    if (add > 0) {
      const rest = words.slice(add + 1);
      const b = rest.findIndex((w) => w === '-b' || w === '-B');
      if (b >= 0 && rest[b + 1]) { found.push(rest[b + 1]); continue; }
      // No new branch: the second plain word is what it checks out. With only a path (and not
      // --detach), git names the branch after the path's last folder.
      const plain = rest.filter((w, i) => !w.startsWith('-') && rest[i - 1] !== '--reason');
      if (plain[1]) found.push(plain[1]);
      else if (plain[0] && !rest.some((w) => w === '--detach' || w === '-d')) found.push(path.basename(plain[0].replace(/\/+$/, '')));
    } else if (gtrNew > 0) {
      const rest = words.slice(gtrNew + 1);
      const plain = rest.filter((w, i) => !w.startsWith('-') && !['--from', '--name'].includes(rest[i - 1]));
      if (plain[0]) found.push(plain[0]);
    }
  }
  return found;
}

// A worktree its Claude made is reported to Hangar like the added link it's told to run, so it's
// filed under this ticket or chat even when Claude doesn't run that link
if (input.hook_event_name === 'PostToolUse' && input.tool_name === 'Bash') {
  const requests = path.join(os.homedir(), '.cache/hangar/requests');
  worktreeBranches(String(input.tool_input?.command || '')).forEach((branch, i) => {
    writeAtomic(path.join(requests, `${Date.now()}-${process.pid}-${i}.json`), { action: 'added', ticket, branch, trusted: true, fromHook: true });
  });
}
