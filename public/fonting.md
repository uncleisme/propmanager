# CMMS Font Style Guide for Windsurf AI

Use this typography reference to maintain consistent, professional, and accessible font styling across the CMMS UI powered by Windsurf AI.

---

## ✅ Font Family

```
font-family: 'Inter', 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
```

- Modern, readable sans-serif stack
- Clean rendering across platforms and great fallback compatibility

---

## ✅ Font Sizes & Use Cases

| Element                | Font Size | Weight | Style         | Line Height | Color      |
|------------------------|-----------|--------|---------------|-------------|------------|
| **Main Header (H1)**   | 24px      | 700    | Normal        | 32px        | `#1A1A1A`  |
| **Section Header (H2)**| 20px      | 600    | Normal        | 28px        | `#1A1A1A`  |
| **Subheader (H3)**     | 18px      | 600    | Normal        | 26px        | `#2D2D2D`  |
| **Body Text**          | 14–16px   | 400    | Normal        | 22–24px     | `#2D2D2D`  |
| **Table Headers**      | 14px      | 600    | Uppercase     | 20px        | `#333333`  |
| **Table Data**         | 14px      | 400    | Normal        | 20px        | `#3A3A3A`  |
| **Buttons**            | 14px      | 500–600| Uppercase/Title Case | 18–20px | `#FFFFFF` / `#2D2D2D` |
| **Captions / Hints**   | 12px      | 400    | Italic/Normal | 16px        | `#888888` or `#AAAAAA` |

---

## ✅ Font Colors

| Purpose          | Hex Value  | Notes                            |
|------------------|------------|----------------------------------|
| Primary text     | `#1A1A1A`  | Dark gray for high contrast      |
| Secondary text   | `#2D2D2D`  | Slightly lighter for less emphasis |
| Muted/hint text  | `#888888`  | For placeholders, helper text    |
| Error text       | `#D32F2F`  | Clear red for validation/error   |
| Success text     | `#388E3C`  | Green for success indicators     |
| Link text        | `#1976D2`  | Blue, underlined on hover        |

---

## ✅ Button Text Styling

### Primary Button
- Font size: 14px
- Font weight: 600
- Color: `#FFFFFF`
- Background: `#1976D2`
- Style: Uppercase or Title Case

### Secondary Button
- Font size: 14px
- Font weight: 500
- Color: `#2D2D2D`
- Border: `1px solid #CCCCCC`
- Background: `#FFFFFF`

---

## ✅ Accessibility Guidelines

- Minimum contrast ratio: **4.5:1** for body text
- Avoid using color as the only indicator
- Maintain consistent spacing and alignment
- Use relative units (`rem`) in production for scalability

---

## ✅ Example CSS Snippet

```css
body {
  font-family: 'Inter', 'Segoe UI', sans-serif;
  font-size: 16px;
  color: #2D2D2D;
  line-height: 1.5;
}

h1 {
  font-size: 24px;
  font-weight: 700;
  color: #1A1A1A;
}

.table-header {
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  color: #333333;
}
```

---

## ✅ Prompt Version for Windsurf AI

> **Typography guide for a CMMS interface:**  
> Use `'Inter', 'Segoe UI', 'Roboto', sans-serif` font stack. Headings: 24px bold, subheadings 20px semibold, body 14–16px normal. Table data 14px. Button text 14px bold, uppercase. Primary text color `#2D2D2D`, headings `#1A1A1A`, secondary `#888888`. Minimum contrast 4.5:1.