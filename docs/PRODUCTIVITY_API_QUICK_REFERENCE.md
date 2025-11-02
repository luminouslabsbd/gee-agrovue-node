# 🚀 Productivity Differences API - Quick Reference

## 📋 API Endpoint

```
POST http://localhost:3000/api/field-analysis/productivity-differences
```

---

## 🔥 cURL Command (Copy & Paste)

```bash
curl --location 'http://localhost:3000/api/field-analysis/productivity-differences' \
--header 'Content-Type: application/json' \
--data '{
  "fieldBoundary": {
    "type": "Polygon",
    "coordinates": [
      [
        [9.15, 45.45],
        [9.16, 45.45],
        [9.16, 45.46],
        [9.15, 45.46],
        [9.15, 45.45]
      ]
    ]
  },
  "fieldId": "ITALY-RICE-FIELD",
  "date": "2024-07-15"
}'
```

---

## 📊 Response (JSON)

```json
{
  "success": true,
  "field_id": "ITALY-RICE-FIELD",
  "analysis_date": "2024-07-15",
  "field_statistics": {
    "mean_ndvi": 0.2742,
    "std_dev_ndvi": 0.1918,
    "min_ndvi": -0.0312,
    "max_ndvi": 0.8093,
    "image_count": 2
  },
  "productivity_differences": {
    "m3": 69,
    "m2": 87,
    "m1": 95,
    "p0": 100,
    "p1": 107,
    "p2": 111,
    "p3": 119
  },
  "available_productivity_zones": [
    "m3", "m2", "m1", "p0", "p1", "p2", "p3"
  ],
  "zone_distribution": {
    "m3": {
      "pixel_count": 17,
      "percentage": 0.14,
      "productivity_percentage": 69,
      "label": "Very Low Productivity"
    },
    "m2": {
      "pixel_count": 5382.4,
      "percentage": 43.46,
      "productivity_percentage": 87,
      "label": "Low Productivity"
    },
    "m1": {
      "pixel_count": 1288.31,
      "percentage": 10.4,
      "productivity_percentage": 95,
      "label": "Below Average"
    },
    "p0": {
      "pixel_count": 1614.51,
      "percentage": 13.04,
      "productivity_percentage": 100,
      "label": "Average Productivity"
    },
    "p1": {
      "pixel_count": 668.37,
      "percentage": 5.4,
      "productivity_percentage": 107,
      "label": "Above Average"
    },
    "p2": {
      "pixel_count": 1934.18,
      "percentage": 15.62,
      "productivity_percentage": 111,
      "label": "High Productivity"
    },
    "p3": {
      "pixel_count": 1478.56,
      "percentage": 11.94,
      "productivity_percentage": 119,
      "label": "Very High Productivity"
    }
  },
  "images": {
    "ndvi_map": "/productivity-zones/ITALY-RICE-FIELD/ndvi_map.png",
    "productivity_zones_map": "/productivity-zones/ITALY-RICE-FIELD/productivity_zones.png"
  },
  "zone_details": [
    {
      "code": "m3",
      "label": "Very Low Productivity",
      "productivity_percentage": 69,
      "color": "#8B0000",
      "management": "Urgent intervention - soil testing, drainage, pest control"
    },
    {
      "code": "m2",
      "label": "Low Productivity",
      "productivity_percentage": 87,
      "color": "#DC143C",
      "management": "Targeted fertilization and irrigation needed"
    },
    {
      "code": "m1",
      "label": "Below Average",
      "productivity_percentage": 95,
      "color": "#FF8C00",
      "management": "Monitor closely, consider soil amendments"
    },
    {
      "code": "p0",
      "label": "Average Productivity",
      "productivity_percentage": 100,
      "color": "#FFD700",
      "management": "Maintain current practices"
    },
    {
      "code": "p1",
      "label": "Above Average",
      "productivity_percentage": 107,
      "color": "#9ACD32",
      "management": "Good performance, optimize for maximum yield"
    },
    {
      "code": "p2",
      "label": "High Productivity",
      "productivity_percentage": 111,
      "color": "#32CD32",
      "management": "Excellent conditions, use as reference"
    },
    {
      "code": "p3",
      "label": "Very High Productivity",
      "productivity_percentage": 119,
      "color": "#006400",
      "management": "Optimal productivity, replicate conditions"
    }
  ]
}
```

---

## 🖼️ View Images

**NDVI Map:**
```
http://localhost:3000/productivity-zones/ITALY-RICE-FIELD/ndvi_map.png
```

**Productivity Zones Map:**
```
http://localhost:3000/productivity-zones/ITALY-RICE-FIELD/productivity_zones.png
```

---

## 📊 Zone Summary

| Zone | % of Field | Productivity | Action Needed |
|------|-----------|--------------|---------------|
| 🔴 m3 | 0.14% | 69% | Urgent intervention |
| 🔴 m2 | **43.46%** | 87% | Fertilization needed |
| 🟠 m1 | 10.40% | 95% | Monitor closely |
| 🟡 p0 | 13.04% | 100% | Maintain practices |
| 🟢 p1 | 5.40% | 107% | Optimize yield |
| 🟢 p2 | 15.62% | 111% | Use as reference |
| 🟢 p3 | 11.94% | 119% | Replicate conditions |

**Key Insight:** 43.46% of field needs targeted fertilization and irrigation (m2 zone)

---

## ⚡ Performance

- **Response Time:** 12 seconds
- **HTTP Status:** 200 OK
- **Response Size:** 2.6 KB
- **Images Generated:** 2 (NDVI + Zones)
- **Zones Detected:** All 7 zones

---

## 📦 Postman Collection

Import this file into Postman:
```
postman/Productivity_Differences_API.postman_collection.json
```

---

## 📚 Full Documentation

- **API Docs:** `docs/PRODUCTIVITY_DIFFERENCES_API_COMPLETE.md`
- **Test Results:** `docs/PRODUCTIVITY_DIFFERENCES_TEST_RESULTS.md`
- **Quick Reference:** `docs/PRODUCTIVITY_API_QUICK_REFERENCE.md` (this file)

---

**Status:** ✅ Production Ready  
**Last Updated:** 2025-11-01

