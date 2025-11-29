# Design System Documentation

This document centralizes all design tokens, component classes, and styling guidelines for the Piano App. All styling changes should be made here for consistency across the application.

## 🎨 Color Palette

### Primary Colors

- **Primary**: `#6366f1` (Indigo)
- **Secondary**: `#8b5cf6` (Purple)
- **Accent**: `#06b6d4` (Cyan)

### Status Colors

- **Success**: `#10b981` (Green)
- **Warning**: `#f59e0b` (Amber)
- **Error**: `#ef4444` (Red)

### Background Colors

- **Main Background**: `#121212` (Dark)
- **Card Background**: `#ffffff` (White)
- **Surface Light**: `#ffffff` (White)
- **Surface Medium**: `#ffffff` (White)
- **Surface Heavy**: `#ffffff` (White)

### Text Colors

- **Primary Text**: `#111827` (Gray-900)
- **Secondary Text**: `#4b5563` (Gray-600)
- **Tertiary Text**: `#6b7280` (Gray-500)
- **Muted Text**: `#9ca3af` (Gray-400)

### Border Colors

- **Light Border**: `#e5e7eb` (Gray-200)
- **Medium Border**: `#d1d5db` (Gray-300)
- **Heavy Border**: `#9ca3af` (Gray-400)

## 📐 Spacing Scale

- **xs**: `0.25rem` (4px)
- **sm**: `0.5rem` (8px)
- **md**: `1rem` (16px)
- **lg**: `1.5rem` (24px)
- **xl**: `2rem` (32px)
- **2xl**: `3rem` (48px)

## 🔲 Border Radius

- **sm**: `0.25rem` (4px)
- **md**: `0.375rem` (6px)
- **lg**: `0.5rem` (8px)
- **xl**: `0.75rem` (12px)
- **2xl**: `1rem` (16px)
- **3xl**: `1.5rem` (24px)

## 🌟 Shadows

- **sm**: `0 1px 2px 0 rgba(0, 0, 0, 0.05)`
- **md**: `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)`
- **lg**: `0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)`
- **xl**: `0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)`
- **2xl**: `0 25px 50px -12px rgba(0, 0, 0, 0.25)`

## ⚡ Transitions

- **Fast**: `150ms ease-in-out`
- **Normal**: `250ms ease-in-out`
- **Slow**: `350ms ease-in-out`

## 🧩 Component Classes

### Card Components

#### Primary Cards

```css
.card {
  @apply bg-white border border-gray-200 rounded-2xl shadow-sm;
}

.card-hover {
  @apply card hover:bg-gray-50 transition-colors duration-200;
}

.card-elevated {
  @apply card shadow-lg hover:shadow-xl transition-shadow duration-200;
}
```

#### Compact Cards

```css
.card-compact {
  @apply bg-white border border-gray-200 rounded-lg shadow-sm;
}

.card-compact-hover {
  @apply card-compact hover:bg-gray-50 transition-colors duration-200;
}
```

#### Legacy Glassmorphism (Deprecated)

```css
.card-glass-legacy {
  @apply bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl;
}

.card-glass-legacy-hover {
  @apply card-glass-legacy hover:bg-white/15 transition-colors duration-200;
}
```

### Button Components

#### Primary Buttons

```css
.btn-primary {
  @apply btn bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500;
}

.btn-secondary {
  @apply btn bg-secondary-600 text-white hover:bg-secondary-700 focus:ring-secondary-500;
}

.btn-ghost {
  @apply btn bg-transparent text-gray-900 hover:bg-gray-100 focus:ring-gray-300;
}

.btn-outline {
  @apply btn border border-gray-300 text-gray-900 hover:bg-gray-50 focus:ring-gray-300;
}
```

#### Legacy Glassmorphism Buttons (Deprecated)

```css
.btn-glass-legacy {
  @apply px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-lg hover:bg-white/20 transition-colors duration-200;
}
```

### Input Components

#### White Inputs

```css
.input-white {
  @apply bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200;
}
```

#### Legacy Glassmorphism Inputs (Deprecated)

```css
.input-glass-legacy {
  @apply bg-white/10 border-white/30 text-white placeholder:text-white/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-colors duration-200;
}
```

### Loading States

#### White Loading States

```css
.loading-skeleton {
  @apply bg-gray-200 rounded animate-pulse;
}
```

#### Legacy Loading States (Deprecated)

```css
.loading-skeleton-legacy {
  @apply bg-white/10 rounded animate-pulse;
}
```

## 🎯 Usage Guidelines

### When to Use Each Card Type

1. **`.card`** - Standard content containers, main sections
2. **`.card-hover`** - Interactive cards that respond to hover
3. **`.card-compact`** - Smaller cards for stats, metrics, or compact displays
4. **`.card-elevated`** - Cards that need more visual prominence

### Text Color Guidelines

- **Primary text**: `text-gray-900` for main headings and important content
- **Secondary text**: `text-gray-600` for descriptions and supporting text
- **Tertiary text**: `text-gray-500` for metadata and less important info
- **Muted text**: `text-gray-400` for disabled or placeholder text

### Background Color Guidelines

- **Main containers**: `bg-white` for all cards and content areas
- **Hover states**: `hover:bg-gray-50` for subtle interaction feedback
- **Loading states**: `bg-gray-200` for skeleton loading animations
- **Nested elements**: `bg-gray-100` for subtle background differentiation

## 🔄 Migration Guide

### From Glassmorphism to White Cards

**Before (Deprecated):**

```jsx
<div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
  <h3 className="text-white">Title</h3>
  <p className="text-gray-400">Description</p>
</div>
```

**After (Current):**

```jsx
<div className="card p-6">
  <h3 className="text-gray-900">Title</h3>
  <p className="text-gray-600">Description</p>
</div>
```

### Text Color Migration

**Before:**

- `text-white` → `text-gray-900`
- `text-gray-300` → `text-gray-600`
- `text-gray-400` → `text-gray-600`
- `text-gray-200` → `text-gray-600`

**After:**

- Primary text: `text-gray-900`
- Secondary text: `text-gray-600`
- Tertiary text: `text-gray-500`
- Muted text: `text-gray-400`

### Background Migration

**Before:**

- `bg-white/10` → `bg-white`
- `bg-white/5` → `bg-gray-100`
- `border-white/20` → `border-gray-200`
- `border-white/10` → `border-gray-200`

**After:**

- Main backgrounds: `bg-white`
- Subtle backgrounds: `bg-gray-100`
- Borders: `border-gray-200`

## 📱 Responsive Design

### Breakpoints

- **sm**: `640px`
- **md**: `768px`
- **lg**: `1024px`
- **xl**: `1280px`
- **2xl**: `1536px`

### Responsive Classes

```css
.card-responsive {
  @apply card p-4 md:p-6 lg:p-8;
}

.text-responsive {
  @apply text-sm md:text-base lg:text-lg;
}
```

## ♿ Accessibility

### Focus States

```css
.focus-ring {
  @apply focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-transparent;
}
```

### High Contrast Support

```css
.high-contrast .card {
  @apply bg-white border-2 border-gray-900;
}

.high-contrast .text-gray-600 {
  @apply text-gray-900;
}
```

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  .card-hover {
    @apply transition-none;
  }
}
```

## 🎨 Customization

### Adding New Card Variants

1. Add the class to `src/index.css` in the `@layer components` section
2. Follow the naming convention: `card-{variant}`
3. Use the established color palette and spacing scale
4. Document the new variant in this file

### Modifying Existing Classes

1. Update the class in `src/index.css`
2. Test across all components that use the class
3. Update this documentation
4. Consider backward compatibility for existing implementations

## 📋 Component Checklist

When creating or updating components, ensure:

- [ ] Uses centralized design system classes
- [ ] Follows text color guidelines
- [ ] Implements proper hover states
- [ ] Includes focus states for accessibility
- [ ] Uses consistent spacing and border radius
- [ ] Supports responsive design
- [ ] Includes loading states where appropriate

## 🔧 Quick Reference

### Common Patterns

**Standard Card:**

```jsx
<div className="card p-6">
  <h3 className="text-lg font-medium text-gray-900 mb-4">Title</h3>
  <p className="text-gray-600">Content</p>
</div>
```

**Interactive Card:**

```jsx
<button className="card-hover p-4 text-left w-full">
  <h4 className="text-gray-900 font-medium">Title</h4>
  <p className="text-gray-600 text-sm">Description</p>
</button>
```

**Loading State:**

```jsx
<div className="card p-6">
  <div className="h-16 bg-gray-200 rounded animate-pulse"></div>
</div>
```

This design system ensures consistency, maintainability, and easy global changes across the entire application.
