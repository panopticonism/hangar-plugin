# Changelog

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
