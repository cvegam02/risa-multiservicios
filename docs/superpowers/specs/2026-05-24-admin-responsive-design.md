# Admin Panel Responsive Design Spec

**Date:** 2026-05-24  
**Objective:** Refactor admin panel (admin.html, admin.js) to be fully responsive with mobile-first approach, supporting 90% mobile usage without breaking existing desktop experience.

---

## 1. Architecture & Approach

### Strategy: Mobile-First Refactor with Hybrid CSS Classes

Instead of inline styles scattered throughout admin.js, we'll use a **hybrid CSS architecture**:

- **Utilities:** Reusable spacing, layout, and responsive helpers (`.p-12`, `.gap-16`, `.grid-cols-2`)
- **Components:** Semantic classes for major UI elements (`.material-table`, `.service-sidebar`, `.calc-form`)
- **Layouts:** Combine utilities + components to build responsive layouts

### CSS Organization

All CSS goes into a new `<style>` block in admin.html (after existing styles). JavaScript generates markup using classes instead of inline styles.

```
admin.html:
├── Existing <style> (header, tabs, login)
├── NEW <style> (utilities + components for tabs)
└── <script src="admin.js">

admin.js:
├── Replace all inline style="" with class=""
└── Use semantic + utility classes
```

---

## 2. Responsive Breakpoints (Mobile-First)

**Base:** Mobile (< 640px) — all default styles written for mobile
**Tablet:** ≥ 640px — small layout adjustments
**Desktop:** ≥ 1024px — full two-column layouts

| Component | Mobile | Tablet | Desktop |
|---|---|---|---|
| **Tabla Materiales** | Card grid (1-col) | Card grid (2-col) | Traditional table |
| **Servicios Layout** | Stacked vertical | Stacked vertical | Sidebar (280px) + details |
| **Calculadora** | 1 column | 1 column | 2 columns (form + results) |
| **Spacing** | 16px pad / 12px gap | 20px pad / 20px gap | 32px pad / 28px gap |
| **Font sizes** | 14px base | 15px | 16px |
| **Button rows** | flex-col (full width) | flex-col (full width) | flex-row |

---

## 3. Component Specifications

### 3.1 Tab: Materiales (Material Management)

**Mobile View:**
- Materials displayed as vertically stacked cards
- Each card shows: name, unit, price, and action buttons (Editar / Eliminar)
- Cards are 100% width with responsive padding
- Add button is full-width below card list
- Action buttons stack or shrink as needed

**Tablet/Desktop:**
- Mobile: 1-column card grid
- Tablet+: 2-column card grid (via `@media (min-width: 640px)`)
- Desktop: Switches to traditional table layout with horizontal scroll on constrained widths

**CSS Classes:**
- `.material-table` — container for table/cards (display: flex on mobile, table on desktop)
- `.material-row` — individual material item (flex-col card on mobile, table-row on desktop)
- `.btn-primary`, `.btn-secondary` — action buttons with responsive sizing
- `.btn-row` — flex container for buttons (flex-col on mobile, flex-row on desktop)

---

### 3.2 Tab: Servicios (Service Management)

**Mobile View:**
- Sidebar collapsed/hidden or converted to a simple list with selection state
- Services displayed as selectable items with visual focus indicator
- Selected service details appear directly below (no two-column layout)
- Material assignments shown in vertical list
- Add buttons are full-width

**Tablet View:**
- Same as mobile (stacked)

**Desktop View:**
- Sidebar re-appears as fixed 280px column on left
- Details pane on right
- Sticky positioning for sidebar (top: 120px)

**CSS Classes:**
- `.services-layout` — wrapper (flex-col on mobile, grid 280px+1fr on desktop)
- `.service-sidebar` — sidebar container (width: 100% on mobile, width: 280px on desktop)
- `.service-item` — individual service in list (padding/border responsive)
- `.service-details` — details pane (full width on mobile, right column on desktop)
- `.material-assignment` — material card within service details (flex-col layout)

---

### 3.3 Tab: Calculadora (Budget Calculator)

**Mobile View:**
- Form and results stack vertically
- Form stays at top (sticky optional on scroll)
- Results cards below in vertical stack
- Input fields and selects full-width
- Buttons within result cards adapt to space

**Desktop View:**
- Two-column layout: form (sticky, 280px left) + results (right)
- Form positioned sticky at top: 120px

**CSS Classes:**
- `.calc-form` — input form wrapper (width: 100% on mobile, width: 280px + sticky on desktop)
- `.calc-results` — results container (flex-col, grows to fill space)
- `.calc-result-card` — individual result card (flex responsive)
- `.btn-row` — button groups (flex-col on mobile, flex-row on desktop)

---

## 4. Utilities & Reusable Classes

**Spacing:**
```css
.p-12 { padding: 12px; }
.p-16 { padding: 16px; }
.p-20 { padding: 20px; }
.p-24 { padding: 24px; }
.p-28 { padding: 28px; }
.gap-12 { gap: 12px; }
.gap-16 { gap: 16px; }
.gap-20 { gap: 20px; }
.gap-32 { gap: 32px; }
.mb-16 { margin-bottom: 16px; }
.mb-24 { margin-bottom: 24px; }
```

**Flex/Grid:**
```css
.flex { display: flex; }
.flex-col { flex-direction: column; }
.flex-center { justify-content: center; align-items: center; }
.flex-between { justify-content: space-between; align-items: center; }
.grid-cols-2 { display: grid; grid-template-columns: 1fr 1fr; }
@media (max-width: 640px) {
  .grid-cols-2 { grid-template-columns: 1fr; }
}
```

**Responsive Helpers:**
```css
@media (max-width: 640px) {
  .hide-mobile { display: none; }
  .full-width { width: 100% !important; }
  .flex-mobile-col { flex-direction: column; }
}
```

---

## 5. Implementation Plan (Overview)

1. **Add CSS:** Write all utility + component classes in `<style>` block in admin.html
2. **Refactor admin.js:** Replace inline styles with class assignments
   - Tab 1: Materiales table
   - Tab 2: Servicios layout
   - Tab 3: Calculadora form + results
3. **Test responsive:** Verify at mobile (375px), tablet (768px), desktop (1920px)
4. **Verify functionality:** Ensure all interactions (add, edit, delete, calculate) work across all sizes

---

## 6. Success Criteria

- ✅ Admin panel renders correctly at mobile, tablet, and desktop sizes
- ✅ No horizontal scroll on mobile (except intentional table overflow)
- ✅ All buttons and inputs are touch-friendly on mobile (min 44px height)
- ✅ Tab navigation is readable at all sizes
- ✅ Form inputs and selects are full-width on mobile, sized appropriately on desktop
- ✅ All existing functionality works (add/edit/delete materials, manage services, calculate budgets)
- ✅ No inline styles in generated HTML; all styling via CSS classes

---

## 7. Notes

- Viewport meta tag already present in admin.html ✓
- No JavaScript framework changes needed; CSS-only visual refactor
- Admin.js logic remains unchanged; only HTML generation markup changes
- Can be implemented incrementally (one tab at a time) without breaking others
