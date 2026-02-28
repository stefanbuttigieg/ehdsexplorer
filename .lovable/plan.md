

## Implementation Progress Map Tab + Sidebar Update

### Summary
Add a third "Implementation" tab to the National EHDS Entities page and update the sidebar navigation to reflect the page's broader scope -- it now covers entities, legislation, AND implementation progress.

---

### 1. Sidebar Navigation Update

**File:** `src/components/Layout.tsx`

- Rename the nav item from **"National Entities"** to **"EHDS Country Map"** (or similar, e.g. "Country Hub")
- Change the icon from `MapPin` to `MapIcon` (or `Globe`) to better represent the broader scope
- The route stays `/health-authorities` to avoid breaking links

**File:** `src/components/MobileBottomNav.tsx`
- Update any matching label/icon if this item appears in the mobile nav

---

### 2. Page Title & Header Update

**File:** `src/pages/HealthAuthoritiesPage.tsx`

- Update the page `<title>` and heading from "National EHDS Entities" to **"EHDS Country Map"**
- Update the subtitle to reflect all three tabs: entities, legislation, and implementation progress

---

### 3. Implementation Progress Tab

**File:** `src/pages/HealthAuthoritiesPage.tsx`

- Add a third `TabsTrigger` value `"implementation"` with a progress-related icon (e.g. `CheckCircle2` or `BarChart3`)
- Import `useEhdsObligations` and related hooks already used by `ImplementationTimelineTracker`
- Compute per-country overall progress percentages using the existing weighted obligation status formula
- Pass progress data to `EuropeMap` when this tab is active
- In list view: show a ranked table of countries with progress bars

**Info cards** at the top will swap to show:
- Average EU-wide implementation progress
- Count of countries above/below 50%
- Summary badges for primary use vs secondary use readiness

---

### 4. EuropeMap Progress Mode

**File:** `src/components/EuropeMap.tsx`

- Add an optional `mode` prop: `'count'` (default, current behavior) or `'progress'`
- In progress mode:
  - Marker border colors use a green/amber/red gradient based on % (green > 70%, amber 30-70%, red < 30%)
  - Tooltip shows overall progress % with a mini breakdown (primary use / secondary use / general)
- Update the legend to show the progress color scale when in progress mode
- Existing Entities and Legislation tabs are completely unaffected

---

### Technical Notes

- No database migrations required -- all data comes from existing `country_obligation_status` and `ehdsi_kpi_data` tables via existing hooks
- Progress calculation logic (~30 lines) will be extracted or kept inline, reusing the same formula from `ImplementationTimelineTracker`
- The `EuropeMap` changes are backward-compatible via the optional `mode` prop
- Files modified: `Layout.tsx`, `HealthAuthoritiesPage.tsx`, `EuropeMap.tsx`, possibly `MobileBottomNav.tsx`

