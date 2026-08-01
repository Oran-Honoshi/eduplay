Handoff: EduPlay Redesign (K–6 education app)

## Overview
Full visual/UX redesign of EduPlay, a family education app with a Parent portal (usage oversight, worksheets, AI question generation, curriculum browsing) and a Kid portal (lessons, rewards, theme skins). Goals: professional/trustworthy for parents, playful/engaging for kids, full RTL (Hebrew) support, simplified data density, no emoji (custom icon set instead).

## About the Design Files
The bundled file is a **design reference built in HTML** (a single interactive prototype, `EduPlay Redesign.dc.html`) — not production code to copy verbatim. It demonstrates exact layout, spacing, color, typography, and interaction states. The task is to **recreate this design in the target codebase's existing stack** (React Native / React web / Vue / native — whatever EduPlay already runs on) using its own component patterns, data layer, and auth — not to embed this HTML as-is. If no frontend stack exists yet, React is the natural fit given the component structure below.

## Fidelity
**High-fidelity.** All colors, spacing, type sizes, and copy in the file are final values, not placeholders. Icons are hand-drawn inline SVGs standing in for the final custom icon set (see Assets/Open Items). Implement pixel-close to what's shown; ask if a value looks like it needs polish.

Open the file directly in a browser to interact with it: top preview bar toggles Parent/Kid view, language (EN / Hebrew RTL / Bilingual), and (in Kid view) jumps between Login/Home/Lesson/Theme/Rewards screens.

## Screens / Views

### Global chrome (Parent)
- Top bar, 64px tall, white bg, bottom border `rgba(15,118,110,.14)`. Logo: 32×32 teal (`#0F766E`) rounded-square icon + "EduPlay" wordmark (Manrope 800 17px, "Play" in `#0F766E`).
- Horizontally-scrolling nav (flex, no wrap, `overflow-x:auto`) with 8 tabs: Overview, Progress, Worksheets, AI Questions, Assignments, Curriculum, Parents, Account. Active tab: teal bg `#0F766E`, white text, 8px radius. Inactive: transparent bg, `#1f2a28` text. Each tab has a 15×15 inline stroke icon (no fills except AI's star).
- Right side: "252 days left" pill (subscription countdown, teal border) + 32px circular avatar (teal bg, white initial).
- Left sidebar, 216px fixed, white bg, right border. "Family" section lists each child (avatar circle with initial, name, grade, small ring-progress SVG showing % complete). Below: an upsell card (rounded, `#F7F5F0` bg, teal border) — "Unlimited worksheets & 5 children" + Upgrade button.

### Parent · Overview tab
- Greeting header ("Good morning, {name}") + Refresh / Worksheet Builder buttons.
- 4-column stat strip (`grid-template-columns:repeat(4,1fr)`, gap 12px) — fixed 4 columns, never reflows: Total XP, Active Streaks, Lessons Done, Downloads. Each: 36px icon-in-rounded-square + big number (Manrope 800 18px) + uppercase label (10.5px, `#9aa6a3`).
- Per-child summary cards (flex row, wraps at min 230px): avatar + name/grade/XP, a 56px ring-progress SVG (%, teal stroke) + inline mini progress bars per subject, "Continue Lesson" outlined button.

### Parent · Progress tab
- Per-child white card: header row (avatar, name, streak) + Start Lesson button. Table-like grid rows (`grid-template-columns:2fr 1fr 1.4fr`): topic name, status pill (Done = green/teal `#E4F3F1`/`#3F8E7F`; In Progress = purple `#EFE9FA`/`#7C6BAE`), progress bar + %.

### Parent · Worksheets tab
- Info banner (purple, `#EFE9FA` bg) about curriculum alignment.
- Per-child "Build Worksheet" quick-launch cards.
- Builder form (2/3 width): Step 1 Select Child (segmented pills), Step 2 Select Topics (checklist rows, teal border+bg when selected, XP shown per topic), Step 3 Options (Worksheet Type: Practice/Quiz/Exam; Difficulty: Easy/Medium/Mixed pills; Language: EN/Both/HE).
- Sticky summary sidebar (1/3 width): key-value list + "Generate Worksheet" primary button.

### Parent · AI Questions tab
- Sub-nav: Generate / Pending Review (badge count) / Library.
- "Preferred style" input + Save.
- Generate form: Subject/Grade/Topic/Difficulty as bordered select-like boxes (2×2 grid), checkboxes for question type (Multiple Choice / Word Problem / Progressive difficulty), dashed upload dropzone (optional worksheet photo/PDF), Generate button.
- Right rail: "Recent Generations" list (title, meta line, "Make more like this" button).

### Parent · Assignments tab
- One card per child. Empty state: centered gray "No assignments yet." Populated state: bordered sub-card with title, date + completion %, colored check-count badge, and action buttons (Retry with [child], Assign to a different child).

### Parent · Curriculum tab
- Left rail (220px): "Learning as" child switcher, Subject list (Math/English/Hebrew), Grade list (K–6, active highlighted).
- Main: teal gradient header card (grade+subject, topic count, Start button) + 2-col grid of topic cards (number, title, description, XP+lesson count).

### Parent · Parents tab
- Header + "+ Add Parent" button. List of parent accounts: avatar, name + role badge (Admin filled teal / Parent outlined), email, password field + Update button, Remove button (non-admin only).

### Parent · Account tab
- "Manage Children" table: grade, theme, break-mode (Free Choice/Per Topic), masked PIN, per row.
- "Child Links" list: shareable per-child portal URLs with Copy/Open buttons.

### Kid · top chrome
- 60px header, white, bottom border. Logo left. Right: XP pill (amber `#FFF3D6`/`#B7862F`), streak-days pill (peach `#FFE3D9`/`#B45435`), 30px avatar circle.
- **New for this handoff**: an in-app nav bar directly under the header (visible on every kid screen except Login) — 3 pill buttons: Home, Assignments (disabled/greyed, "Coming soon" tooltip — screen not yet designed), Rewards. Active pill: teal bg/white text.

### Kid · Login
- Centered white card (380px). Pip mascot image (64×64) at top. "Who's playing?" heading. Row of child avatar circles (selected child has teal ring). PIN dot indicators (2 filled of 4) + numeric keypad (1–9 grid, `#F7F5F0` bg tiles).

### Kid · Home (redesigned this round — "booklet" pattern)
- Continue-lesson banner (teal/lavender gradient) + Continue button.
- 4-stat strip (Completed / In Progress / Total XP / Streak) — same visual language as parent stat cards but kid-friendly icons.
- Subject filter pills (All Subjects / Mathematics / English / Hebrew) — teal when active.
- **Booklet lesson viewer** replacing the old "show all lessons in a grid" pattern (was overwhelming): one lesson card shown at a time (max-width 360px, white, 20px radius, soft shadow), with a 64px subject icon, subject label, lesson title (Baloo 2, 17px), XP value, and a full-width "Start Lesson" button. Left/right circular arrow buttons (36px, white, shadow) sit either side of the card. The card also responds to drag/swipe (`onMouseDown`/`onMouseUp` and `onTouchStart`/`onTouchEnd`, threshold 40px) — swipe left = next, right = previous. Below the card: a dot pager (active dot wider/teal, inactive dots small/beige) that also lets you jump directly to a lesson. Changing the subject filter resets to page 0.
- Rationale: showing every subject/topic at once could freeze less-confident kids from starting; the one-at-a-time flip pattern turns lesson choice into a low-stakes book-flip rather than a wall of options.

### Kid · Rewards ("Animal Collection") — new screen
- Header: title + collected/total count + region-complete count, plus a total-cards pill badge (amber).
- Stylized world map (dark navy canvas, 280px tall): 6 blob-shaped region hotspots positioned by top/left % (Africa, Asia, North America, South America, Europe, Oceania), color-coded — gold/glowing = fully collected, teal-glow = currently selected, dark slate = untouched. Click a region to select it.
- Horizontally-scrolling region filter pills mirroring the map (label + collected/total count), teal when active.
- Selected-region info bar: icon, region name (Baloo 2), description line, collected/total count right-aligned.
- Animal card grid (`auto-fill, minmax(150px,1fr)`, gap 14px): each card has an image slot (drag-and-drop placeholder — see Assets) at ~35% opacity when locked / full opacity + teal checkmark badge when collected, animal name, and location caption. Currently only the Africa region is seeded with 6 real collected animals (Lion, Elephant, Cheetah, Mountain Gorilla, Flamingo, Nile Crocodile); all other regions render 6 locked "Mystery Animal" placeholders — this reflects a work-in-progress content model, not a final design decision.
- **Open item**: the map SVG/blob shapes are a placeholder abstraction of continents (not geographically accurate), meant to communicate the pattern; commission real map art/illustration before shipping.

### Kid · Lesson player
- Back button (chevron flips horizontally in RTL — see Interactions) + top progress bar.
- "Learn This" concept card (icon, worked example, explanation).
- "Practice Question" card: 2×2 multiple-choice grid (A–D), selected answer highlighted teal; Hint button (amber outline) + audio/read-aloud icon button; Next button (teal, primary).
- Right rail: Pip mascot card ("Pip says" encouragement bubble), subject-icon switcher (Math/English/Hebrew — Hebrew rendered as an "א" glyph placeholder), current-subject topic list with XP values.

### Kid · Theme picker — refined this round (Classic, Minecraft, Princesses, + new Sports)
- Heading + subcopy. 3-column grid of theme swatch cards (Minecraft, Princesses, Classic, Sports, plus 2 greyed "Adventure"/"Space · Soon" placeholders) — clicking a card selects it (teal border) and drives a **live preview panel** below showing the kid Home layout re-skinned with that theme's tokens (see Design Tokens for exact values per skin): header gradient/bg, card radius/border/shadow, accent color, font family, badge colors. "Use {Theme} Theme" primary button + "Back without changing" link at bottom.
- Sports skin: navy (`#1D3557`→`#2C4C7C` gradient) header, orange (`#F4762A`) accent, clean 10px-radius cards, Manrope throughout — a "team jersey" feel distinct from Classic's soft pastel and Minecraft's blocky dark theme.

## Interactions & Behavior
- **View toggle** (top preview bar, dev-only — not part of the shipped app): Parent view / Kid view.
- **Language switcher** (dev-only preview control): EN (ltr) / עברית (rtl) / Bilingual (rtl). Flips the whole app's `dir` attribute; a `flipStyle` transform mirrors the lesson-player back-chevron in RTL so it still points "backward" visually.
- **Kid nav bar**: Home and Rewards navigate; Assignments is disabled (grey, non-interactive, "Coming soon" title tooltip) pending a dedicated kid assignments screen — flag this to the user/PM, it's an intentional stub, not a bug.
- **Booklet swipe**: pointer-down records X position; pointer-up computes delta; >40px right-drag = previous lesson, >40px left-drag = next lesson (mouse and touch both supported). Arrow buttons and dots perform the same navigation without requiring a gesture.
- **Theme picker**: clicking a swatch immediately re-renders the live preview panel with that theme's full token set — no page reload, so a developer can diff exact before/after styling per theme.
- **Rewards region select**: clicking a map hotspot or a filter pill sets the same selection state and updates the info bar + animal grid together.
- No modal patterns are included in this handoff — out of scope for this round (still open per the project's task list).

## State Management (as modeled in the prototype — translate to your app's state layer)
- `view`: 'parent' | 'kid'
- `parentTab`: one of the 8 parent tab keys
- `kidScreen`: 'login' | 'home' | 'lesson' | 'theme' | 'rewards'
- `lang`: 'en' | 'he' | 'bi' (drives `dir`)
- `themePreview`: 'classic' | 'minecraft' | 'princesses' | 'sports' (the kid's currently-applied theme in production; only used for live-preview switching here)
- `rewardsRegion`: currently selected map region key
- `kidSubject`: 'all' | 'Mathematics' | 'English' | 'Hebrew' (Home booklet filter)
- `kidPage`: index into the filtered lesson list for the booklet viewer
- Real app will need: per-child auth/session, lesson/topic completion + XP records, per-region animal-collection unlock state (currently only Africa is "unlocked" as sample data — the other 5 regions need real unlock rules), assignment records (parent + kid views), worksheet generation requests, AI question generation + review queue.

## Design Tokens

### Colors (Classic / default palette)
- Teal primary: `#0F766E` (buttons, active states, links) — hover `#0B5C56`
- Teal-light bg: `#E4F3F1`; header gradient teal: `#BFE8DE`
- Lavender/purple accent: `#7C6BAE`, `#EFE9FA`, header gradient lavender `#DCD3F5`
- Amber/gold (XP, achievements): `#E0A927`, bg `#FFF3D6`, dark text `#B7862F`
- Peach/coral (streaks): `#E8724C`, bg `#FFE3D9`, dark text `#B45435`
- Neutral bg: `#F7F5F0` (page), `#fff` (cards)
- Text: `#1f2a28` (primary), `#7a8f8b` / `#9aa6a3` (secondary/meta)
- Borders/dividers: `rgba(15,118,110,.14)`, `#f0efe9`, `#eee`

### Theme-skin tokens (Kid app skins)
Each skin defines: `pageBg`, `panelBg`, `radius`, `border`, `shadow`, `headerBg`, `headerText`, `headerSub`, `textColor`, `accent`, `accentText`, `font`, `chipBg`, `badge1/2/3`.
- **Classic**: pageBg `#F7F5F0`, radius 14px, no border/shadow, header gradient `#BFE8DE→#DCD3F5`, accent `#0F766E`, font Baloo 2.
- **Minecraft**: pageBg `#20304a`, panel `#33465f`, radius 2px, 3px solid `#101a2c` border, hard drop-shadow `3px 3px 0 #101a2c`, header `#1B2340`, header text lime `#C6FF3D`, accent `#9BE23D`, font Courier New (monospace/blocky feel).
- **Princesses**: pageBg `#FDEFF6`, radius 22px, soft pink border `#F7C6E0`, header gradient `#FFD1DC→#DCD3F5`, accent/text `#C2637A`/`#7C4159`, font Baloo 2.
- **Sports** (new): pageBg `#EAF2FB`, radius 10px, soft shadow (no border), header gradient navy `#1D3557→#2C4C7C`, header text white, body text `#1D3557`, accent orange `#F4762A`, font Manrope.

### Typography
- Headings/playful UI: **Baloo 2** (600/700) — kid screens, section titles.
- Body/UI: **Manrope** (500/600/700/800) — parent portal, most labels/buttons.
- Display alt (loaded, currently unused directly): **Fredoka**.
- Sizes in use: 22px/800 (page titles), 17-20px/700 (card headings), 12.5-14px/600-700 (body/buttons), 10-11px/700 uppercase tracked (eyebrow labels).

### Spacing / radius
- Card radius: 12–20px depending on context (theme skins override this — see above).
- Standard card padding: 14–20px.
- Grid gaps: 8–16px depending on density.

## Assets
- `assets/pip-mascot.png` — Pip, the app's owl mascot. Flat vector, rounded shapes, warm cream/tan body, teal (`#0F766E`) chest patch, orange beak, generated via AI image tool from a supplied prompt. Used at 64×64 (kid login) and 46×46 (lesson player "Pip says" card). **This is a placeholder-quality asset** — recommend the final mascot be redrawn/vectorized by a designer (or the same prompt re-run) for crisp scaling across all sizes, plus additional poses/expressions (celebrating, thinking, sad) for other app states.
- Inline SVG icons throughout — hand-drawn stand-ins for a **planned custom icon set**; all emoji have been removed from the product per this redesign's direction. Do not reintroduce emoji when implementing.
- Animal photos in the Rewards grid use `<image-slot>` drag-and-drop placeholders (a dev-only prototyping affordance) — real animal photography/illustration needs to be sourced per animal before ship.

## Open Items (flagged, not yet designed)
- Modal patterns (confirmations, celebrations, errors) used throughout the app.
- Kid Assignments screen (nav entry exists and is intentionally disabled).
- Real world-map artwork for Rewards (current shapes are abstract placeholders).
- Animal photography/illustration for all regions besides the 6 Africa samples.
- Final mascot asset set (multiple poses/expressions) beyond the single static Pip image included here.

## Files
- `EduPlay Redesign.dc.html` — the full interactive prototype (single file). Open in any browser; use the top preview bar to switch Parent/Kid view, language, and kid sub-screens.
- `assets/pip-mascot.png` — mascot image referenced by the prototype.
