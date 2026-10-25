# Changelog

## 3.0.1

- An open diff tab picks up files that start or stop being changed again (newer editors add the file count to its title, which hid it from the Hangar, and kept the files it was opened with).
- A diff tab brought back empty after a reload is closed, so the ticket's diff opens properly again.
- After a reload, worktrees go straight to the ticket that claimed their branch, instead of for the first ten seconds to one of their own (which took the folder out of the window and put it back).
- Backticks in a branch or folder name are escaped in what Claude is told, so a name can't end the block of data early.
- A repo that isn't on GitHub (no remote, or another host) says *No PR*, not *PR status unavailable*.
- Turning the menu bar off also removes the status file it read.
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
- Links from outside the Hangar (a web page, another app) ask before they open a chat or ticket; the Hangar's own links carry a key.
- What Claude is told keeps names and paths from git and the file system out of its instructions, as data.
- CI stays green when a check was run again: only the latest run of each check counts, so one that a newer run cancelled doesn't show as failed.
- When `gh` can't reach GitHub (signed out, offline, rate limited) a PR keeps its last status, marked *not up to date*, and a worktree with no PR seen yet says *PR status unavailable*, instead of *No PR*.
