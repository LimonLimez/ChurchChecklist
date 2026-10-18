# Plan

## Goal

One place where a new media volunteer can learn everything and follow a checklist, so nothing is missed on Thursday or Sunday. Later, hand the repeatable items to automation or AI.

## Phase 1: Foundation (done in this first version)

- [x] Local wiki site with Wikipedia-style `[[links]]`, sidebar, search, and info boxes
- [x] Thursday Prep and Sunday Service checklists with checkboxes, names, times, and notes, saved per date
- [x] "Open app" buttons for ProPresenter, Streamlabs, and Chrome (MacBook only)
- [x] Starter pages: ProPresenter, Streamlabs, YouTube, Facebook, stream keys, going live, lyrics, sermon slides, announcements, MacBook, troubleshooting, glossary
- [x] Every checklist item tagged as *person*, *AI could help*, or *could automate*

## Phase 2: Fill in the real details (needs the media director, on the MacBook)

- [ ] Walk through every checklist item and fix anything that doesn't match how we actually do it
- [ ] Answer: does "verify keys" mean song keys, stream keys, or both?
- [ ] Fill in every **To fill in** box (scene names, who sends slides and when, contacts)
- [ ] Take screenshots with arrows (Preview → Markup) for every **Screenshot needed** box
- [ ] Record short screen videos (Shift + Command + 5) for every **Video needed** box
- [ ] Confirm the app names in `config/apps.json` match what's in `/Applications` on the MacBook
- [ ] Put a `Start Wiki` shortcut on the MacBook desktop (optional: start it automatically at login)

## Phase 3: Guided walkthroughs

- [ ] "Guide me" mode: one checklist item at a time, full screen, with its screenshot/video and a big Next button
- [ ] Training mode for new volunteers: a practice run of the checklist that doesn't count as the real one
- [ ] History page: past Thursdays/Sundays, what was missed, and the notes people left

## Phase 4: Automation and AI (items tagged *could automate* / *AI could help*)

Start with the safest, most repetitive items:

- [ ] **Open everything at once:** one "Start Sunday" button that opens ProPresenter, Streamlabs, and Chrome
- [ ] **Stream titles:** generate the YouTube/Facebook title and description from the sermon title, speaker, and date
- [ ] **Check we're live:** use the YouTube and Facebook APIs to confirm the stream is live and the video saved afterward
- [ ] **Internet check:** test the connection speed before service
- [ ] **ProPresenter checks:** ProPresenter 7 has a network API; use it to confirm today's playlist exists and has all the items
- [ ] **Lyrics help:** AI checks lyrics for typos and line breaks and compares the arrangement with the set list

Automation should fill in or check an item, and a person still confirms it.
