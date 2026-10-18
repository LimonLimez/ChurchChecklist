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

## Sharing it online

The wiki is also published as a plain website on GitHub Pages, so you can send volunteers a link: https://limonlimez.github.io/ChurchChecklist/

- It updates by itself a minute or two after any change is pushed to GitHub.
- In the online copy, checkmarks are saved in the visitor's own browser, and the Open buttons say they only work on the MacBook. Everything else is the same.
- To build the online copy on your own computer, run `node scripts/build-static.js`. It writes a `site/` folder you can open or upload anywhere.
- First-time setup (once): on GitHub, go to the repo's **Settings > Pages** and set **Source** to **GitHub Actions**.

## Where things are

| Path | What it is |
|------|-----------|
| `docs/*.md` | Wiki pages (plain text, Markdown). `docs/_sidebar.md` is the left menu. |
| `docs/images/`, `docs/videos/` | Screenshots and screen recordings |
| `data/checklists.json` | **The master list of every Thursday and Sunday task** |
| `data/runs/` | Saved checklist progress, one file per day (created automatically, not in git) |
| `config/apps.json` | Apps the Open buttons are allowed to launch |
| `server.js` | The small local server (no installs needed beyond Node) |
| `scripts/build-static.js` | Builds the online copy into `site/` |
| `.github/workflows/pages.yml` | Publishes the online copy to GitHub Pages |
| `public/` | The website itself |

See `docs/how-to-edit.md` (or "How to edit this wiki" in the sidebar) for writing pages, adding screenshots, and changing checklists. See [PLAN.md](PLAN.md) for the roadmap.

## Safety

The server only listens on the MacBook itself (`127.0.0.1`), so nobody else on the network can reach it. It only opens apps listed in `config/apps.json`. Never put passwords in the wiki.

## Logos

The ProPresenter, Streamlabs, YouTube, Facebook, and Chrome logos in `public/images/logos/` belong to their companies. They are used only to show which app a page or button is about. Sources: Renewed Vision's and Streamlabs' websites, and Wikimedia Commons.
