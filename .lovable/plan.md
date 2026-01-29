

# Dynamic Version Display in Sidebar

## Overview
Move the version display from the main footer to the sidebar and make it dynamic by pulling the version from `package.json` instead of hardcoding it.

## Changes

### 1. Update package.json version
Update the version field in `package.json` from `0.0.0` to `1.8.7` to match the current application version.

### 2. Modify Layout.tsx

**Remove the footer from main content:**
- Delete the footer element that currently displays the hardcoded version (lines 344-347)

**Add version to sidebar:**
- Import the version from `package.json` using Vite's JSON import feature
- Display the version at the bottom of the sidebar, styled appropriately for both expanded and collapsed states
- When expanded: Show "v1.8.7" text below the legal links section
- When collapsed: Show a tooltip with the version when hovering over a small "v" indicator

### 3. Technical Details

**Importing version from package.json:**
```typescript
import { version } from '../../package.json';
```

**Version display placement:**
- Add after the Legal Links section (after line 319)
- Include styling that matches the sidebar's muted text aesthetic
- Handle the collapsed state with a tooltip

## Files to Modify
1. `package.json` - Update version to "1.8.7"
2. `src/components/Layout.tsx` - Remove footer, add version to sidebar with dynamic import

## Visual Result
- **Expanded sidebar**: Small muted text "v1.8.7" at the bottom of the sidebar
- **Collapsed sidebar**: Icon or text "v" with tooltip showing full version
- **Mobile**: Version visible at bottom of mobile sidebar when opened

