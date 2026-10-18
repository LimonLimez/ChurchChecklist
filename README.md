# Glad Tidings Media Team Wiki

A local training wiki and checklist site for the Glad Tidings Church (Anderson, IN) media team. It runs on the church MacBook.

- **Wiki pages** that work like Wikipedia: click a word like *ProPresenter* and it takes you to that page.
- **Thursday Prep** and **Sunday Service** checklists. Every check is saved with who did it and when.
- **"Open ProPresenter" / "Open Streamlabs" buttons** that open the app on the MacBook.

## Running it on the MacBook

1. Install **Node.js** (LTS) from https://nodejs.org. You only need to do this once.
2. Double-click **`Start Wiki.command`**. The first time, macOS may block it: right-click it, choose **Open**, then click **Open** again.
3. The wiki opens at http://localhost:4321. Leave the Terminal window open while you use it.

To preview on a Windows PC, double-click `Start Wiki (Windows).bat`. Everything works there except the Open-app buttons.

## Where things are

| Path | What it is |
|------|-----------|
| `docs/*.md` | Wiki pages (plain text, Markdown). `docs/_sidebar.md` is the left menu. |
| `docs/images/`, `docs/videos/` | Screenshots and screen recordings |
| `data/checklists.json` | **The master list of every Thursday and Sunday task** |
| `data/runs/` | Saved checklist progress, one file per day (created automatically, not in git) |
| `config/apps.json` | Apps the Open buttons are allowed to launch |
| `server.js` | The small local server (no installs needed beyond Node) |
| `public/` | The website itself |

See `docs/how-to-edit.md` (or "How to edit this wiki" in the sidebar) for writing pages, adding screenshots, and changing checklists. See [PLAN.md](PLAN.md) for the roadmap.

## Safety

The server only listens on the MacBook itself (`127.0.0.1`), so nobody else on the network can reach it. It only opens apps listed in `config/apps.json`. Never put passwords or stream keys in the wiki.
