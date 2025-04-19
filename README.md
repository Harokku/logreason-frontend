# LogReason Map Application

This application displays a geographic map with GeoJSON polygons and location markers loaded from environment variables.

## Features

- Displays an OpenLayers OSM map with basic controls
- Loads and displays GeoJSON polygons from a specified path
- Loads and displays location markers from a CSV file
- Automatically calculates different fill colors for adjacent polygons
- Provides a clean API for performing calculations on map elements
- Caches polygon colors for performance optimization

## Environment Variables

The application requires the following environment variables:

- `VITE_GEOJSON_PATH`: Path to the GeoJSON file or directory containing polygon data
- `VITE_CSV_PATH`: Path to the CSV file containing location data

The CSV file must have the following columns:
- `location`: Name or identifier for the location
- `latitude`: Latitude coordinate
- `longitude`: Longitude coordinate

## Usage

Those templates dependencies are maintained via [pnpm](https://pnpm.io) via `pnpm up -Lri`.

This is the reason you see a `pnpm-lock.yaml`. That being said, any package manager will work. This file can be safely be removed once you clone a template.

```bash
$ npm install # or pnpm install or yarn install
```

### Learn more on the [Solid Website](https://solidjs.com) and come chat with us on our [Discord](https://discord.com/invite/solidjs)

## Available Scripts

In the project directory, you can run:

### `npm run dev` or `npm start`

Runs the app in the development mode.<br>
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br>

### `npm run build`

Builds the app for production to the `dist` folder.<br>
It correctly bundles Solid in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br>
Your app is ready to be deployed!

### `npm run test`

Runs your test suite using vitest, solid-testing-library and jest-dom for the best possible unit testing experience.

## Deployment

You can deploy the `dist` folder to any static host provider (netlify, surge, now, etc.)

## API for Map Calculations

The application provides a MapService that can be used to perform calculations on map elements. Here's how to use it:

```javascript
import MapService from './services/MapService';

// Get all GeoJSON features
const polygons = MapService.getAllGeoJSONFeatures();

// Get all marker features
const markers = MapService.getAllMarkerFeatures();

// Get markers within a polygon
const markersInPolygon = MapService.getMarkersWithinPolygon(polygon);

// Get polygons containing a marker
const polygonsContainingMarker = MapService.getPolygonsContainingMarker(marker);

// Calculate distance between two markers
const distance = MapService.calculateDistanceBetweenMarkers(marker1, marker2);

// Calculate area of a polygon
const area = MapService.calculatePolygonArea(polygon);

// Find the nearest marker to a given marker
const nearestMarker = MapService.findNearestMarker(marker);

// Find all markers within a given distance of a marker
const markersWithinDistance = MapService.findMarkersWithinDistance(marker, distance);
```

## Color Calculation for Polygons

The application automatically calculates different fill colors for adjacent polygons. The color calculation is cached for performance optimization and only recalculated when the GeoJSON data changes.

The color utility provides the following functions:

```javascript
import { applyPolygonColors, getPolygonStyleFunction, getMarkerStyle } from './utils/colorUtils';

// Apply colors to polygon features
applyPolygonColors(features, geojsonFiles);

// Get a style function for polygon features
const styleFunction = getPolygonStyleFunction();

// Get a style for location markers with high contrast
const markerStyle = getMarkerStyle();
```
