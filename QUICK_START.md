# Quick Start Guide

## 🚀 Get Started in 30 Seconds

### 1. Start the Server
```bash
npm start
```

You should see:
```
✅ Earth Engine authenticated with service account
✅ Earth Engine initialized successfully
🌍 Google Earth Engine Server running on http://localhost:3000
```

### 2. Open in Browser
Navigate to: **http://localhost:3000**

### 3. Load Data
1. Select a data type: **NDVI**, **Satellite Imagery**, or **Land Cover**
2. Choose a region: **California**, **Amazon**, or **Sahara**
3. Click **"Load Data"**
4. Watch the map update with Earth Engine data!

## 📊 What's Included

✅ **Service Account Authentication** - Automatic login with your credentials  
✅ **Interactive Map** - Leaflet-based visualization  
✅ **Multiple Datasets** - NDVI, Satellite, Land Cover  
✅ **Pre-configured Regions** - California, Amazon, Sahara  
✅ **Real-time Status** - See Earth Engine initialization status  
✅ **REST API** - Access data programmatically  

## 🔗 API Endpoints

### Check Status
```bash
curl http://localhost:3000/api/health
curl http://localhost:3000/api/ee-status
```

### Get Data
```bash
curl http://localhost:3000/api/ndvi
curl http://localhost:3000/api/satellite
```

## 📁 Project Files

| File | Purpose |
|------|---------|
| `server.js` | Express backend with Earth Engine integration |
| `credentials.json` | Service account credentials (auto-loaded) |
| `public/index.html` | Web interface |
| `public/app.js` | Frontend logic |
| `public/styles.css` | Styling |
| `.env` | Configuration |

## 🔑 Credentials

**Project**: marine-pillar-465804-p5  
**Email**: imteaj@marine-pillar-465804-p5.iam.gserviceaccount.com  
**Status**: ✅ Automatically authenticated on startup

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| Server won't start | Check `credentials.json` exists |
| "EE Initializing..." stuck | Wait 5 seconds, check server logs |
| Port 3000 in use | `PORT=3001 npm start` |
| No data loading | Verify internet connection |

## 📚 Learn More

- **Full Setup**: See `README.md`
- **Technical Details**: See `CREDENTIALS_SETUP.md`
- **Integration Summary**: See `INTEGRATION_SUMMARY.md`

## 🎯 Next Steps

1. ✅ Server running
2. ✅ Earth Engine authenticated
3. 👉 **Explore the map and load data!**
4. 📖 Read `README.md` for advanced features
5. 🚀 Deploy to production (see `INTEGRATION_SUMMARY.md`)

---

**Status**: ✅ Ready to use!  
**Server**: http://localhost:3000  
**Documentation**: See README.md for full details

