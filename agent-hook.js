#!/usr/bin/env node
// Claude Code hook for the Hangar: records what a ticket's or chat's Claude is doing (working,
// needs-input, idle, ended) in ~/.cache/hangar/agents/<ticket>.json, with the session id so a
// stopped one can be resumed. Only sessions the Hangar started have HANGAR_TICKET; for any other it
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

fs.mkdirSync(dir, { recursive: true });
// Written next to it and renamed into place, so the Hangar never reads a half-written file
const tmp = path.join(dir, `.${path.basename(file)}.${process.pid}.tmp`);
fs.writeFileSync(tmp, JSON.stringify({ ticket, state, session: session || known, at: Math.floor(Date.now() / 1000) }));
fs.renameSync(tmp, file);
