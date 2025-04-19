import { createSignal, createEffect, onMount, onCleanup } from 'solid-js';
import { Map as OLMap, View } from 'ol';
import { OSM } from 'ol/source';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import { GeoJSON } from 'ol/format';
import { Style, Fill, Stroke, Circle as CircleStyle } from 'ol/style';
import { fromLonLat } from 'ol/proj';
import 'ol/ol.css';
import { applyPolygonColors, getPolygonStyleFunction, getMarkerStyle } from '../utils/colorUtils';
import MapService from '../services/MapService';

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

  // Load GeoJSON data from environment variable
  const loadGeoJSONData = async () => {
    try {
      const geojsonPath = import.meta.env.VITE_GEOJSON_PATH;

      if (!geojsonPath) {
        console.error('VITE_GEOJSON_PATH environment variable is not set');
        return;
      }

      const response = await fetch(geojsonPath);
      const geojsonData = await response.json();
      const geojsonContent = JSON.stringify(geojsonData);

      // Update geojsonFiles for cache validation
      setGeojsonFiles([...geojsonFiles(), geojsonContent]);

      if (geojsonSource()) {
        const geoJsonFormat = new GeoJSON();
        const features = geoJsonFormat.readFeatures(geojsonData, {
          featureProjection: 'EPSG:3857'
        });

        // Apply polygon colors using the utility function
        applyPolygonColors(features, geojsonFiles());

        geojsonSource().addFeatures(features);

        // Fit map to GeoJSON extent
        if (map() && features.length > 0) {
          map().getView().fit(geojsonSource().getExtent(), {
            padding: [50, 50, 50, 50],
            maxZoom: 16
          });
        }
      }
    } catch (error) {
      console.error('Error loading GeoJSON data:', error);
    }
  };

  // Load CSV data from environment variable
  const loadCSVData = async () => {
    try {
      const csvPath = import.meta.env.VITE_CSV_PATH;

      if (!csvPath) {
        console.error('VITE_CSV_PATH environment variable is not set');
        return;
      }

      const response = await fetch(csvPath);
      const csvText = await response.text();

      // Parse CSV
      const lines = csvText.split('\n');
      const headers = lines[0].split(',');

      // Find column indices
      const locationIndex = headers.findIndex(h => h.toLowerCase() === 'location');
      const latIndex = headers.findIndex(h => h.toLowerCase() === 'latitude');
      const lonIndex = headers.findIndex(h => h.toLowerCase() === 'longitude');

      if (locationIndex === -1 || latIndex === -1 || lonIndex === -1) {
        console.error('CSV must contain location, latitude, and longitude columns');
        return;
      }

      // Create features for each location
      const geoJsonFormat = new GeoJSON();
      const features = [];

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;

        const values = lines[i].split(',');
        const location = values[locationIndex];
        const lat = parseFloat(values[latIndex]);
        const lon = parseFloat(values[lonIndex]);

        if (isNaN(lat) || isNaN(lon)) continue;

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

      if (markersSource()) {
        markersSource().addFeatures(features);
      }
    } catch (error) {
      console.error('Error loading CSV data:', error);
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
