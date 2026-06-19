# About

Source: `src/app/features/about/` (`AboutPage`)

## Purpose

A static "About Us" marketing page that communicates TripMind's mission and
philosophy and introduces the team. It carries no application state or data.

## Routes & screens

| Route | Component | Guard | Notes |
| ----- | --------- | ----- | ----- |
| `/about` | `AboutPage` | Public | Static mission + team page |

## Workflow

1. A visitor opens `/about` (from the navbar/footer).
2. They read the mission and philosophy sections, then the team section.
3. The shared navbar and footer provide site-wide navigation.

## Dependencies

- **Components:** `Navbar` (`layout/navbar`), `Footer` (`layout/footer`).
- **Services / models:** none — the page is fully static.
- **Angular:** no routing directives are imported beyond the layout components.

## Business logic

`AboutPage` is an empty standalone component (`export class AboutPage {}`); all
content lives in `about.html` / `about.css`. Sections:

- **Mission / philosophy** — narrative copy about the product's purpose.
- **Team** — three team-member cards.

## Notes / future work

- The team section contains three cards, but only **Mohamed Elhosinii** is a real
  member; the other two are placeholders and should be replaced or removed.
- Content is hard-coded in the template.
