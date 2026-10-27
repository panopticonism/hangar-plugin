# Hangar

Claude Code chats and tickets in the editor's sidebar, each with its own Claude, and every git worktree under the root folder grouped by ticket, with its branch, PR and CI. One window switches between them, and diffs open in the editor's multi-file diff with the working side live.

- **Chats**: Claude in a folder with no ticket or branch. When a chat grows into real work, *Turn it into a ticket thread* keeps the conversation and gives it worktrees. If the chat's Claude made a branch anyway, its worktree shows under the chat and goes with it. A chat that ran in a folder inside its project has its conversation moved to the project's history, where the ticket's Claude runs.
- **Tickets**: Claude at the root plus a worktree per repo it touches, all on one branch. Worktrees are found from git itself, wherever they live, and filed under the ticket their branch names (`bug/abc-123-…` → ABC-123), the ticket that was started with that branch, or the ticket whose Claude reported making it. One filed under the wrong ticket can be moved with *Move to ticket…*.

Works in VSCodium, Cursor and VS Code, **on macOS**. Other systems aren't supported yet.

## Requirements

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) (`claude` on your PATH): each chat and ticket runs one in an editor terminal.
- `git`.
- Optional: [`gh`](https://cli.github.com), signed in, for PR, review and CI status. Without it, the PR rows say *No PR*. When it can't reach GitHub (signed out, offline, rate limited), a PR keeps its last status, marked *not up to date*, and one not seen yet says *PR status unavailable*. A check that ran more than once counts by its latest run, so a run that a newer one cancelled doesn't fail CI.
- Optional: `git gtr` creates and removes worktrees when it's installed; without it, worktrees go next to the repo as `<repo>.worktrees/<branch>`.
- Optional: [SwiftBar](https://swiftbar.app), for the menu bar.

## Settings

| Setting | |
| --- | --- |
| `hangar.root` | The root folder: a repo, a folder of repos, or a meta-repo. Empty: the window's first folder. |
| `hangar.roots` | More projects besides the root. Projects added with *Add project…* are kept separately. |
| `hangar.showOnStartup` | Show Hangar when the Hangar window opens. |
| `hangar.menuBar` | Show Hangar in the Mac menu bar (off by default; needs SwiftBar). |

## Agent status

On first start Hangar asks to add Claude Code hooks to `~/.claude/settings.json` (*Turn on agent status* asks again later). They run `agent-hook.js`, which only acts for Claudes Hangar started (those have `HANGAR_TICKET` set) and records working, waiting on you (a permission or a question; not Claude's idle reminder), idle or stopped, with the session ID so a stopped one resumes. Once they're on, Hangar keeps them pointing at the current Node and hook script without asking again; your other hooks are left as they are.

## Menu bar

Off by default. With `hangar.menuBar` on and [SwiftBar](https://swiftbar.app) installed (open it once to choose its plugin folder), Hangar puts `hangar.5s.js` in SwiftBar's plugin folder and keeps it up to date; turning the setting off takes it out again. The script runs with the Node the editor found, since SwiftBar's PATH has neither nvm nor Homebrew.

The menu bar shows Hangar's icon, how many Claudes are waiting on you or working, and failing CI. The menu lists every chat and ticket by what its Claude is doing, with each ticket's PRs; clicking one opens it in the Hangar window of the editor it runs in. It reads `~/.cache/hangar/status.json`, which the Hangar window writes every 10 seconds, and the hooks' files; when the window is closed, everything shows as not running.

## Links

`<scheme>://panopticonism.hangar/open?ticket=…` opens a chat or ticket in the Hangar window, `…/diff?ticket=…` shows a ticket's changes, and `…/added?ticket=…&branch=…` files a branch under a ticket: Claude uses the last two to show you its work and report the worktrees it makes, and the menu bar the first. Since any web page or app can open such a link, Hangar's own links carry a key kept in `~/.local/share/hangar/link-key` (readable only by you); a link without it asks before it switches the window or starts a Claude, and an `added` link without it is ignored. The commands Claude is given read the key from that file, so it's in neither its prompt nor its transcript. A link to open or show something that waited more than five minutes for a Hangar window is dropped.

## What Claude is told

Each Claude starts with a short note on its chat or ticket, appended to its system prompt. The names and paths in it come from git and the file system, which whoever made a repo you cloned controls, so they're given as a JSON block marked as data and never written into the instructions; commands it's told to run use placeholders it fills in, shell-quoted.

## What it touches outside the editor

| Where | What |
| --- | --- |
| `~/.claude/settings.json` | The agent status hooks, after you say yes. |
| `~/.cache/hangar/chats/<id>.json` | One per chat: `id`, `title`, `root` (the project it's listed under), `cwd` (where its Claude runs, if not `root`), `session` (the conversation to resume), `at`. |
| `~/.cache/hangar/drafts/` | Tickets that have no worktrees yet, and the branches a ticket or chat holds that don't carry its name. |
| `~/.cache/hangar/agents/` | What each Claude is doing, written by the hook. |
| `~/.cache/hangar/requests/` | Links (`<scheme>://panopticonism.hangar/{open,diff}?ticket=…`) handed to the Hangar window. |
| `~/.cache/hangar/prompts/` | What each Claude is told when it starts. |
| `~/.cache/hangar/status.json` | What the menu bar shows (only with `hangar.menuBar` on). |
| `~/.local/share/hangar/` | The Hangar window's workspace file, the hook script, the menu bar icon and `link-key` (see Links). |
| `~/.claude/projects/` | Read for each conversation's title; a chat's conversation is moved within it when the chat becomes a ticket. |
| SwiftBar's plugin folder | `hangar.5s.js` (only with `hangar.menuBar` on). |
| Your repos | Worktrees, created and removed only when you ask (*Add repo to ticket…*, *Remove merged worktree*) or by Claude for its ticket. |

It sends nothing anywhere itself: network access is `git fetch` and `gh`, with your own credentials.

## Credits

The menu bar draws the chat and ticket icons from [Codicons](https://github.com/microsoft/vscode-codicons) by Microsoft, licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
