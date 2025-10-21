// Initialize map
let map;
let currentLayer = null;

const regions = {
    california: {
        name: 'California',
        bounds: [[-120, 40], [-119, 41]],
        center: [-119.5, 40.5],
        zoom: 8
    },
    amazon: {
        name: 'Amazon Rainforest',
        bounds: [[-75, -5], [-60, 5]],
        center: [-67.5, 0],
        zoom: 6
    },
    sahara: {
        name: 'Sahara Desert',
        bounds: [[-10, 15], [10, 35]],
        center: [0, 25],
        zoom: 6
    }
};

// Initialize Leaflet map
function initMap() {
    map = L.map('map').setView([20, 0], 3);
    
    // Add base layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);
    
    console.log('Map initialized');
}

// Check server health
async function checkServerHealth() {
    try {
        const response = await fetch('/api/health');
        const data = await response.json();

        if (data.status === 'ok') {
            updateStatus('Connected to server', 'success');
            document.getElementById('connectionStatus').textContent = '✓ Connected';

            // Check Earth Engine status
            checkEarthEngineStatus();
            return true;
        }
    } catch (error) {
        console.error('Server health check failed:', error);
        updateStatus('Failed to connect to server', 'error');
        document.getElementById('connectionStatus').textContent = '✗ Disconnected';
        return false;
    }
}

// Check Earth Engine initialization status
async function checkEarthEngineStatus() {
    try {
        const response = await fetch('/api/ee-status');
        const data = await response.json();

        if (data.initialized) {
            console.log('✅ Earth Engine is initialized and ready');
            document.getElementById('connectionStatus').innerHTML = '✓ Connected | 🌍 EE Ready';
        } else {
            console.log('⏳ Earth Engine is initializing...');
            document.getElementById('connectionStatus').innerHTML = '✓ Connected | ⏳ EE Initializing...';
            // Retry after 2 seconds
            setTimeout(checkEarthEngineStatus, 2000);
        }
    } catch (error) {
        console.error('Error checking Earth Engine status:', error);
    }
}

// Update status message
function updateStatus(message, type = 'loading') {
    const statusEl = document.getElementById('status');
    statusEl.textContent = message;
    statusEl.className = `status ${type}`;
}

// Load Earth Engine data
async function loadData() {
    const dataType = document.getElementById('dataType').value;
    const region = document.getElementById('region').value;
    
    updateStatus('Loading data...', 'loading');
    
    try {
        let endpoint = '/api/ndvi';
        
        if (dataType === 'satellite') {
            endpoint = '/api/satellite';
        } else if (dataType === 'landcover') {
            endpoint = '/api/landcover';
        }
        
        const response = await fetch(endpoint);
        const data = await response.json();
        
        if (data.success) {
            // For demonstration, we'll show a message
            updateStatus(`✓ ${data.message}`, 'success');
            document.getElementById('dataInfo').textContent = `Loaded: ${dataType} for ${region}`;
            
            // Add a visual indicator to the map
            const regionData = regions[region] || regions.california;
            if (currentLayer) {
                map.removeLayer(currentLayer);
            }
            
            // Add a rectangle to show the region
            currentLayer = L.rectangle(regionData.bounds, {
                color: '#667eea',
                weight: 2,
                opacity: 0.7,
                fillOpacity: 0.1
            }).addTo(map);
            
            map.fitBounds(regionData.bounds);
            
            console.log('Data loaded:', data);
        } else {
            updateStatus(`Error: ${data.error}`, 'error');
        }
    } catch (error) {
        console.error('Error loading data:', error);
        updateStatus(`Error: ${error.message}`, 'error');
    }
}

// Clear map
function clearMap() {
    if (currentLayer) {
        map.removeLayer(currentLayer);
        currentLayer = null;
    }
    document.getElementById('dataInfo').textContent = '';
    updateStatus('Map cleared', 'success');
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    checkServerHealth();
    
    document.getElementById('loadBtn').addEventListener('click', loadData);
    document.getElementById('clearBtn').addEventListener('click', clearMap);
    
    // Update map view when region changes
    document.getElementById('region').addEventListener('change', (e) => {
        const region = e.target.value;
        if (region !== 'custom' && regions[region]) {
            const regionData = regions[region];
            map.fitBounds(regionData.bounds);
        }
    });
});

// Add some example data visualization
function addExampleLayer() {
    // Add a sample GeoJSON layer
    const exampleGeoJSON = {
        type: 'FeatureCollection',
        features: [
            {
                type: 'Feature',
                properties: { name: 'Sample Area' },
                geometry: {
                    type: 'Polygon',
                    coordinates: [[
                        [-120, 40],
                        [-119, 40],
                        [-119, 41],
                        [-120, 41],
                        [-120, 40]
                    ]]
                }
            }
        ]
    };
    
    L.geoJSON(exampleGeoJSON, {
        style: {
            color: '#667eea',
            weight: 2,
            opacity: 0.7,
            fillOpacity: 0.1
        }
    }).addTo(map);
}

console.log('Google Earth Engine Map Viewer loaded');

