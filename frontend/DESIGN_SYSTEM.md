# Dashboard Design System

## Goals
- Unified visual language for Admin and Employee dashboards
- Reusable UI primitives with consistent states
- Accessible, responsive defaults for layout and interactions

## Design Tokens
- **Core file:** `src/styles/designSystem.css`
- **Color roles:** primary, success, warning, danger, info, text, muted text, border, surface, muted surface
- **Spacing scale:** `--ds-space-1` through `--ds-space-6`
- **Radii:** `--ds-radius-sm`, `--ds-radius-md`, `--ds-radius-lg`
- **Shadows:** `--ds-shadow-sm`, `--ds-shadow-md`

## Shared Components
- **Stat card:** `src/components/common/DashboardStatCard.js`
  - Variants: `primary`, `success`, `warning`, `danger`, `neutral`
  - Supports interactive keyboard/click behavior
  - Supports loading state via `StatCardSkeleton`
- **Surface container:** `.ds-surface`
  - Used for cards, chart containers, and quick action blocks
- **Action buttons:** `.ds-action-btn`
  - Rounded shape and stronger visual hierarchy
- **Table style:** `.ds-table`
  - Unified header contrast and border styling
- **Modal headers:** `.ds-modal-header` with variant modifiers:
  - `--primary`, `--success`, `--danger`, `--warning`

## States
- **Hover/active:** interactive stat cards use lift/transition; buttons use Bootstrap state colors with system radius
- **Focus:** keyboard accessibility preserved; interactive cards are focusable and respond to Enter/Space
- **Disabled:** relies on Bootstrap disabled handling while retaining component geometry
- **Loading:** stat cards and chart container provide skeleton/spinner placeholders

## Dashboard Adoption
- **Admin dashboard:** migrated to design-system header, stat cards, action buttons, table styling, and modal header variants
- **Employee dashboard:** migrated to design-system header, stat cards, quick actions, and chart surface styling
- **Layout shell:** `EmployeeLayout` and Admin page root now use `.ds-page-shell` and `.ds-main-content` for shared page structure
