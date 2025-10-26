# 🗺️ How to Use Map URLs - Complete Guide

**Version:** 1.0.0  
**Date:** October 23, 2025  

---

## ⚠️ IMPORTANT: Understanding Map URLs

### The Problem
When you try to access the map URL directly in a browser:
```
https://earthengine.googleapis.com/map/abc123def456/{z}/{x}/{y}?token=xyz789uvw012
```

You get **404 Not Found** because:
- ❌ `{z}`, `{x}`, `{y}` are **PLACEHOLDERS**, not actual values
- ❌ The URL is a **TEMPLATE** for tile servers
- ❌ You need a **MAPPING LIBRARY** to use it properly

### The Solution
Use a mapping library like **Leaflet.js** or **Google Maps** to display the tiles.

---

## ✅ How to Use Map URLs Correctly

### Option 1: Leaflet.js (Recommended - Easiest)

#### HTML File
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
        
        // Add base layer (OpenStreetMap)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(map);
        
        // Add NDVI layer from API response
        const mapId = 'abc123def456xyz';
        const token = 'xyz789uvw012abc';
        
        L.tileLayer(
            `https://earthengine.googleapis.com/map/${mapId}/{z}/{x}/{y}?token=${token}`,
            {
                attribution: 'Google Earth Engine',
                maxZoom: 20,
                opacity: 0.7
            }
        ).addTo(map);
    </script>
</body>
</html>
```

### Option 2: Google Maps

#### HTML File
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
        
        // Add NDVI layer
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

### Option 3: Folium (Python)

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

## 🔄 Complete Workflow

### Step 1: Get Map URLs from API
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
      "date": "2025-01-10",
      "map_url": "https://earthengine.googleapis.com/map/abc123/{z}/{x}/{y}?token=xyz789",
      "map_id": "abc123",
      "map_token": "xyz789",
      "statistics": {...}
    }
  ]
}
```

### Step 3: Use in Web Application
```javascript
// Extract from response
const mapId = response.data.maps[0].map_id;
const token = response.data.maps[0].map_token;

// Create tile layer
const tileLayer = L.tileLayer(
    `https://earthengine.googleapis.com/map/${mapId}/{z}/{x}/{y}?token=${token}`,
    { attribution: 'Google Earth Engine' }
).addTo(map);
```

### Step 4: Display on Map
The map will now show the NDVI visualization with the color palette.

---

## 📊 Understanding Tile Coordinates

The URL template uses **Web Mercator tile coordinates**:

```
https://earthengine.googleapis.com/map/{mapId}/{z}/{x}/{y}?token={token}
```

- **{z}** = Zoom level (0-20)
  - 0 = World view
  - 15 = City level
  - 20 = Street level

- **{x}** = Tile column (0 to 2^z - 1)
- **{y}** = Tile row (0 to 2^z - 1)

**Example:**
```
https://earthengine.googleapis.com/map/abc123/15/10234/6789?token=xyz789
```
- Zoom: 15 (city level)
- Tile: Column 10234, Row 6789

---

## 🎨 Displaying Multiple Maps (Time Series)

### Leaflet Example
```javascript
const maps = response.data.maps;
const layerControl = L.control.layers({}, {});

maps.forEach((mapData, index) => {
    const layer = L.tileLayer(
        `https://earthengine.googleapis.com/map/${mapData.map_id}/{z}/{x}/{y}?token=${mapData.map_token}`,
        { attribution: `NDVI - ${mapData.date}` }
    );
    
    layerControl.addOverlay(layer, `${mapData.date} (NDVI: ${mapData.statistics.mean_ndvi})`);
});

layerControl.addTo(map);
```

### Result
- Users can toggle between different dates
- Compare vegetation changes over time
- See NDVI statistics for each date

---

## 🔧 Troubleshooting

### Issue 1: 404 Not Found
**Problem:** Accessing URL directly in browser  
**Solution:** Use a mapping library (Leaflet, Google Maps, etc.)

### Issue 2: Blank Map
**Problem:** Token expired or invalid  
**Solution:** Get fresh map URLs from API

### Issue 3: CORS Error
**Problem:** Cross-origin request blocked  
**Solution:** Use CORS proxy or server-side request

### Issue 4: Tiles Not Loading
**Problem:** Wrong zoom level or coordinates  
**Solution:** Ensure mapping library is handling tile requests

---

## 📚 Complete Example: React Component

```javascript
import React, { useEffect, useState } from 'react';
import L from 'leaflet';

function NDVIMapViewer({ mapId, token, date }) {
    const [map, setMap] = useState(null);

    useEffect(() => {
        // Initialize map
        const mapInstance = L.map('map').setView([23.84, 90.37], 15);

        // Add base layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap',
            maxZoom: 19
        }).addTo(mapInstance);

        // Add NDVI layer
        L.tileLayer(
            `https://earthengine.googleapis.com/map/${mapId}/{z}/{x}/{y}?token=${token}`,
            {
                attribution: 'Google Earth Engine',
                opacity: 0.7
            }
        ).addTo(mapInstance);

        setMap(mapInstance);

        return () => mapInstance.remove();
    }, [mapId, token]);

    return (
        <div>
            <h2>NDVI Map - {date}</h2>
            <div id="map" style={{ height: '600px' }}></div>
        </div>
    );
}

export default NDVIMapViewer;
```

---

## ✅ Best Practices

1. **Always use a mapping library** - Don't access URLs directly
2. **Cache map IDs and tokens** - Reduce API calls
3. **Implement layer switching** - Let users compare dates
4. **Add legends** - Show NDVI color meanings
5. **Handle errors** - Gracefully handle expired tokens
6. **Optimize performance** - Load maps on demand

---

## 📞 Summary

| Task | Solution |
|------|----------|
| Display single map | Use Leaflet.js |
| Display multiple maps | Use layer control |
| Compare time series | Toggle between layers |
| Embed in web app | Use React/Vue component |
| Mobile app | Use Leaflet Mobile |

---

**Status:** ✅ Complete  
**Last Updated:** October 23, 2025

