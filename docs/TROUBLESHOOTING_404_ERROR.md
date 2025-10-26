# 🔧 Troubleshooting: 404 Error on Map URLs

**Version:** 1.0.0  
**Date:** October 23, 2025  

---

## ❌ The Problem

When you try to access the map URL directly in a browser:

```
https://earthengine.googleapis.com/map/abc123def456/{z}/{x}/{y}?token=xyz789uvw012
```

You get:
```
404. That's an error.
The requested URL /map/abc123def456/%7Bz%7D/%7Bx%7D/%7By%7D?token=xyz789uvw012 was not found on this server.
```

---

## 🔍 Root Cause Analysis

### Why This Happens

1. **URL is a TEMPLATE, not a direct link**
   - `{z}`, `{x}`, `{y}` are PLACEHOLDERS
   - They need to be replaced with actual tile coordinates
   - Example: `/map/abc123/15/10234/6789?token=xyz789`

2. **Browser doesn't understand placeholders**
   - Browser URL-encodes `{` and `}` to `%7B` and `%7D`
   - Server receives: `/map/abc123def456/%7Bz%7D/%7Bx%7D/%7By%7D`
   - Server can't find this path → 404 error

3. **Needs a mapping library**
   - Leaflet, Google Maps, etc. handle tile requests
   - They replace placeholders with actual coordinates
   - They request tiles as user zooms/pans

---

## ✅ Solutions

### Solution 1: Use the Web Viewer (Easiest)

**File:** `public/ndvi-map-viewer.html`

**Steps:**
1. Start the server: `npm start`
2. Open browser: `http://localhost:3000/ndvi-map-viewer.html`
3. Click "Generate Maps"
4. Click on dates to view different maps

**Why it works:**
- Uses Leaflet.js mapping library
- Handles tile requests automatically
- Replaces placeholders with real coordinates

---

### Solution 2: Use Leaflet.js (Web Development)

**HTML File:**
```html
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />
    <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
    <style>
        #map { height: 600px; }
    </style>
</head>
<body>
    <div id="map"></div>
    
    <script>
        // Initialize map
        const map = L.map('map').setView([23.84, 90.37], 15);
        
        // Add base layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap',
            maxZoom: 19
        }).addTo(map);
        
        // Add NDVI layer (from API response)
        const mapId = 'abc123def456xyz';
        const token = 'xyz789uvw012abc';
        
        L.tileLayer(
            `https://earthengine.googleapis.com/map/${mapId}/{z}/{x}/{y}?token=${token}`,
            {
                attribution: 'Google Earth Engine',
                opacity: 0.7
            }
        ).addTo(map);
    </script>
</body>
</html>
```

**Why it works:**
- Leaflet replaces `{z}/{x}/{y}` with actual coordinates
- Requests tiles as user interacts with map
- Displays NDVI visualization correctly

---

### Solution 3: Use Google Maps (Web Development)

```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY"></script>
    <style>
        #map { height: 600px; }
    </style>
</head>
<body>
    <div id="map"></div>
    
    <script>
        const map = new google.maps.Map(document.getElementById('map'), {
            zoom: 15,
            center: { lat: 23.84, lng: 90.37 }
        });
        
        const mapId = 'abc123def456xyz';
        const token = 'xyz789uvw012abc';
        
        const ndviLayer = new google.maps.ImageMapType({
            getTileUrl: function(coord, zoom) {
                return `https://earthengine.googleapis.com/map/${mapId}/${zoom}/${coord.x}/${coord.y}?token=${token}`;
            },
            tileSize: new google.maps.Size(256, 256),
            name: 'NDVI'
        });
        
        map.overlayMapTypes.push(ndviLayer);
    </script>
</body>
</html>
```

---

### Solution 4: Use Python (Data Science)

```python
import folium

# Create map
m = folium.Map(
    location=[23.84, 90.37],
    zoom_start=15
)

# Add NDVI layer
map_id = 'abc123def456xyz'
token = 'xyz789uvw012abc'

folium.TileLayer(
    tiles=f'https://earthengine.googleapis.com/map/{map_id}/{{z}}/{{x}}/{{y}}?token={token}',
    attr='Google Earth Engine',
    overlay=True,
    name='NDVI'
).add_to(m)

m.save('ndvi_map.html')
```

---

## 📊 Comparison of Solutions

| Solution | Ease | Features | Best For |
|----------|------|----------|----------|
| Web Viewer | ⭐⭐⭐⭐⭐ | Full featured | Quick testing |
| Leaflet | ⭐⭐⭐⭐ | Lightweight | Web apps |
| Google Maps | ⭐⭐⭐ | Advanced | Complex apps |
| Python/Folium | ⭐⭐⭐⭐ | Data science | Analysis |

---

## 🚀 Quick Start

### Step 1: Get Map URLs
```bash
curl -X POST http://localhost:3000/api/field-analysis/time-series-map \
  -H "Content-Type: application/json" \
  -d '{
    "fieldBoundary": {...},
    "fieldId": "NGR-KD-12345",
    "startDate": "2025-01-01",
    "endDate": "2025-12-31",
    "intervalDays": 10
  }'
```

### Step 2: Extract Map Data
```json
{
  "maps": [
    {
      "map_id": "abc123def456xyz",
      "map_token": "xyz789uvw012abc",
      "map_url": "https://earthengine.googleapis.com/map/abc123def456xyz/{z}/{x}/{y}?token=xyz789uvw012abc"
    }
  ]
}
```

### Step 3: Use in Mapping Library
```javascript
// Leaflet example
L.tileLayer(
    `https://earthengine.googleapis.com/map/${mapId}/{z}/{x}/{y}?token=${token}`,
    { attribution: 'Google Earth Engine' }
).addTo(map);
```

### Step 4: View on Map
Map displays NDVI visualization with color palette.

---

## ⚠️ Common Mistakes

### ❌ Mistake 1: Accessing URL Directly
```
❌ https://earthengine.googleapis.com/map/abc123/{z}/{x}/{y}?token=xyz
→ 404 Error
```

### ✅ Correct: Use Mapping Library
```
✅ L.tileLayer('https://earthengine.googleapis.com/map/abc123/{z}/{x}/{y}?token=xyz')
→ Works correctly
```

---

### ❌ Mistake 2: Hardcoding Coordinates
```
❌ https://earthengine.googleapis.com/map/abc123/15/10234/6789?token=xyz
→ Only works for one zoom level
```

### ✅ Correct: Use Template
```
✅ https://earthengine.googleapis.com/map/abc123/{z}/{x}/{y}?token=xyz
→ Works for all zoom levels
```

---

### ❌ Mistake 3: Expired Token
```
❌ Token from old API response
→ 401 Unauthorized
```

### ✅ Correct: Fresh Token
```
✅ Get new map URLs from API
→ Token is valid
```

---

## 🔍 Debugging Tips

### Check 1: Verify Map ID and Token
```javascript
console.log('Map ID:', mapId);
console.log('Token:', token);
console.log('URL:', `https://earthengine.googleapis.com/map/${mapId}/{z}/{x}/{y}?token=${token}`);
```

### Check 2: Verify Mapping Library
```javascript
console.log('Leaflet loaded:', typeof L !== 'undefined');
console.log('Map initialized:', map !== null);
```

### Check 3: Check Browser Console
- Open DevTools (F12)
- Go to Console tab
- Look for errors
- Check Network tab for tile requests

### Check 4: Verify API Response
```bash
curl http://localhost:3000/api/field-analysis/time-series-map | jq '.data.maps[0]'
```

---

## 📞 Support

### If You Still Get 404

1. **Check if using mapping library** - Don't access URL directly
2. **Verify map ID and token** - Get fresh from API
3. **Check browser console** - Look for errors
4. **Try web viewer** - `http://localhost:3000/ndvi-map-viewer.html`
5. **Check documentation** - See `HOW_TO_USE_MAP_URLS.md`

---

## ✅ Verification Checklist

- [ ] Using mapping library (Leaflet, Google Maps, etc.)
- [ ] Map ID and token from API response
- [ ] URL template has `{z}/{x}/{y}` placeholders
- [ ] Token is not expired
- [ ] Browser console shows no errors
- [ ] Map displays NDVI visualization

---

**Status:** ✅ Complete  
**Last Updated:** October 23, 2025

