# Hangar

Claude Code chats and tickets in the editor's sidebar, each with its own Claude, and every git worktree under the root folder grouped by ticket, with its branch, PR and CI. One window switches between them, and diffs open in the editor's multi-file diff with the working side live.

- **Chats**: Claude in a folder with no ticket or branch. When a chat grows into real work, *Turn it into a ticket thread* keeps the conversation and gives it worktrees. A chat that ran in a folder inside its project has its conversation moved to the project's history, where the ticket's Claude runs.
- **Tickets**: Claude at the root plus a worktree per repo it touches, all on one branch. Worktrees are found from git itself, wherever they live.

Works in VSCodium, Cursor and VS Code, **on macOS**. Other systems aren't supported yet.

## Requirements

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) (`claude` on your PATH): each chat and ticket runs one in an editor terminal.
- `git`.
- Optional: [`gh`](https://cli.github.com), signed in, for PR, review and CI status. Without it, the PR rows say *No PR*.
- Optional: `git gtr` creates and removes worktrees when it's installed; without it, worktrees go next to the repo as `<repo>.worktrees/<branch>`.
- Optional: [SwiftBar](https://swiftbar.app), for the menu bar.

## Settings

| Setting | |
| --- | --- |
| `hangar.root` | The root folder: a repo, a folder of repos, or a meta-repo. Empty: the window's first folder. |
| `hangar.roots` | More projects besides the root. Projects added with *Add project…* are kept separately. |
| `hangar.showOnStartup` | Show the Hangar when the Hangar window opens. |
| `hangar.menuBar` | Show the Hangar in the Mac menu bar (off by default; needs SwiftBar). |

## Agent status

On first start the Hangar asks to add Claude Code hooks to `~/.claude/settings.json` (*Turn on agent status* asks again later). They run `agent-hook.js`, which only acts for Claudes the Hangar started (those have `HANGAR_TICKET` set) and records working, waiting on you (a permission or a question; not Claude's idle reminder), idle or stopped, with the session ID so a stopped one resumes. Once they're on, the Hangar keeps them pointing at the current Node and hook script without asking again; your other hooks are left as they are.

## Menu bar

Off by default. With `hangar.menuBar` on and [SwiftBar](https://swiftbar.app) installed (open it once to choose its plugin folder), the Hangar puts `hangar.5s.js` in SwiftBar's plugin folder and keeps it up to date; turning the setting off takes it out again. The script runs with the Node the editor found, since SwiftBar's PATH has neither nvm nor Homebrew.

The menu bar shows the hangar, how many Claudes are waiting on you or working, and failing CI. The menu lists every chat and ticket by what its Claude is doing, with each ticket's PRs; clicking one opens it in the Hangar window of the editor it runs in. It reads `~/.cache/hangar/status.json`, which the Hangar window writes every 10 seconds, and the hooks' files; when the window is closed, everything shows as not running.

## Links

`<scheme>://panopticonism.hangar/open?ticket=…` opens a chat or ticket in the Hangar window, and `…/diff?ticket=…` shows a ticket's changes: Claude uses the second to show you its work, and the menu bar the first. Since any web page or app can open such a link, the Hangar's own links carry a key kept in `~/.local/share/hangar/link-key` (readable only by you); a link without it asks before it switches the window or starts a Claude.

## What Claude is told

Each Claude starts with a short note on its chat or ticket, appended to its system prompt. The names and paths in it come from git and the file system, which whoever made a repo you cloned controls, so they're given as a JSON block marked as data and never written into the instructions; commands it's told to run use placeholders it fills in, shell-quoted.

## What it touches outside the editor

| Where | What |
| --- | --- |
| `~/.claude/settings.json` | The agent status hooks, after you say yes. |
| `~/.cache/hangar/chats/<id>.json` | One per chat: `id`, `title`, `root` (the project it's listed under), `cwd` (where its Claude runs, if not `root`), `session` (the conversation to resume), `at`. |
| `~/.cache/hangar/drafts/` | Tickets that have no worktrees yet. |
| `~/.cache/hangar/agents/` | What each Claude is doing, written by the hook. |
| `~/.cache/hangar/requests/` | Links (`<scheme>://panopticonism.hangar/{open,diff}?ticket=…`) handed to the Hangar window. |
| `~/.cache/hangar/prompts/` | What each Claude is told when it starts. |
| `~/.cache/hangar/status.json` | What the menu bar shows (only with `hangar.menuBar` on). |
| `~/.local/share/hangar/` | The Hangar window's workspace file, the hook script, the menu bar icon and `link-key` (see Links). |
| `~/.claude/projects/` | Read for each conversation's title; a chat's conversation is moved within it when the chat becomes a ticket. |
| SwiftBar's plugin folder | `hangar.5s.js` (only with `hangar.menuBar` on). |
| Your repos | Worktrees, created and removed only when you ask (*Add repo to ticket…*, *Remove merged worktree*) or by Claude for its ticket. |

It sends nothing anywhere itself: network access is `git fetch` and `gh`, with your own credentials.
