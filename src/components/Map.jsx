import {createSignal, createEffect, onMount, onCleanup} from 'solid-js';
import {Map as OLMap, View} from 'ol';
import {OSM} from 'ol/source';
import {Tile as TileLayer, Vector as VectorLayer} from 'ol/layer';
import {Vector as VectorSource} from 'ol/source';
import {GeoJSON} from 'ol/format';
import {Style, Fill, Stroke, Circle as CircleStyle} from 'ol/style';
import {fromLonLat} from 'ol/proj';
import 'ol/ol.css';
import {applyPolygonColors, getPolygonStyleFunction, getMarkerStyle} from '../utils/colorUtils';
import MapService from '../services/MapService';
import DataService from '../services/DataService';

/**
 * Map component that displays OpenLayers map with GeoJSON polygons and location markers
 */
function Map() {
    const [map, setMap] = createSignal(null);
    const [geojsonSource, setGeojsonSource] = createSignal(null);
    const [markersSource, setMarkersSource] = createSignal(null);

    // Initialize map on component mount
    onMount(() => {
        // Create vector sources for GeoJSON and markers
        const geoJsonVectorSource = new VectorSource();
        const markersVectorSource = new VectorSource();

        setGeojsonSource(geoJsonVectorSource);
        setMarkersSource(markersVectorSource);

        // Create vector layers for GeoJSON and markers
        const geoJsonVectorLayer = new VectorLayer({
            source: geoJsonVectorSource,
            style: getPolygonStyleFunction()
        });

        const markersVectorLayer = new VectorLayer({
            source: markersVectorSource,
            style: getMarkerStyle()
        });

        // Create map
        const olMap = new OLMap({
            target: 'map',
            layers: [
                new TileLayer({
                    source: new OSM()
                }),
                geoJsonVectorLayer,
                markersVectorLayer
            ],
            view: new View({
                center: fromLonLat([0, 0]),
                zoom: 2
            })
        });

        setMap(olMap);

        // Initialize MapService
        MapService.initialize(olMap, geoJsonVectorSource, markersVectorSource);

        // Load GeoJSON and CSV data
        loadGeoJSONData();
        loadCSVData();
    });

    // Clean up map on component unmount
    onCleanup(() => {
        if (map()) {
            map().setTarget(null);
        }
    });

    // Load GeoJSON data from backend API
    const loadGeoJSONData = async () => {
        try {
            // Array to store all GeoJSON content for cache validation
            const allGeojsonContents = [];
            // Array to store all features from all GeoJSON files
            const allFeatures = [];

            // Fetch all GeoJSON data from the backend API
            const geojsonDataArray = await DataService.fetchAllGeoJSON();

            if (!geojsonDataArray || !Array.isArray(geojsonDataArray)) {
                console.error('Invalid GeoJSON data received from backend');
                return;
            }

            if (geojsonDataArray.length === 0) {
                console.warn('No GeoJSON data received from backend');
                return;
            }

            // Process each GeoJSON object
            for (const geojsonData of geojsonDataArray) {
                try {
                    const geojsonContent = JSON.stringify(geojsonData);

                    // Add to the array of GeoJSON contents for cache validation
                    allGeojsonContents.push(geojsonContent);

                    if (geojsonSource()) {
                        const geoJsonFormat = new GeoJSON();
                        const features = geoJsonFormat.readFeatures(geojsonData, {
                            featureProjection: 'EPSG:3857'
                        });

                        // Add features to the array of all features
                        allFeatures.push(...features);
                    }
                } catch (parseError) {
                    console.error(`Error processing GeoJSON data:`, parseError);
                }
            }

            // Update geojsonFiles for cache validation
            setGeojsonFiles([...geojsonFiles(), ...allGeojsonContents]);

            if (geojsonSource() && allFeatures.length > 0) {
                // Apply polygon colors using the utility function
                applyPolygonColors(allFeatures, geojsonFiles());

                // Add all features to the source
                geojsonSource().addFeatures(allFeatures);

                // Fit map to GeoJSON extent
                if (map()) {
                    map().getView().fit(geojsonSource().getExtent(), {
                        padding: [50, 50, 50, 50],
                        maxZoom: 16
                    });
                }
            } else {
                console.warn('No valid features found in GeoJSON data');
            }
        } catch (error) {
            console.error('Error loading GeoJSON data:', error);
            // You could add UI notification here for better user experience
        }
    };

    // Load CSV data from backend API
    const loadCSVData = async () => {
        try {
            // Fetch CSV data from the backend API
            const csvText = await DataService.fetchCSVData();

            if (!csvText || typeof csvText !== 'string' || csvText.trim() === '') {
                console.error('Invalid or empty CSV data received from backend');
                return;
            }

            // Parse CSV
            const lines = csvText.split('\r\n');

            if (lines.length < 2) {
                console.warn('CSV data contains no records (only headers or empty)');
                return;
            }

            const headers = lines[0].split(',');

            // Find column indices
            const locationIndex = headers.findIndex(h => h.toLowerCase() === 'stazionamento');
            const latIndex = headers.findIndex(h => h.toLowerCase() === 'lat');
            const lonIndex = headers.findIndex(h => h.toLowerCase() === 'lon');

            if (locationIndex === -1 || latIndex === -1 || lonIndex === -1) {
                console.error('CSV must contain location (stazionamento), latitude (lat), and longitude (lon) columns');
                return;
            }

            // Create features for each location
            const geoJsonFormat = new GeoJSON();
            const features = [];
            let invalidRecords = 0;

            for (let i = 1; i < lines.length; i++) {
                if (!lines[i].trim()) continue;

                const values = lines[i].split(',');

                // Check if we have enough values
                if (values.length <= Math.max(locationIndex, latIndex, lonIndex)) {
                    invalidRecords++;
                    continue;
                }

                const location = values[locationIndex];
                const lat = parseFloat(values[latIndex]);
                const lon = parseFloat(values[lonIndex]);

                if (isNaN(lat) || isNaN(lon)) {
                    invalidRecords++;
                    continue;
                }

                const feature = geoJsonFormat.readFeature({
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [lon, lat]
                    },
                    properties: {
                        name: location
                    }
                }, {
                    featureProjection: 'EPSG:3857'
                });

                features.push(feature);
            }

            if (invalidRecords > 0) {
                console.warn(`Skipped ${invalidRecords} invalid records in CSV data`);
            }

            if (features.length === 0) {
                console.warn('No valid location features found in CSV data');
                return;
            }

            if (markersSource()) {
                markersSource().addFeatures(features);
                console.log(`Added ${features.length} location markers to the map`);
            }
        } catch (error) {
            console.error('Error loading CSV data:', error);
            // You could add UI notification here for better user experience
        }
    };

    // Store GeoJSON file contents for cache validation
    const [geojsonFiles, setGeojsonFiles] = createSignal([]);

    return (
        <div class="w-full h-screen">
            <div id="map" class="w-full h-full"></div>
        </div>
    );
}

export default Map;
