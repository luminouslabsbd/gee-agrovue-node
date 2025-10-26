# 🔄 NDVI 2-Year Viewer - Workflow & Architecture

## User Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                    User Opens Viewer                         │
│         http://localhost:3000/ndvi-two-year-viewer.html      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Page Loads & Map Initializes                    │
│  - Leaflet map created                                       │
│  - OpenStreetMap base layer added                            │
│  - UI components rendered                                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│           User Selects Interval Type                         │
│  - Monthly (24 data points)                                  │
│  - Weekly (104 data points)                                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│      User Clicks "Generate 2-Year Analysis"                  │
│  - Loading spinner shows                                     │
│  - API request sent to backend                               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│         Backend Processes Request                            │
│  - Generates 2-year NDVI time series                         │
│  - Calculates statistics                                     │
│  - Saves images to server                                    │
│  - Returns data with download URLs                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│         Frontend Displays Results                            │
│  - Statistics box populated                                  │
│  - Timeline items created                                    │
│  - Gallery cards generated                                   │
│  - Tabs enabled                                              │
│  - Success message shown                                     │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
┌──────────────────┐    ┌──────────────────┐
│  View Timeline   │    │  View Gallery    │
│  - Click date    │    │  - See all cards │
│  - View on map   │    │  - Quick actions │
└────────┬─────────┘    └────────┬─────────┘
         │                       │
         └───────────┬───────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │  Select Time Point     │
        │  - Map updates         │
        │  - Active state shown  │
        └────────────┬───────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
┌──────────────────┐    ┌──────────────────┐
│  View on Map     │    │  Download Image  │
│  - NDVI overlay  │    │  - Modal opens   │
│  - Zoom/pan      │    │  - Details shown │
└──────────────────┘    │  - Download file │
                        └──────────────────┘
```

---

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Browser)                        │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              User Interface                          │  │
│  │  - Header with title                                │  │
│  │  - Map container                                    │  │
│  │  - Sidebar with controls                            │  │
│  │  - Tabs (Timeline/Gallery)                          │  │
│  │  - Download modal                                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                         │                                    │
│                         ▼                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         JavaScript Event Handlers                    │  │
│  │  - generateAnalysis()                               │  │
│  │  - selectTimePoint()                                │  │
│  │  - switchTab()                                      │  │
│  │  - openDownloadModal()                              │  │
│  │  - downloadImage()                                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                         │                                    │
└─────────────────────────┼────────────────────────────────────┘
                          │
                          ▼
                    ┌──────────────┐
                    │  HTTP API    │
                    │  POST/GET    │
                    └──────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Node.js)                         │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Express.js Routes                            │  │
│  │  - POST /api/field-analysis/two-year-time-series    │  │
│  │  - GET /api/field-analysis/time-series/:seriesId    │  │
│  │  - GET /api/field-analysis/time-series-list         │  │
│  │  - GET /api/field-analysis/time-series-stats        │  │
│  │  - DELETE /api/field-analysis/time-series/:seriesId │  │
│  └──────────────────────────────────────────────────────┘  │
│                         │                                    │
│                         ▼                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Service Layer                                │  │
│  │  - NDVITwoYearTimeSeriesService                      │  │
│  │  - TimeSeriesImageStorageService                     │  │
│  │  - FieldAnalysisService                              │  │
│  └──────────────────────────────────────────────────────┘  │
│                         │                                    │
│                         ▼                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         External Services                            │  │
│  │  - Google Earth Engine API                           │  │
│  │  - Sentinel-2 Satellite Data                         │  │
│  └──────────────────────────────────────────────────────┘  │
│                         │                                    │
│                         ▼                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Storage Layer                                │  │
│  │  - public/time-series-images/                        │  │
│  │  - Image metadata (JSON)                             │  │
│  │  - Metadata index                                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   NDVI 2-Year Viewer                         │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                    Header                            │  │
│  │  - Title with icon                                  │  │
│  │  - Description                                      │  │
│  │  - Status messages                                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                    Content                           │  │
│  │                                                      │  │
│  │  ┌────────────────────┐  ┌──────────────────────┐  │  │
│  │  │                    │  │                      │  │  │
│  │  │   Map Container    │  │     Sidebar          │  │  │
│  │  │                    │  │                      │  │  │
│  │  │  - Leaflet Map     │  │  ┌────────────────┐ │  │  │
│  │  │  - Base Layer      │  │  │ Settings       │ │  │  │
│  │  │  - NDVI Overlay    │  │  │ - Interval     │ │  │  │
│  │  │  - Controls        │  │  │ - Generate btn │ │  │  │
│  │  │                    │  │  └────────────────┘ │  │  │
│  │  │                    │  │                      │  │  │
│  │  │                    │  │  ┌────────────────┐ │  │  │
│  │  │                    │  │  │ Statistics     │ │  │  │
│  │  │                    │  │  │ - Mean NDVI    │ │  │  │
│  │  │                    │  │  │ - Std Dev      │ │  │  │
│  │  │                    │  │  │ - Min/Max      │ │  │  │
│  │  │                    │  │  │ - Trend        │ │  │  │
│  │  │                    │  │  └────────────────┘ │  │  │
│  │  │                    │  │                      │  │  │
│  │  │                    │  │  ┌────────────────┐ │  │  │
│  │  │                    │  │  │ Tabs           │ │  │  │
│  │  │                    │  │  │ - Timeline     │ │  │  │
│  │  │                    │  │  │ - Gallery      │ │  │  │
│  │  │                    │  │  └────────────────┘ │  │  │
│  │  │                    │  │                      │  │  │
│  │  │                    │  │  ┌────────────────┐ │  │  │
│  │  │                    │  │  │ Legend         │ │  │  │
│  │  │                    │  │  │ - Color scale  │ │  │  │
│  │  │                    │  │  └────────────────┘ │  │  │
│  │  │                    │  │                      │  │  │
│  │  └────────────────────┘  └──────────────────────┘  │  │
│  │                                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Download Modal                          │  │
│  │  - Image details                                    │  │
│  │  - Download URL                                    │  │
│  │  - Action buttons                                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## State Management

```
Global Variables:
├── map: Leaflet map instance
├── currentLayers: Array of active tile layers
├── allTimeSeries: Array of time series data points
├── currentSeriesId: ID of current series
└── currentDownloadData: Data for download modal

State Updates:
├── generateAnalysis() → Updates allTimeSeries, currentSeriesId
├── selectTimePoint() → Updates currentLayers, active states
├── switchTab() → Updates tab visibility
├── openDownloadModal() → Updates currentDownloadData
└── downloadImage() → Triggers download
```

---

## API Response Processing

```
API Response
    │
    ├─ Extract time_series array
    │   └─ For each item:
    │       ├─ Store date, NDVI values
    │       ├─ Store map_id, map_token
    │       ├─ Store download_url
    │       └─ Store statistics
    │
    ├─ Extract statistics
    │   ├─ overall_mean_ndvi
    │   ├─ overall_std_ndvi
    │   ├─ min_ndvi
    │   └─ max_ndvi
    │
    ├─ Extract trends
    │   ├─ trend (improving/stable/declining)
    │   └─ change_percentage
    │
    └─ Extract series_id
        └─ Store for tracking
```

---

## Performance Optimization

```
Frontend Optimization:
├─ CSS Grid for layout
├─ CSS transitions for animations
├─ Event delegation for clicks
├─ Lazy rendering of timeline items
└─ Efficient DOM updates

Backend Optimization:
├─ Caching of time series data
├─ Efficient image storage
├─ Metadata indexing
├─ Auto-cleanup of old series
└─ Optimized queries
```

---

**Architecture Version:** 1.0.0 | **Last Updated:** 2025-10-26

