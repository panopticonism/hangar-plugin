# Changelog

## Unreleased

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
