# 🚀 Quick Start - NDVI 2-Year Viewer

## 5-Minute Setup

### 1. Start the Server
```bash
npm start
```

### 2. Open the Viewer
```
http://localhost:3000/ndvi-two-year-viewer.html
```

### 3. Generate Analysis
- Select interval type (Monthly or Weekly)
- Click "Generate 2-Year Analysis"
- Wait for processing

### 4. Explore Results
- View statistics in the dashboard
- Click timeline items to see on map
- Switch to Gallery tab to see all images

### 5. Download Images
- Click download button on any image
- Review image details in modal
- Click "Download" to save

---

## 🎯 Key Features at a Glance

| Feature | Description |
|---------|------------|
| **Interactive Map** | Real-time NDVI visualization |
| **Statistics** | Mean, Std Dev, Min/Max, Trend |
| **Timeline View** | Chronological data points |
| **Gallery View** | Card-based image browser |
| **Download** | Export image metadata |
| **Color Legend** | 6-color NDVI scale |

---

## 📊 What You'll See

### Statistics Box
```
Mean NDVI:    0.380
Std Dev:      0.020
Min NDVI:     0.150
Max NDVI:     0.580
Trend:        STABLE
Total Images: 24
```

### Timeline Items
```
2023-10-26
NDVI: 0.350

2023-11-26
NDVI: 0.365

... (24 total for monthly)
```

### Gallery Cards
```
┌─────────────────────────┐
│ 2023-10-26              │
│ NDVI: 0.350             │
│ [📍 Map] [⬇️ Download]  │
└─────────────────────────┘
```

---

## 🎨 UI Components

### Header
- Title with icon
- Description
- Status messages

### Sidebar
- Analysis settings
- Statistics dashboard
- Tabs (Timeline/Gallery)
- NDVI color legend

### Map
- Interactive Leaflet map
- OpenStreetMap base layer
- NDVI tile overlay
- Zoom/pan controls

### Download Modal
- Image details
- Download URL
- One-click download

---

## 💡 Tips & Tricks

1. **Switch Views:** Use tabs to toggle between Timeline and Gallery
2. **Quick Preview:** Click map icon to view image on map
3. **Batch Download:** Download multiple images one by one
4. **Mobile Friendly:** Works on tablets and phones
5. **Real-time Updates:** Map updates instantly when selecting dates

---

## 🔍 Troubleshooting

| Issue | Solution |
|-------|----------|
| Map not loading | Check if server is running |
| No data points | Verify field boundary coordinates |
| Download not working | Check browser console for errors |
| Slow performance | Try monthly interval instead of weekly |

---

## 📱 Responsive Design

- **Desktop:** Two-column layout (map + sidebar)
- **Tablet:** Adjusted spacing
- **Mobile:** Single column (map above sidebar)

---

## ✅ Verification Checklist

- [ ] Server is running (`npm start`)
- [ ] Viewer loads at `http://localhost:3000/ndvi-two-year-viewer.html`
- [ ] Can generate analysis
- [ ] Statistics display correctly
- [ ] Timeline shows data points
- [ ] Gallery displays images
- [ ] Download modal opens
- [ ] Can download images

---

## 🎓 Understanding NDVI Values

- **0.8 - 1.0:** Excellent vegetation (Dark Blue)
- **0.6 - 0.8:** Good vegetation (Blue)
- **0.4 - 0.6:** Moderate vegetation (Light Blue)
- **0.2 - 0.4:** Bare soil (Yellow)
- **0 - 0.2:** Sparse vegetation (Orange)
- **-1 - 0:** Poor/No vegetation (Red)

---

## 🚀 Next Steps

1. Customize field boundary coordinates
2. Integrate with your database
3. Add export to CSV/Excel
4. Create batch processing
5. Add email notifications

---

**Status:** ✅ Ready to Use | **Version:** 1.0.0

