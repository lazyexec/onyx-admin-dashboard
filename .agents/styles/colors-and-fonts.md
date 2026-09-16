# Design Spec

## Font

- Family: Open Sans (single family, no secondary typeface)
- Load: Google Fonts, weights 400 / 600 / 700

## Color Tokens

```css
--text: #060608;
--background: #f5f4f7;
--primary: #777591;
--secondary: #c0b0be;
--accent: #ac97a5;
```

| Token | Hex | Role |
|---|---|---|
| text | #060608 | Headings, body copy, primary reading content |
| background | #f5f4f7 | Page and section background |
| primary | #777591 | Secondary text, icons, borders, nav links |
| secondary | #c0b0be | Structural fills — cards, dividers, disabled states |
| accent | #ac97a5 | CTAs, active states, links, focus rings — one interactive signal per view |

## Type Scale

| Level | Size | Weight | Color |
|---|---|---|---|
| H1 | 40px / 2.5rem | 700 | text |
| H2 | 32px / 2rem | 700 | text |
| H3 | 24px / 1.5rem | 600 | text |
| H4 | 20px / 1.25rem | 600 | text |
| Body | 16px / 1rem | 400 | text |
| Small / meta | 14px / 0.875rem | 400 | primary |
| Caption / helper | 12px / 0.75rem | 400 | primary @ 70% opacity |

## Usage Rules

- `text`: full-contrast content only — headings, paragraphs, input labels.
- `primary`: supportive content — timestamps, breadcrumbs, secondary nav, placeholders, icon strokes.
- `secondary`: structure, not content — card backgrounds, row stripes, dividers, disabled buttons. Do not use for text.
- `accent`: reserved for one interactive signal per view (primary button, active tab, link hover, focus outline). Never pair accent↔secondary for a state change — contrast is too low. Transition accent against `background` or `text` instead.

## Contrast Notes

- `text` on `background`: ~19:1 — safe everywhere.
- `primary` on `background`: ~4.6:1 — OK for text ≥14px, not for small captions needing AA.
- `accent` on `background`: ~3.1:1 — usable for buttons/large text only, not body-size text.

## Component Defaults

```css
.btn-primary   { background: var(--accent); color: var(--background); }
.btn-primary:hover { background: var(--text); }

.btn-secondary { background: transparent; border: 1px solid var(--primary); color: var(--text); }

.link          { color: var(--accent); }
.link:hover    { color: var(--text); }
```
