---
name: RelayDesk ITSM
description: A Turkish institutional service workspace for connected IT operations.
colors:
  primary: "#2863cf"
  background: "#f5f7fb"
  foreground: "#24334a"
  card: "#fff"
  muted-foreground: "#5b6b82"
  border: "#e0e7f0"
  input: "#d7e0ec"
  ring: "#5285d8"
  secondary: "#edf2fa"
  secondary-foreground: "#28456e"
  accent-foreground: "#203f6c"
  muted: "#f1f4f8"
  destructive: "#ba373e"
  sidebar: "#162b48"
  sidebar-text: "#c1cfe3"
  sidebar-active: "#2b4c78"
  sidebar-hover: "#203b5d"
  queue-strip: "#edf3fc"
  status-new-bg: "#edf2fb"
  status-new-text: "#4d71ad"
  status-progress-bg: "#e9f2ff"
  status-progress-text: "#2a6cbb"
  status-pending-bg: "#fff4df"
  status-pending-text: "#80581b"
  status-resolved-bg: "#e6f5ef"
  status-resolved-text: "#337c62"
  status-closed-bg: "#eff1f4"
  status-closed-text: "#5f6e82"
  sla-risk: "#855b19"
  sla-breached: "#ba434d"
typography:
  display:
    fontFamily: '"Inter Variable", Inter, system-ui, sans-serif'
    fontSize: "44px"
    fontWeight: 650
    lineHeight: 1.22
    letterSpacing: "-0.035em"
  headline:
    fontFamily: '"Inter Variable", Inter, system-ui, sans-serif'
    fontSize: "27px"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  title:
    fontFamily: '"Inter Variable", Inter, system-ui, sans-serif'
    fontSize: "14px"
    fontWeight: 650
    lineHeight: 1.55
    letterSpacing: "0em"
  body:
    fontFamily: '"Inter Variable", Inter, system-ui, sans-serif'
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "0em"
  label:
    fontFamily: '"Inter Variable", Inter, system-ui, sans-serif'
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: "0em"
  metadata:
    fontFamily: '"Inter Variable", Inter, system-ui, sans-serif'
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "0em"
  record-code:
    fontFamily: "ui-monospace, SFMono-Regular, monospace"
    fontSize: "11px"
    lineHeight: 1.5
rounded:
  sm: "5px"
  md: "8px"
  lg: "12px"
  navigation: "7px"
  pill: "9999px"
spacing:
  step-4: "4px"
  step-8: "8px"
  step-12: "12px"
  step-16: "16px"
  step-20: "20px"
  step-24: "24px"
  step-32: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.card}"
    rounded: "{rounded.md}"
    height: "36px"
    padding: "8px 16px"
  button-outline:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    height: "36px"
    padding: "8px 16px"
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.secondary-foreground}"
    rounded: "{rounded.md}"
    height: "36px"
    padding: "8px 16px"
  button-ghost:
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    height: "36px"
    padding: "8px 16px"
  input:
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    height: "36px"
    padding: "4px 12px"
  work-surface:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.lg}"
  navigation-active:
    backgroundColor: "{colors.sidebar-active}"
    textColor: "{colors.card}"
    rounded: "{rounded.navigation}"
    padding: "11px 13px"
  status-pending:
    backgroundColor: "{colors.status-pending-bg}"
    textColor: "{colors.status-pending-text}"
    rounded: "{rounded.pill}"
    padding: "4px 7px"
---

# Design System: RelayDesk ITSM

## Overview

**Creative North Star: "The Institutional Service Directory"**

An institutional service directory gives RelayDesk its visual grammar: a deep ink navigation rail, cool working ground, and white record surfaces. The Turkish interface feels calm, precise, and ready for repeated use. Information density comes from aligned columns, small supporting labels, and a restrained type hierarchy.

Blue marks actions and selection. Amber, red, and green communicate operational state alongside text and symbols. The system uses locally bundled Inter Variable for continuity across forms and records; record identifiers have a separate monospace voice. Working surfaces are built from code and SVG icons, with no decorative raster imagery.

**Key Characteristics:**

- Dense, legible records and explicit Turkish labels.
- Ink navigation, cool ground, white working surfaces.
- Semantic state colors reinforced by words and symbols.
- Quiet borders, gently rounded controls, limited elevation.

## Colors

The palette combines an ink-blue institutional frame with a cool, low-noise workspace. The frontmatter is the normative color inventory; source-specific variants remain in the application stylesheet.

### Primary

- **Service Blue** (`primary`): creation, saving, links, selection, and action emphasis.
- **Focus Blue** (`ring`): keyboard focus borders and translucent focus halos.

### Secondary

- **Quiet Blue** (`secondary`, `secondary-foreground`, `accent-foreground`): secondary actions and subtle control hover backgrounds; the accent background shares the secondary value.
- **Operational States** (`status-*`, `sla-risk`, `sla-breached`, `destructive`): pale fills with darker readable labels. New and in-progress are blue, pending is amber, resolved is green, and closed is gray. SLA urgency and destructive actions use distinct red roles.

### Neutral

- **Cool Ground** (`background`): the application canvas and default outlined-control fill.
- **Working White** (`card`): tables, knowledge cards, headers, and detail sections; also white action text.
- **Slate Ink** (`foreground`) and **Supporting Slate** (`muted-foreground`): primary reading and supporting labels.
- **Quiet Dividers** (`border`, `input`): record boundaries and control outlines.
- **Soft Ground** (`muted`): hover, selected table rows, and default tab tracks.
- **Directory Ink** (`sidebar`) with `sidebar-text`, `sidebar-hover`, and `sidebar-active`: a distinct navigation environment. Its dark blue is structural, rather than an operational state.
- **Queue Wash** (`queue-strip`): the compact queue attention strip.

**The Action Blue Rule.** Use primary blue for actionable controls, selected choices, and linked record emphasis; reserve amber, red, and green for their operational meanings.

## Typography

**Display Font:** Inter Variable, Inter, system-ui, sans-serif. The font is bundled through `@fontsource-variable/inter` in the root layout.

**Body Font:** The same local Inter family.

**Label/Mono Font:** Inter labels; `ui-monospace, SFMono-Regular, monospace` for record identifiers.

**Character:** Restrained and administrative, with weight and alignment carrying hierarchy. There is no ornamental display face. The scale is role-based rather than a constant modular ratio.

### Hierarchy

- **Display:** the frontmatter display role appears on the login introduction; it steps down to 38px and 34px before the introduction disappears on mobile.
- **Headline:** page headings use the headline role and step down to 23px at the mobile breakpoint.
- **Title:** detail-section headings use the title role. Knowledge titles use 16px at weight 650; catalog titles use 19px at weight 650.
- **Body:** the base role governs the application. Most record titles and descriptions use 13px; article text retains 14px with line-height 2 and a 72ch maximum width.
- **Label:** field labels and compact controls use 12px; controls normally use 14px. Secondary record metadata uses the metadata role.
- **Record code:** the monospace role separates identifiers from names and descriptions. Dates, SLA cells, identifiers, and ledger totals use tabular numerals.

**The Stable Record Rule.** Keep record identifiers, dates, SLA values, and ledger totals numerically stable with tabular figures; identifiers retain the monospace face.

## Layout

The desktop shell is a two-column grid with a sticky, full-height navigation rail (228px) and a flexible content region. The implemented rail differs from the provisional surface brief's 224px; the shipped 228px value governs. The header is 74px high. Main content has 32px padding and an 1800px maximum width.

At 1200px and below, the rail becomes 205px and content padding becomes 27px vertically and 22px horizontally. At 980px, global search disappears and detail layouts become one column, with detail facts in two columns. At 760px, the desktop rail gives way to mobile navigation, the header becomes 66px, main padding becomes 26px by 15px, and detail facts become a single column.

The spacing vocabulary follows a predominantly four-pixel rhythm with contextual optical adjustments. Record surfaces use compact toolbars (18px by 21px), detail sections use 25px padding, and related content groups commonly use 20px or 24px gaps. Forms use two equal columns with 20px vertical and 17px horizontal gaps, collapsing to one column with a 19px gap on mobile. Full-width fields span both desktop columns.

Tables preserve explicit data columns and horizontal overflow. Filter controls wrap; on mobile, search takes the full filter row. Knowledge cards use three columns, then two at 1200px, then one at 760px. Catalog cards use two columns and become one at 980px. The queue uses a narrow attention strip followed by status tabs, filters, records, and pagination; overview ledgers belong to the overview surface.

## Elevation & Depth

Tonal layering and fine borders define the working area. Content containers have no decorative box shadows. Controls use Tailwind's extra-small shadow, default active tabs use its small shadow, and modal dialogs use its large shadow over a half-opacity black backdrop. Line tabs remove active shadows. Keyboard focus is a three-pixel, half-opacity focus-blue ring with a matching border.

### Shadow Vocabulary

- **Control:** `0 1px 2px 0 rgb(0 0 0 / 0.05)` on inputs and outlined buttons.
- **Active default tab:** `0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)`.
- **Modal:** `0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)`.

**The Flat Work Rule.** Keep record containers flat and border-defined; use elevation for controls and modal separation rather than lifting every content block.

## Shapes

Working surfaces use the large radius; buttons and fields use the medium radius. Navigation uses its slightly tighter dedicated radius. Status badges are pills, avatars are circles, and tab counts use small 4px corners. Borders are thin and quiet. The system has no hard offset shadows, unusual clipping, or decorative frame geometry.

## Components

### Buttons

Compact and explicit. The default button is 36px high, with medium radius, 14px medium-weight type, and 8px by 16px padding; a direct SVG child reduces horizontal padding to 12px. Small and large sizes are 32px and 40px high; icon buttons use matching square sizes. Primary actions have blue fill and white labels, hovering to 90% blue opacity. Outline actions use a border and cool ground; secondary actions use quiet blue; ghost actions gain a quiet-blue fill on hover. Destructive and link variants remain available in the shared primitive. Disabled actions suppress pointer input and use half opacity. Focus uses the shared ring.

### Chips

Status pills use an 11px medium label, a 5px dot, and 4px by 7px padding. Text and dot share semantic color. Priority labels retain a visible P1–P4 label rather than relying on color alone. Tab counts are separate compact, gray-blue rectangles rather than status pills.

### Cards / Containers

White, border-defined, and gently rounded. The table surface clips its container corners while its table wrapper handles horizontal scrolling. Detail sections, knowledge cards, and catalog cards share this family with contextual padding. Keep content sections flat; modal depth belongs to Elevation & Depth.

### Inputs / Fields

Outlined and quiet: 36px high, medium-radius corners, transparent background, input-color border, and 4px by 12px padding. Text inputs use 16px type below the framework's 768px medium breakpoint and 14px above it; local search explicitly uses 12px. Focus changes the border and adds the shared ring. Invalid fields use a destructive border and corresponding ring; errors also appear as nearby text. Disabled fields use half opacity. Form labels connect by ID; hints and errors connect through `aria-describedby`. Actions sit at the form end above a divider, with cancellation outlined and saving primary. Pending forms disable actions and show `Kaydediliyor…`.

### Navigation

The ink rail holds text-and-SVG links with 13px labels, 11px by 13px padding, and a 12px icon gap. Hover uses the darker contextual hover fill and white text; active navigation uses a lighter ink-blue fill with white semibold labels. The same link treatment carries into mobile navigation. Keep real section names visible.

### Status Tabs

Queue filters use the line variant: a transparent track, compact medium labels, a two-pixel foreground underline on the active tab, and gray count chips. The default tab variant uses a muted track and a lightly elevated active surface. Both preserve keyboard focus and disabled styling. The queue's tab region can scroll horizontally.

### Record Queue

The signature pattern combines identifiers, a wrapped title and requester line, priority, status, SLA, owner/team, and update time. Headers are 40px high; cells use 8px padding and fine row dividers. Hover uses a half-opacity muted fill. Record names emphasize weight rather than large type; SLA and ownership details retain stable supporting columns. Preserve queue filters and pagination when opening a record and returning. Updating data temporarily dims the table to 65% opacity without replacing its layout.

Navigation background and color changes take 150ms; table update opacity also takes 150ms. Dialog transitions use 200ms. The global reduced-motion rule sets transition and animation duration to 0.01ms and a single animation iteration.

## Do's and Don'ts

### Do:

- **Do** preserve visible labels, field hints, required indicators, and inline validation.
- **Do** keep operational colors paired with status words, priority labels, or SLA symbols.
- **Do** let wide tables scroll horizontally and let filters wrap on narrow screens.
- **Do** use the local Inter family, existing type hierarchy, and tabular record values.
- **Do** preserve focus rings, disabled states, and the reduced-motion override.

### Don't:

- **Don't** replace record-first working surfaces with decorative metric tiles.
- **Don't** use navigation blue as an arbitrary success, warning, or error color.
- **Don't** add ornamental imagery or metaphorical controls to routine service workflows.
- **Don't** turn flat record sections into heavily shadowed floating cards.
