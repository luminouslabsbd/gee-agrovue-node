# 🎨 NDVI 2-Year Viewer - UI Components Guide

## Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                         HEADER                                  │
│  🌾 NDVI 2-Year Field Analysis Viewer                           │
│  View 2-year NDVI trends, field images, and detailed statistics │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         CONTENT                                 │
│                                                                 │
│  ┌──────────────────────────────┐  ┌──────────────────────┐   │
│  │                              │  │                      │   │
│  │                              │  │  SIDEBAR             │   │
│  │                              │  │                      │   │
│  │        MAP CONTAINER         │  │  ⚙️ Settings         │   │
│  │                              │  │  📊 Statistics       │   │
│  │  (Leaflet Map with NDVI)     │  │  📅 Timeline/Gallery │   │
│  │                              │  │  🎨 Legend           │   │
│  │                              │  │                      │   │
│  │                              │  │                      │   │
│  │                              │  │                      │   │
│  │                              │  │                      │   │
│  │                              │  │                      │   │
│  │                              │  │                      │   │
│  │                              │  │                      │   │
│  │                              │  │                      │   │
│  └──────────────────────────────┘  └──────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Sidebar Components

### 1. Settings Section
```
┌─────────────────────────────────┐
│ ⚙️ Analysis Settings             │
├─────────────────────────────────┤
│                                 │
│ 📅 Interval Type                │
│ ┌─────────────────────────────┐ │
│ │ 📅 Monthly (24 data points) │ │
│ │ 📊 Weekly (104 data points) │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ ▶️ Generate 2-Year Analysis │ │
│ └─────────────────────────────┘ │
│                                 │
└─────────────────────────────────┘
```

### 2. Statistics Box
```
┌─────────────────────────────────┐
│ 📊 Statistics                    │
├─────────────────────────────────┤
│ Mean NDVI:      0.380           │
│ Std Dev:        0.020           │
│ Min NDVI:       0.150           │
│ Max NDVI:       0.580           │
│ Trend:          STABLE          │
│ Total Images:   24              │
└─────────────────────────────────┘
```

### 3. Tab Navigation
```
┌─────────────────────────────────┐
│ 📅 Timeline  │  📷 Gallery      │
├─────────────────────────────────┤
│ (Active tab underlined)          │
└─────────────────────────────────┘
```

### 4. Timeline View
```
┌─────────────────────────────────┐
│ 📅 Timeline                      │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ 2023-10-26                  │ │ ← Active
│ │ NDVI: 0.350                 │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ 2023-11-26                  │ │
│ │ NDVI: 0.365                 │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ 2023-12-26                  │ │
│ │ NDVI: 0.380                 │ │
│ └─────────────────────────────┘ │
│ ... (24 total items)             │
└─────────────────────────────────┘
```

### 5. Gallery View
```
┌─────────────────────────────────┐
│ 📷 Gallery                       │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ 2023-10-26                  │ │
│ │ NDVI: 0.350                 │ │
│ │ [📍 Map] [⬇️ Download]      │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ 2023-11-26                  │ │
│ │ NDVI: 0.365                 │ │
│ │ [📍 Map] [⬇️ Download]      │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ 2023-12-26                  │ │
│ │ NDVI: 0.380                 │ │
│ │ [📍 Map] [⬇️ Download]      │ │
│ └─────────────────────────────┘ │
│ ... (24 total cards)             │
└─────────────────────────────────┘
```

### 6. Legend
```
┌─────────────────────────────────┐
│ 🎨 NDVI Scale                    │
├─────────────────────────────────┤
│ ■ Poor (-1 to 0)                │
│ ■ Sparse (0 to 0.2)             │
│ ■ Bare (0.2 to 0.4)             │
│ ■ Moderate (0.4 to 0.6)         │
│ ■ Good (0.6 to 0.8)             │
│ ■ Excellent (0.8 to 1)          │
└─────────────────────────────────┘
```

---

## Download Modal

```
┌─────────────────────────────────────────────────────┐
│ ⬇️ Download Image                            [✕]    │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Date:           2023-10-26                         │
│ NDVI Value:     0.350                              │
│                                                     │
│ Download URL:                                       │
│ ┌─────────────────────────────────────────────────┐ │
│ │ /time-series-images/NGR-KD-12345_1698316800000/│ │
│ │ ndvi_NGR-KD-12345_2023-10-26_0.json             │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ ℹ️ Click the download button to save the image     │
│    metadata to your device.                         │
│                                                     │
├─────────────────────────────────────────────────────┤
│                    [Cancel] [⬇️ Download]           │
└─────────────────────────────────────────────────────┘
```

---

## Color Scheme

### Primary Colors
```
┌──────────────────────────────────────────┐
│ Purple Gradient                          │
│ #667eea ──────────────► #764ba2          │
│ (Light Purple)         (Dark Purple)     │
└──────────────────────────────────────────┘
```

### Secondary Colors
```
┌──────────────────────────────────────────┐
│ White:      #ffffff                      │
│ Light Gray: #f9f9f9                      │
│ Gray:       #ddd, #eee                   │
│ Dark Gray:  #666, #555                   │
│ Text:       #333                         │
└──────────────────────────────────────────┘
```

### NDVI Colors
```
┌──────────────────────────────────────────┐
│ #d73027 ─ Red (Poor)                     │
│ #fc8d59 ─ Orange (Sparse)                │
│ #fee090 ─ Yellow (Bare)                  │
│ #e0f3f8 ─ Light Blue (Moderate)          │
│ #91bfdb ─ Blue (Good)                    │
│ #4575b4 ─ Dark Blue (Excellent)          │
└──────────────────────────────────────────┘
```

---

## Interactive States

### Button States
```
Normal:     [Generate 2-Year Analysis]
Hover:      [Generate 2-Year Analysis] ↑ (raised)
Active:     [Generate 2-Year Analysis] (pressed)
Disabled:   [Generate 2-Year Analysis] (grayed)
```

### Card States
```
Normal:     ┌─────────────────────────┐
            │ 2023-10-26              │
            │ NDVI: 0.350             │
            └─────────────────────────┘

Hover:      ┌─────────────────────────┐
            │ 2023-10-26              │ ← Highlighted
            │ NDVI: 0.350             │
            └─────────────────────────┘

Active:     ┌─────────────────────────┐
            │ 2023-10-26              │ ← Selected
            │ NDVI: 0.350             │
            └─────────────────────────┘
```

### Tab States
```
Inactive:   📅 Timeline
Active:     📅 Timeline ─────────────── (underlined)
```

---

## Responsive Breakpoints

### Desktop (1200px+)
```
┌─────────────────────────────────────────┐
│ HEADER                                  │
├──────────────────────┬──────────────────┤
│                      │                  │
│   MAP (70%)          │  SIDEBAR (30%)   │
│                      │                  │
│                      │                  │
│                      │                  │
└──────────────────────┴──────────────────┘
```

### Tablet (768px - 1199px)
```
┌─────────────────────────────────────────┐
│ HEADER                                  │
├─────────────────────────────────────────┤
│                                         │
│   MAP (60%)          SIDEBAR (40%)      │
│                                         │
└─────────────────────────────────────────┘
```

### Mobile (<768px)
```
┌─────────────────────────────────────────┐
│ HEADER                                  │
├─────────────────────────────────────────┤
│                                         │
│   MAP (100%)                            │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│   SIDEBAR (100%)                        │
│                                         │
└─────────────────────────────────────────┘
```

---

## Loading States

### Loading Spinner
```
    ⟳
  ⟲   ⟳  (Rotating animation)
    ⟲

Analyzing 2 years of data...
```

### Success Message
```
✅ Generated 24 data points with 24 images stored!
```

### Error Message
```
❌ Error: API request failed
```

---

## Accessibility Features

- ✅ Semantic HTML5 markup
- ✅ ARIA labels on interactive elements
- ✅ Keyboard navigation support
- ✅ High contrast colors
- ✅ Font Awesome icons with text labels
- ✅ Clear focus indicators
- ✅ Descriptive button text

---

## Animation Effects

### Fade In
```
Opacity: 0 ──────────► 1 (0.3s)
```

### Slide Up
```
Transform: translateY(20px) ──────────► translateY(0) (0.3s)
```

### Hover Lift
```
Transform: translateY(0) ──────────► translateY(-2px) (0.2s)
```

### Spin
```
Rotation: 0° ──────────► 360° (1s, infinite)
```

---

**UI Components Version:** 1.0.0 | **Last Updated:** 2025-10-26

