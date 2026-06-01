# Frontend Employee - Styling Guide

## Overview

The frontend-employee application now features a professional, modern design system with:
- **Enhanced visual hierarchy** through improved typography and spacing
- **Dark mode support** with seamless theme switching
- **Sophisticated animations** for smooth user interactions
- **Professional color gradients** for visual depth
- **Improved accessibility** with better focus states and contrast

---

## Design System

### Color Palette

#### Primary Colors
- **Primary**: `#2563eb` (Blue)
- **Primary Hover**: `#1d4ed8` (Darker Blue)
- **Primary Light**: `#eff6ff` (Light Blue background)
- **Primary Dark**: `#1e40af` (Dark Blue)
- **Gradient**: Linear gradient from primary to primary-dark (135deg)

#### Status Colors
- **Success**: `#16a34a` (Green)
- **Danger**: `#dc2626` (Red)
- **Warning**: `#d97706` (Orange)
- **Info**: `#0891b2` (Cyan)

#### Grayscale
- **Gray-50 to Gray-900**: Full grayscale palette for text, borders, and backgrounds
- **Dark Mode**: Inverted colors for dark theme

### Typography

All font sizes and weights follow a consistent scale:
```css
--text-xs: 0.75rem    /* 12px */
--text-sm: 0.875rem   /* 14px */
--text-base: 1rem     /* 16px */
--text-lg: 1.125rem   /* 18px */
--text-xl: 1.25rem    /* 20px */
--text-2xl: 1.5rem    /* 24px */
--text-3xl: 1.875rem  /* 30px */
```

Font Family: Inter, system fonts

### Spacing

Consistent spacing scale:
```css
--space-1: 0.25rem    /* 4px */
--space-2: 0.5rem     /* 8px */
--space-3: 0.75rem    /* 12px */
--space-4: 1rem       /* 16px */
--space-5: 1.25rem    /* 20px */
--space-6: 1.5rem     /* 24px */
--space-8: 2rem       /* 32px */
--space-10: 2.5rem    /* 40px */
--space-12: 3rem      /* 48px */
```

### Shadows

Professional shadow depth system:
- **shadow-xs**: Subtle (1px)
- **shadow-sm**: Light (2-4px)
- **shadow-md**: Medium (4-12px)
- **shadow-lg**: Deep (10-28px)
- **shadow-xl**: Very deep (20-40px)
- **shadow-hover**: Blue tinted hover effect

### Border Radius

```css
--radius-sm: 6px
--radius-md: 8px      /* Default for forms, buttons */
--radius-lg: 12px     /* Default for cards */
--radius-xl: 16px     /* Large components */
--radius-full: 9999px /* Fully rounded */
```

### Transitions

Smooth easing functions:
- **Fast**: 150ms - Quick interactions (hover, focus)
- **Base**: 200ms - Standard interactions
- **Slow**: 300ms - Page-level transitions

All use `cubic-bezier(0.4, 0, 0.2, 1)` for natural motion

---

## Components

### Cards

**Usage**: Wrap content sections
```html
<div class="card">
  Content here
</div>
```

**Features**:
- Subtle shadow that elevates on hover
- Smooth border color transition
- Professional depth

### Buttons

**Primary Button** (Main action)
```html
<button class="btn btn--primary">Save Changes</button>
```

**Secondary Button** (Alternative action)
```html
<button class="btn btn--secondary">Cancel</button>
```

**Danger Button** (Destructive action)
```html
<button class="btn btn--danger">Delete</button>
```

**Ghost Button** (Minimal)
```html
<button class="btn btn--ghost">Learn More</button>
```

**Sizes**:
- `.btn--sm` - Small button
- `.btn` - Regular button (default)
- `.btn--lg` - Large button

**Features**:
- Ripple effect on click
- Smooth elevation on hover
- Disabled state support

### KPI Cards

**Usage**: Display key metrics
```html
<div class="kpi-grid">
  <div class="kpi-card">
    <div class="kpi-icon kpi-icon--blue">📊</div>
    <p class="kpi-label">Employee Code</p>
    <p class="kpi-value">EMP1001</p>
  </div>
</div>
```

**Features**:
- Top gradient border on hover
- Card lift animation
- Color-coded icon backgrounds

### Forms

**Input Field**:
```html
<div class="form-group">
  <label class="form-label">Field Label</label>
  <input class="form-input" type="text" />
</div>
```

**Features**:
- Improved focus state with shadow
- Better border definition
- Smooth transitions

### Alerts

**Success Alert**:
```html
<div class="alert alert--success">✓ Operation successful</div>
```

**Error Alert**:
```html
<div class="alert alert--error">✗ Something went wrong</div>
```

**Features**:
- Left border indicator
- Slide-in animation
- Color-coded backgrounds

### Tables

**Features**:
- Alternating row hover
- Clear header styling
- Responsive horizontal scroll

### Status Badges

**Present**: `<span class="pill pill-present">Present</span>`
**Absent**: `<span class="pill pill-absent">Absent</span>`
**Default**: `<span class="pill pill-default">Default</span>`

---

## Dark Mode

### How It Works

Dark mode is automatically enabled based on system preferences but can be manually toggled via the theme button in the topbar.

### Using Dark Mode CSS

```css
/* Light mode (default) */
background: var(--color-bg);

/* Dark mode - automatically handled */
@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: var(--dark-color-bg);
  }
}

/* Manual dark mode */
[data-theme="dark"] {
  --color-bg: var(--dark-color-bg);
}
```

### Theme Toggle

Import and use the `ThemeToggle` component:
```jsx
import ThemeToggle from "./components/common/ThemeToggle";

<ThemeToggle />
```

### Theme Context

Access theme state anywhere:
```jsx
import { useTheme } from "./context/ThemeContext";

const MyComponent = () => {
  const { theme, toggleTheme } = useTheme();
  // theme: "light" or "dark"
};
```

---

## Animations

### Available Animations

- **fadeIn**: Fade in with slight upward motion
- **slideIn**: Slide in from left
- **slideInRight**: Slide in from right
- **float**: Floating motion (6s loop)
- **pulse**: Opacity pulse effect
- **spin**: Rotation (0.75s - loader)

### Usage

Add animation classes:
```html
<div class="fade-in">Content appears with fade effect</div>
<div class="slide-in">Content slides in from left</div>
```

Or define custom animations in CSS using the keyframes.

---

## Layout

### Sidebar
- Fixed width: 260px
- Gradient background with depth shadow
- Fixed positioning with z-index: 100

### Topbar
- Fixed height: 60px
- Sticky positioning below sidebar
- Contains theme toggle

### Page Container
- Max width: 1280px
- Auto-centered with padding
- Responsive padding on mobile

---

## Responsive Design

### Breakpoints

- **Desktop** (>1024px): Full layout
- **Tablet** (≤1024px): 2-column grid
- **Mobile** (≤768px): Single column, mobile sidebar
- **Small Mobile** (≤480px): Reduced padding, stacked forms

### Mobile Sidebar

- Slides in from left on mobile
- Full-screen overlay
- Toggled via hamburger menu

---

## Best Practices

### Color Usage
1. Use semantic color variables (primary, success, danger, warning)
2. Don't hardcode colors
3. Use dark mode variants for custom colors

### Spacing
1. Use the spacing scale exclusively
2. Never use arbitrary padding/margins
3. Maintain consistent gaps between sections

### Typography
1. Use consistent font sizes from the scale
2. Maintain visual hierarchy with weights
3. Use letter-spacing for titles

### Shadows
1. Use appropriate shadow depth for component importance
2. Shadows indicate interactivity on hover
3. Don't mix multiple shadow styles

### Animations
1. Keep animations under 300ms for UI feedback
2. Use consistent easing functions
3. Don't animate everything - be selective

---

## Customization

### Changing Colors

Edit CSS variables in `/src/index.css`:
```css
:root {
  --color-primary: #2563eb;  /* Change this */
}
```

### Adjusting Spacing

Modify spacing scale in `:root` variables.

### Adding Animations

Create new keyframes and use in components:
```css
@keyframes myAnimation {
  from { opacity: 0; }
  to { opacity: 1; }
}

.my-element {
  animation: myAnimation 300ms ease-out;
}
```

---

## Accessibility

- Focus states visible with shadow rings
- Color contrast meets WCAG AA standards
- Semantic HTML structure
- ARIA labels on interactive elements

---

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Modern mobile browsers

---

## Migration Notes

If updating existing components:
1. Replace old color values with CSS variables
2. Update shadows to use the new depth system
3. Add smooth transitions for interactions
4. Test in both light and dark modes
