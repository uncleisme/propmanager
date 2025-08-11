# Property Management App - Typography Guide

This document outlines the typography system used in the Property Management application.

## Font Family

The application uses the following font stack:
```css
font-family: 'Inter', 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
```

## Typography Scale

| Element                | Class Name    | Font Size | Line Height | Font Weight |
|------------------------|---------------|-----------|-------------|-------------|
| Main Header (H1)       | `text-h1`     | 24px      | 32px        | 700         |
| Section Header (H2)    | `text-h2`     | 20px      | 28px        | 600         |
| Subheader (H3)         | `text-h3`     | 18px      | 26px        | 600         |
| Body Text (Large)      | `text-lg`     | 16px      | 24px        | 400         |
| Body Text (Base)       | `text-base`   | 14px      | 22px        | 400         |
| Table Header           | `text-table-header` | 14px | 20px | 600         |
| Table Data             | `text-table-data`   | 14px | 20px | 400         |
| Button Text            | `text-button` | 14px      | 20px        | 600         |
| Captions / Hints       | `text-xs`     | 12px      | 16px        | 400         |

## Colors

| Purpose          | Class Name    | Hex Value  |
|------------------|---------------|------------|
| Primary Text     | `text-black`  | `#1A1A1A`  |
| Secondary Text   | `text-gray-900` | `#2D2D2D` |
| Muted Text       | `text-muted`  | `#888888`  |
| Error Text       | `text-error`  | `#D32F2F`  |
| Success Text     | `text-success`| `#388E3C`  |
| Link Text        | `text-link`   | `#1976D2`  |

## Buttons

### Primary Button
```html
<button class="btn btn-primary">Submit</button>
```

### Secondary Button
```html
<button class="btn btn-secondary">Cancel</button>
```

## Forms

### Input Fields
```html
<div class="mb-4">
  <label for="name" class="block mb-1 text-sm font-medium text-gray-900">Name</label>
  <input type="text" id="name" class="w-full px-3 py-2 border border-gray-300 rounded focus:border-primary focus:ring-1 focus:ring-primary">
  <p class="mt-1 text-xs text-muted">Helper text goes here</p>
</div>
```

## Tables

```html
<table class="w-full border-collapse">
  <thead>
    <tr>
      <th class="px-4 py-2 text-left">Header 1</th>
      <th class="px-4 py-2 text-left">Header 2</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="px-4 py-2 border">Data 1</td>
      <td class="px-4 py-2 border">Data 2</td>
    </tr>
  </tbody>
</table>
```

## Accessibility

- Minimum contrast ratio of 4.5:1 for all text
- Use semantic HTML elements (h1-h6, p, etc.)
- Ensure interactive elements have sufficient touch targets (minimum 44x44px)
- Use proper heading hierarchy
- Include alt text for images and icons
- Ensure keyboard navigation works correctly

## Best Practices

1. Always use the provided utility classes for consistent styling
2. Don't override font families or weights unless absolutely necessary
3. Use relative units (rem, em) for typography to respect user preferences
4. Test with different font sizes (browser zoom) to ensure proper scaling
5. Verify contrast ratios for accessibility compliance
