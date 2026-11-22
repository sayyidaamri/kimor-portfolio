# KIMOR© — portfolio clone (native HTML)

Rebuild of the **look and behaviour** of huyml.co as an original site for a fictional designer,
**Kian Moraes / KIMOR©** (Lisbon). Plain HTML + CSS + vanilla JS, no framework, no server needed.

## Run
Open `index.html` in a browser (double-click works — everything is relative and local).
Optional local server (nicer for audio/clipboard): `npx serve .` or `python -m http.server`.

## Structure
```
index.html              Work (home): intro, 3D card path, project list, counter, swatches
about.html              About: facts, 19/93, live portrait, lists, "Process & Approach" modal
playground.html         Playground: 4 parallax columns, lightbox
project/<slug>.html     19 project pages (info, gallery, minimap, lightbox, next project)
assets/css/style.css    all styles (tokens at the top)
assets/js/main.js       shared: page transitions, header, clock, audio, email copy, modals, lightbox, mobile menu
assets/js/home.js | about.js | project.js | playground.js
assets/img/projects/    AI-generated project images (<slug>-1…6.jpg, 6 per project)
assets/img/about/       AI-generated About assets: ico-*.png (9 objects) + ph-*.jpg (9 story photos)
assets/img/av-*.png     About avatar layers (head + hair lid, original character)
assets/img/logo-head.png header logo + Credits avatar (black PNG; inverted via CSS filter)
assets/img/pusher-strip.png  intro push-walk sprite, 8 frames in a row (516x584 each), animated with CSS steps()
assets/media/           Mixkit video (reel-a…d) + ambient music + sound effects (sfx-a, sfx-b)
assets/fonts/           Belleza, Inter Tight (Google Fonts, OFL) — self-hosted
```
This folder is the built site only. The generator (`tools/content.mjs`, `tools/build.mjs`), research docs and
`clone-kit/` are not part of it, so the HTML, CSS and JS are edited directly.

## Editing copy
Edit the HTML files directly (brand, socials, credits, project and about text live in `index.html`, `about.html`,
`playground.html` and `project/*.html`). Keep shared elements (header, contact modal) identical across pages.
Project images: use files in `assets/img`.

## States & interactions included
- First-visit intro (character pushes the black curtain, name reveal, curtain lifts, cards fly in) — once per session
- Page transitions: black panel rises with the destination title, then drops to reveal the new page
- Home: wheel / swipe / arrow keys move an infinite 3D card path; list, details, swatches and counter follow (blur swap); click a list item to jump, click the active card to open the project
- Header: menu hover blurs the other items, active arrow, logo alternates wordmark/portrait, logo hover tint,
  live Lisbon clock, Audio Off/On (ambient loop + hover/click sounds, remembered), "For inquiries → Click to copy → Copied"
- Modals: Contact (two tilted cards: Come say hi + Credits), Showreel video, Lightbox (Previous/Next, arrows, swipe, Esc), Process & Approach (frosted card, About page)
- About "inside my head": hover the portrait for a tooltip; click it and the hair lifts off, 9 objects pop out
  (awards, vinyl, cameras, coffee, partner, surfing, chess, guitar, workspace) and float; click one for its photo + story card;
  click the head again (or Esc) to close. Items and stories are defined in `about.html` / `assets/js/about.js`
- Project: fixed info column, screen gallery with parallax, thumbnail minimap + viewport frame (click to jump), pull past the end (or click) for the next project
- Mobile: burger → X, full-screen menu, stacked layouts, swipe gallery
- `prefers-reduced-motion` respected

## Placeholders to replace
Brand/name/email/city in the HTML; all project names, clients, awards ("Pixel Guild", "Webform Awards",
"Motion Index", "Folio" are invented), people in credits, social URLs (point to platform home pages),
"Visit site" URLs (`https://example.com`), the illustrations (simple original SVGs inline in the HTML).

## Asset credits
Images: generated with Google Flow (Nano Banana). Video: Mixkit (#1610 showreel, #4883, #34487, #50822). Music: Mixkit #443.
SFX: Mixkit #2568, #1114. Fonts: Belleza, Inter Tight (SIL OFL).
