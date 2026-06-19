# Legal (Terms & Privacy)

Source: `src/app/features/legal/` (`TermsPage`, `PrivacyPage`) and the shared
`src/app/shared/legal-page/` (`LegalPage`)

## Purpose

Static legal/policy pages — the Terms of Service and Privacy Policy. They share a
single chrome component so the two pages stay visually and structurally
consistent while only their prose differs.

## Routes & screens

| Route | Component | Guard | Notes |
| ----- | --------- | ----- | ----- |
| `/terms` | `TermsPage` | Public | Terms of Service |
| `/privacy` | `PrivacyPage` | Public | Privacy Policy |

## Workflow

1. A visitor opens `/terms` or `/privacy` (typically from the footer).
2. The page projects its prose into the shared `LegalPage`, which wraps it in a
   navbar, centered header (heading + "Last Updated"), a card, a "Back to Home"
   link, and the footer.

## Dependencies

- **Shared component:** `LegalPage` (`shared/legal-page/legal-page.ts`).
- **Layout (via `LegalPage`):** `Navbar`, `Footer`, `RouterLink`.
- **Services / models:** none — both pages are static content.

## Business logic

Both `TermsPage` and `PrivacyPage` are empty standalone components
(`export class TermsPage {}` / `PrivacyPage {}`); all content lives in their
templates, which use the `<app-legal-page>` element with `<ng-content>`.

`LegalPage` exposes two required inputs:

- `@Input({ required: true }) heading: string` — page title.
- `@Input({ required: true }) lastUpdated: string` — the "Last Updated" date.

It renders `<app-navbar [lightBg]="true">`, the header, a card containing the
projected `<ng-content>`, a "Back to Home" button (`routerLink="/"`), and
`<app-footer>`.

## Notes / future work

- Policy text is hard-coded in the page templates; a CMS or markdown source could
  make legal updates non-code changes.
- New policy pages (e.g. Cookie Policy) can reuse `LegalPage` by projecting
  content and supplying `heading` / `lastUpdated`.
