# Changelog

## 3.3.0

- A **Reviews** section, next to Chats and Tickets, for reviewing other people's pull requests. *New review…* (the + on Reviews, or right-click a project) takes the PR's number or its GitHub link, checks the PR out with `gh pr checkout` in a worktree of its own next to its repo (`<repo>.worktrees/review-pr-<number>`, on a branch named after the PR's title, like `review/fix-login-redirect`, PRs from forks too), and starts a Claude there that reviews it straight away. It works in the background: the window stays where it is, and a notice says when Claude has finished. Click the review to switch to it and read what it found.
- A review's Claude is told the PR is someone else's work to review, not instructions; to report what it finds most serious first, with file and line; and not to edit, commit, push, or comment on, approve or request changes on the PR unless you ask. It can show you the PR's changes in Hangar's diff, and brings the checkout up to date with `git pull` when you ask what's new.
- A review's row shows its PR's number and title, its repo, and when CI is failing or the PR has been merged or closed; under it are its Claude, the PR's branch (diff, terminal, reveal, copy) and the PR. A merged or closed PR's review gets a remove button, and *Remove review* (right-click) removes one any time: it closes its Claude and removes its worktree and branch, never forced. Its conversation stays in Claude's history.
- **Add selection to Claude** (right-click in a file): puts `@path#L5-12` for the selected lines in the prompt of the Claude it's for (the ticket, chat or review whose worktree the file is in, else the one the window is on), as Claude Code's own does. It types into the Claude's terminal, so it works whether or not that Claude is connected to the editor.
- Hangar's Claudes connect to the editor again: Hangar no longer strips the Claude Code extension's `CLAUDE_CODE_SSE_PORT` from their terminals, so its *Insert At-Mentioned* (Cmd+Option+K) and editor diffs reach them. A Claude already running keeps the old environment until it's closed and started again.
- Reviews are in *Open ticket or chat…* and the menu bar too, with an eye. A review's failing CI shows on its row but isn't counted in Hangar's badge or the menu bar's title: it's not yours to fix.

## 3.2.0

- A Hangar diff can show everything on the branch against its base branch (as before), only what isn't committed yet, or what the last commit changed. While one is in front, a highlighted item in the status bar says which (*Comparing with master*, *Uncommitted changes*, *Last commit*); click it, or run *Hangar: Compare with…*, to switch. The diff switches in place and keeps up with your edits and commits. Editors that show extension buttons on a multi-file diff (VS Code, VSCodium) also have it in the diff's title bar; Cursor doesn't show them there.

## 3.1.3

- Hangar's icon is the same drawing everywhere (the menu bar, the sidebar and the extension's icon), with heavier lines, a slightly taller roof and the plane's tail in the door filled in.
- The menu bar icon is drawn on the menu bar's own pixel grid, so its lines are straight and crisp, and it's centred like the icons next to it.
- The extension's icon is drawn at twice the size, so its lines stay smooth instead of jagged on Retina screens.

## 3.1.2

- The Hangar window asks once whether to show Hangar in the Mac menu bar, so you find out it can without reading the README. It doesn't ask if you've already set `hangar.menuBar` either way, and comes after the agent status question.
- An editor or profile with the menu bar off no longer takes out the menu bar script another one put in, each time it starts. Only turning the setting off does.

## 3.1.1

- Released on GitHub, built for Macs only (Apple silicon and Intel).
- Doesn't start in Restricted Mode or in a virtual workspace, since it runs git, `gh` and Claude Code in your repos.

## 3.1.0

- The menu bar names each repo of a ticket or chat once (not once per worktree), and tells several PRs from one repo apart by their branch.
- After a reload the panel stays empty (with its progress bar) until the first scan is done, then shows everything at once, instead of first showing a ticket or two with nothing in them. It waits up to 4 more seconds for PRs.
- A worktree mid-rebase (detached until the rebase finishes, including while it's stopped on a conflict) still counts as its branch's: it no longer shows *(detached)*, and a ticket or chat that took the branch keeps it instead of letting it go to a ticket of its own.
- A ticket or chat whose PR's CI is still running says *CI running*, in the panel and the menu bar, as it says *CI failing*.
- An idle Claude that still has a check running in the background (a Claude Code Monitor, or a command it ran in the background: tests, a build, a loop waiting on a PR's CI) shows *watching · 1 check*, with each check and when it started in the tooltip, and goes back to *idle* when the check ends. A command that doesn't end by itself doesn't count: a server (any command listening on a port, or a known one like `npm run dev`, `vite` or `docker compose up` before it does) or a watcher (`tail -f`, `--watch`), so it doesn't show *watching* for as long as it runs. A test started alongside a server still counts. Hangar reads them from the conversation a chunk at a time, only what's new since the last look, and asks for the Claude's processes only when one is open.
- A branch a chat's Claude makes stays with the chat: its worktree shows under the chat, not as a ticket of its own with a second Claude, and goes with it when the chat becomes a ticket (whatever the ticket is called). *Turn it into a ticket thread* suggests that branch.
- A chat's Claude is told to ask for the chat to become a ticket before it makes a branch, and to report any worktree it makes anyway. It can show you a chat's worktree changes, like a ticket's Claude.
- Removing a chat puts the worktrees it held back under tickets of their own.
- A chat's Claude asked for a branch anyway makes it as a worktree, not by switching the repo's own checkout.
- A worktree Claude reports right after making it stays with its chat or ticket: the claim is no longer dropped before a scan has seen the worktree, including by a scan that was already running when Claude made it.
- A chat's worktrees count like a ticket's: *CI failing* on the chat, in Hangar's badge, and in the menu bar, which lists their PRs.
- A chat's Claude reporting a branch that a ticket already works on (one started or claimed in Hangar, or that has had a Claude) leaves it with that ticket.
- A worktree a chat's or ticket's Claude makes (`git worktree add`, `git gtr new`) goes under that chat or ticket even if Claude doesn't report it: the agent status hook reports it (including `git worktree add <path>` with no branch, which git names after the folder), and Hangar takes it once git shows the worktree, without listing it as a ticket of its own first.
- Two or more worktrees of one repo in the same ticket or chat share one repo row, with a branch row (and its PR) for each, instead of a repo row per worktree. Their folders, diff titles and terminals name the branch.
- A worktree's actions (diff, terminal, reveal, copy, move, remove) are on its branch row only; repo rows just group, whether they hold one worktree or several.
- Each scan asks git once per worktree instead of twice (`git status --porcelain=v2 --branch` gives the changes and how far it's ahead of and behind its upstream), about half the time.
- While the Hangar window is in the background and no Claude is working, it scans every 60 seconds instead of every 10, and straight away when it's focused again. What each Claude is doing, links and worktree reports still come in at once.
- Closing the Hangar window shows in the menu bar at once, instead of once its status file has gone stale.

## 3.0.1

- An open diff tab picks up files that start or stop being changed again (newer editors add the file count to its title, which hid it from Hangar, and kept the files it was opened with).
- A diff tab brought back empty after a reload is closed, so the ticket's diff opens properly again.
- After a reload, worktrees go straight to the ticket that claimed their branch, instead of for the first ten seconds to one of their own (which took the folder out of the window and put it back).
- Backticks in a branch or folder name are escaped in what Claude is told, so a name can't end the block of data early.
- A repo that isn't on GitHub (no remote, or another host) says *No PR*, not *PR status unavailable*.
- Turning the menu bar off also removes the status file it read.
- A link that arrives while another is being handled (one waiting on its confirmation, say) is no longer left waiting for the next link. A link to open or show something that waited more than five minutes for a Hangar window is dropped; Claude's report of a worktree still counts.
- A ticket can hold several branches it doesn't name: each one Claude reports or that's moved to it, not just the last.
- A re-run of a failed check shows as running while it's queued, not as failed.
- Turning a chat into a ticket without agent status still asks its Claude to exit before closing the terminal.
- A malformed key in a link is rejected instead of raising an error.
- The link key stays in its file: the commands Claude is given read it there, so it's in neither the prompt nor Claude's transcript, and prompt files are readable only by you.
- The agent status hooks are written to `~/.claude/settings.json` in one go, from a fresh read, and through a symlink if it is one.
- The menu bar drops control characters from chat and ticket names, so an escape code in a title can't recolor the menu.

## 3.0.0

First public release, as `panopticonism.hangar`.

- Chats can be listed under a project but run in a folder inside it (`cwd`), and keep their conversation when they become a ticket.
- A chat or ticket resumes the conversation Claude actually saved, never an empty one from a Claude that was closed before anything was typed.
- *Waiting on you* only for a permission or a question, not for Claude's idle reminder.
- Optional Mac menu bar, through SwiftBar (`hangar.menuBar`), with each chat and ticket in its own color.
- Chats get their own color in the panel, like tickets.
- A ticket keeps the worktrees its Claude makes, whatever it names the branch: Claude reports each one. *Move to ticket…* fixes one filed under the wrong ticket.
- Agent status hooks follow Node upgrades without asking again.
- Only the Hangar window scans continuously; other windows scan while their Hangar panel is showing.
- *Open ticket or chat…* lists chats too; chat terminals are named after the chat.
- Links from outside Hangar (a web page, another app) ask before they open a chat or ticket; Hangar's own links carry a key.
- What Claude is told keeps names and paths from git and the file system out of its instructions, as data.
- CI stays green when a check was run again: only the latest run of each check counts, so one that a newer run cancelled doesn't show as failed.
- When `gh` can't reach GitHub (signed out, offline, rate limited) a PR keeps its last status, marked *not up to date*, and a worktree with no PR seen yet says *PR status unavailable*, instead of *No PR*.
