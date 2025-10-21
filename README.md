# Google Earth Engine Node.js Map Viewer

A Node.js application that visualizes satellite imagery and geospatial data from Google Earth Engine.

## Features

- 🌍 Interactive map visualization using Leaflet
- 📡 Integration with Google Earth Engine API
- 🛰️ Support for multiple data types:
  - NDVI (Vegetation Index)
  - Satellite Imagery (Sentinel-2)
  - Land Cover Data
- 🎯 Pre-configured regions (California, Amazon, Sahara)
- 🚀 Express.js backend server
- 💻 Modern, responsive web interface

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Google Earth Engine account (free at https://earthengine.google.com/)

## Installation

1. **Clone or navigate to the project directory:**
   ```bash
   cd gee
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Google Earth Engine Service Account Credentials:**

   The project includes a `credentials.json` file with service account credentials for the Google Earth Engine project `marine-pillar-465804-p5`. These credentials are automatically loaded on server startup.

   **Note:** The credentials are already configured and the server will authenticate automatically when you start it.

4. **Environment Configuration** (already set up):
   The `.env` file contains:
   ```
   PORT=3000
   NODE_ENV=development
   GEE_PROJECT_ID=marine-pillar-465804-p5
   GEE_SERVICE_ACCOUNT_EMAIL=imteaj@marine-pillar-465804-p5.iam.gserviceaccount.com
   ```

## Running the Application

Start the development server:

```bash
npm start
```

Or use the dev script:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Server Startup Output

When the server starts, you should see:
```
✅ Earth Engine authenticated with service account
✅ Earth Engine initialized successfully
```

This confirms that the service account credentials are working correctly.

## Usage

1. Open your browser and navigate to `http://localhost:3000`
2. Select a data type from the dropdown (NDVI, Satellite Imagery, etc.)
3. Choose a region or enter custom coordinates
4. Click "Load Data" to fetch and display the data
5. Use "Clear Map" to reset the visualization

## Project Structure

```
gee/
├── server.js              # Express server and API endpoints
├── package.json           # Project dependencies
├── .env                   # Environment configuration
├── README.md              # This file
└── public/
    ├── index.html         # Main HTML page
    ├── app.js             # Frontend JavaScript
    └── styles.css         # Styling
```

## API Endpoints

### GET `/api/health`
Check if the server is running.

**Response:**
```json
{
  "status": "ok",
  "message": "Server is running"
}
```

### GET `/api/ndvi`
Fetch NDVI (Vegetation Index) data from MODIS satellite.

**Response:**
```json
{
  "success": true,
  "mapId": "...",
  "message": "NDVI data retrieved successfully"
}
```

### GET `/api/satellite`
Fetch Sentinel-2 satellite imagery.

**Response:**
```json
{
  "success": true,
  "mapId": "...",
  "message": "Satellite imagery retrieved successfully"
}
```

## Earth Engine Datasets Used

- **MODIS NDVI**: `MODIS/006/MOD13Q1` - Vegetation index data
- **Sentinel-2**: `COPERNICUS/S2_SR` - High-resolution satellite imagery
- **Land Cover**: Can be extended with additional datasets

## Customization

### Adding New Regions

Edit `public/app.js` and add to the `regions` object:

```javascript
const regions = {
    myregion: {
        name: 'My Region',
        bounds: [[lon1, lat1], [lon2, lat2]],
        center: [lon, lat],
        zoom: 8
    }
};
```

### Adding New Data Types

1. Add a new endpoint in `server.js`
2. Add the option to the select dropdown in `public/index.html`
3. Handle the new data type in `public/app.js`

## Service Account Credentials

This project uses Google Earth Engine service account credentials for authentication. The credentials are stored in `credentials.json` and include:

- **Project ID**: `marine-pillar-465804-p5`
- **Service Account Email**: `imteaj@marine-pillar-465804-p5.iam.gserviceaccount.com`
- **Authentication Method**: Private key authentication

### How It Works

1. On server startup, the `credentials.json` file is loaded
2. The server authenticates with Google Earth Engine using the private key
3. Once authenticated, all API endpoints can access Earth Engine datasets
4. The frontend checks the Earth Engine status via `/api/ee-status` endpoint

### Credentials Security

⚠️ **Important**: The `credentials.json` file contains sensitive authentication information. In production:
- Store credentials in environment variables or secure vaults
- Never commit credentials to version control
- Use appropriate access controls on the credentials file
- Consider rotating credentials periodically

## Troubleshooting

### Authentication Issues
The service account credentials are automatically loaded. If you see authentication errors:
1. Check that `credentials.json` exists in the project root
2. Verify the credentials are valid in your Google Cloud Console
3. Check the server logs for detailed error messages

### Port Already in Use
Change the PORT in `.env` file or use:
```bash
PORT=3001 npm start
```

### CORS Issues
The server includes CORS middleware. If you still have issues, check the browser console for specific errors.

### Earth Engine Not Initializing
If you see "Earth Engine is initializing..." in the UI:
1. Wait a few seconds for initialization to complete
2. Check the server logs for any authentication errors
3. Verify the credentials.json file is valid

## Resources

- [Google Earth Engine Documentation](https://developers.google.com/earth-engine)
- [Earth Engine JavaScript API](https://developers.google.com/earth-engine/apidocs)
- [Leaflet Documentation](https://leafletjs.com/)
- [Express.js Documentation](https://expressjs.com/)

## License

ISC

## Support

For issues or questions, refer to the Google Earth Engine documentation or check the browser console for error messages.

# gee-agrovue-node
