# How to edit this wiki

Every page is a simple text file in the `docs` folder. Open one in any text editor (TextEdit works; VS Code is nicer).

## Making a link to another page

```
[[ProPresenter]]                 links to the ProPresenter page
[[stream-keys|Stream keys]]      links to stream-keys, but shows the words "Stream keys"
```

Links to pages that don't exist yet show up in <a class="wikilink missing">red</a>. Click one to see how to create it.

## Adding an "Open app" button

```
[[open:propresenter]]
[[open:streamlabs]]
```

Apps the wiki is allowed to open are listed in `config/apps.json`.

## Linking a checklist

```
[[checklist:thursday]]
[[checklist:sunday]]
```

## Adding a screenshot

1. On the MacBook, press **Shift + Command + 4** and drag over the part of the screen you want.
2. Open the screenshot in **Preview**, click the **Markup** button (pen icon), and add arrows and boxes.
3. Save it in `docs/images/`, for example `docs/images/streamlabs-go-live.png`.
4. Add it to a page:

```
![The Go Live button](/docs/images/streamlabs-go-live.png)
```

## Adding a video

1. Press **Shift + Command + 5** and choose **Record Selected Portion**.
2. Save the video in `docs/videos/` as `.mov` or `.mp4`.
3. Add it to a page:

```
<video controls src="/docs/videos/going-live.mov"></video>
```

## Changing the checklists

The checklist items are in `data/checklists.json`. Each item has a title, details, which wiki page explains it, and which app it opens. Copy an existing item to make a new one.

## Adding a new page

Make a new file in `docs/`, for example `docs/sound-board.md`, and start it with a title line:

```
# Sound board
```

Then add it to the sidebar in `docs/_sidebar.md`.
