# Moors pages & styles

Moors uses **Tailwind utility classes in components** plus one global stylesheet. There are almost no page-specific CSS files — customize look-and-feel mainly in `globals.css` and Tailwind classes on the components listed below.

## Global styles

| File | Role |
|------|------|
| `src/app/globals.css` | Site-wide defaults: body, links, buttons, inputs, badge marquee animation |
| `tailwind.config.ts` | Tailwind content paths and theme extensions |
| `src/app/layout.tsx` | Root shell: fonts/container, `<Header />`, page content, `<Footer />` |

## App routes (`src/app/**/page.tsx`)

| Route | Page file | Primary UI components | Notes |
|-------|-----------|----------------------|-------|
| `/` | `src/app/page.tsx` | `ForumShell`, `Sidebar` | Board index |
| `/login` | `src/app/login/page.tsx` | `AuthForm` | Auth |
| `/signup` | `src/app/signup/page.tsx` | `AuthForm` | Auth |
| `/profile` | `src/app/profile/page.tsx` | `ProfileSettingsForm`, `AccessRequestForm`, `Username` | Settings |
| `/u/[username]` | `src/app/u/[username]/page.tsx` | `ForumShell`, `BadgeMarquee`, `Username` | Public profile |
| `/boards/[slug]` | `src/app/boards/[slug]/page.tsx` | `ForumShell`, thread list, `Username`, `VoteButtons` | Board |
| `/boards/[slug]/[subSlug]` | `src/app/boards/[slug]/[subSlug]/page.tsx` | Same as board | Sub-board (incl. Site updates) |
| `/threads/new` | `src/app/threads/new/page.tsx` | `NewThreadForm` | Create thread |
| `/threads/[id]` | `src/app/threads/[id]/page.tsx` | `ForumShell`, `ThreadDiscussion`, `ThreadActions`, `VoteButtons` | Thread + replies |
| `/announcements/[id]` | `src/app/announcements/[id]/page.tsx` | `VoteButtons` | Admin announcement (no replies) |
| `/admin` | `src/app/admin/page.tsx` | `AdminNav`, tab panels, `AdminBadges`, `AdminSubBoards`, `AdminAnnouncements` | Staff tools |
| `/terms` | `src/app/terms/page.tsx` | Markdown-ish prose in page | Terms of Service |
| `/staff-guide` | `src/app/staff-guide/page.tsx` | Prose | Admin / mod how-to (staff only) |

## Shared layout chrome

| Component | File | Styled areas |
|-----------|------|--------------|
| Header | `src/components/Header.tsx` | Logo, board nav, auth links |
| Footer | `src/components/Footer.tsx` | Legal / board links |
| Sidebar | `src/components/Sidebar.tsx` | Popular threads, announcements, OP details |
| Forum shell | `src/components/ForumShell.tsx` | Two-column grid (content + sidebar) |

## Feature components (most visual customization)

| Component | File |
|-----------|------|
| Username / Admin / Mod badges | `Username.tsx`, `AdminBadge.tsx`, `ModBadge.tsx` |
| Avatar | `Avatar.tsx` |
| Votes | `VoteButtons.tsx` |
| Thread / post actions | `ThreadActions.tsx`, `PostActions.tsx`, `ThreadDiscussion.tsx` |
| Forms | `AuthForm.tsx`, `NewThreadForm.tsx`, `ReplyForm.tsx`, `ProfileSettingsForm.tsx`, `AccessRequestForm.tsx` |
| Admin | `AdminNav.tsx`, `AdminBadges.tsx`, `AdminSubBoards.tsx`, `AdminAnnouncements.tsx` |
| Badges UI | `BadgeIcon.tsx`, `BadgeMarquee.tsx` |
| Misc | `AdultGate.tsx`, `Pagination.tsx`, `PostImage.tsx`, `UserScore.tsx` |

## How to customize CSS

1. **Site-wide colors / defaults** — edit `src/app/globals.css` (`body`, `a`, `button`, etc.).
2. **Spacing / layout shell** — `layout.tsx` container + `ForumShell.tsx` grid classes.
3. **One page only** — add a wrapper class on that page’s `<main>` and target it from `globals.css`, or add Tailwind classes directly on the page.
4. **Theme tokens** — extend `theme.extend` in `tailwind.config.ts`, then use those utilities in components.

There is no CSS Modules / Sass layer in this repo today.
