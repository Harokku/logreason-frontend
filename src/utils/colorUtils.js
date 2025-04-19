/**
 * Utility functions for calculating and caching polygon fill colors
 */
import { Style, Fill, Stroke, Circle as CircleStyle } from 'ol/style';

// Cache for storing polygon colors
let colorCache = {
  timestamp: null,
  polygonColors: new Map(),
  fileHashes: new Map()
};

/**
 * Generate a hash for a GeoJSON feature
 * @param {Object} feature - GeoJSON feature
 * @returns {string} - Hash of the feature
 */
const generateFeatureHash = (feature) => {
  // Simple hash function based on feature geometry
  const geometry = feature.getGeometry();
  const coordinates = geometry.getCoordinates().flat(Infinity).join(',');
  return coordinates;
};

/**
 * Generate a hash for a file content
 * @param {string} content - File content
 * @returns {string} - Hash of the content
 */
const generateContentHash = (content) => {
  // Simple hash function based on content
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString();
};

/**
 * Check if the cache is valid
 * @param {Array} geojsonFiles - Array of GeoJSON file contents
 * @returns {boolean} - True if cache is valid, false otherwise
 */
const isCacheValid = (geojsonFiles) => {
  if (!colorCache.timestamp) return false;

  // Check if number of files has changed
  if (geojsonFiles.length !== colorCache.fileHashes.size) return false;

  // Check if file contents have changed
  for (let i = 0; i < geojsonFiles.length; i++) {
    const content = geojsonFiles[i];
    const hash = generateContentHash(content);
    const filename = `file_${i}`;

    if (!colorCache.fileHashes.has(filename) || colorCache.fileHashes.get(filename) !== hash) {
      return false;
    }
  }

  return true;
};

/**
 * Update the cache with new file hashes
 * @param {Array} geojsonFiles - Array of GeoJSON file contents
 */
const updateCache = (geojsonFiles) => {
  colorCache.timestamp = Date.now();
  colorCache.fileHashes.clear();

  for (let i = 0; i < geojsonFiles.length; i++) {
    const content = geojsonFiles[i];
    const hash = generateContentHash(content);
    const filename = `file_${i}`;
    colorCache.fileHashes.set(filename, hash);
  }
};

/**
 * Get a color for a polygon that is different from its neighbors
 * @param {Object} feature - GeoJSON feature
 * @param {Array} allFeatures - All GeoJSON features
 * @returns {string} - RGBA color string
 */
const getPolygonColor = (feature, allFeatures) => {
  const featureHash = generateFeatureHash(feature);

  // If color is already cached, return it
  if (colorCache.polygonColors.has(featureHash)) {
    return colorCache.polygonColors.get(featureHash);
  }

  // Find neighboring polygons
  const neighbors = findNeighbors(feature, allFeatures);

  // Get colors of neighboring polygons
  const neighborColors = neighbors.map(neighbor => {
    const neighborHash = generateFeatureHash(neighbor);
    return colorCache.polygonColors.get(neighborHash);
  }).filter(Boolean);

  // Generate a color that is different from neighbors
  const color = generateDistinctColor(neighborColors);

  // Cache the color
  colorCache.polygonColors.set(featureHash, color);

  return color;
};

/**
 * Find neighboring polygons
 * @param {Object} feature - GeoJSON feature
 * @param {Array} allFeatures - All GeoJSON features
 * @returns {Array} - Array of neighboring features
 */
const findNeighbors = (feature, allFeatures) => {
  const neighbors = [];
  const featureGeometry = feature.getGeometry();

  for (const otherFeature of allFeatures) {
    if (feature === otherFeature) continue;

    const otherGeometry = otherFeature.getGeometry();

    // Check if geometries intersect or are adjacent
    if (featureGeometry.intersectsExtent(otherGeometry.getExtent())) {
      neighbors.push(otherFeature);
    }
  }

  return neighbors;
};

/**
 * Generate a color that is distinct from the given colors
 * @param {Array} existingColors - Array of existing colors to avoid
 * @returns {string} - RGBA color string
 */
const generateDistinctColor = (existingColors) => {
  // Predefined color palette with good contrast
  const colorPalette = [
    'rgba(31, 119, 180, 0.7)',   // Blue
    'rgba(255, 127, 14, 0.7)',   // Orange
    'rgba(44, 160, 44, 0.7)',    // Green
    'rgba(214, 39, 40, 0.7)',    // Red
    'rgba(148, 103, 189, 0.7)',  // Purple
    'rgba(140, 86, 75, 0.7)',    // Brown
    'rgba(227, 119, 194, 0.7)',  // Pink
    'rgba(127, 127, 127, 0.7)',  // Gray
    'rgba(188, 189, 34, 0.7)',   // Olive
    'rgba(23, 190, 207, 0.7)'    // Teal
  ];

  // Find a color that is not in existingColors
  for (const color of colorPalette) {
    if (!existingColors.includes(color)) {
      return color;
    }
  }

  // If all colors are used, generate a random color
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  return `rgba(${r}, ${g}, ${b}, 0.7)`;
};

/**
 * Calculate colors for all polygons
 * @param {Array} features - Array of GeoJSON features
 * @param {Array} geojsonFiles - Array of GeoJSON file contents for cache validation
 * @returns {Map} - Map of feature hashes to colors
 */
export const calculatePolygonColors = (features, geojsonFiles) => {
  // Check if cache is valid
  if (isCacheValid(geojsonFiles)) {
    // Filter cache to only include features that are still present
    const currentHashes = new Set(features.map(generateFeatureHash));
    for (const hash of colorCache.polygonColors.keys()) {
      if (!currentHashes.has(hash)) {
        colorCache.polygonColors.delete(hash);
      }
    }
  } else {
    // Clear color cache if files have changed
    colorCache.polygonColors.clear();
    updateCache(geojsonFiles);
  }

  // Calculate colors for all features
  for (const feature of features) {
    getPolygonColor(feature, features);
  }

  return colorCache.polygonColors;
};

/**
 * Apply colors to polygon features
 * @param {Array} features - Array of GeoJSON features
 * @param {Array} geojsonFiles - Array of GeoJSON file contents for cache validation
 */
export const applyPolygonColors = (features, geojsonFiles) => {
  const colorMap = calculatePolygonColors(features, geojsonFiles);

  for (const feature of features) {
    const hash = generateFeatureHash(feature);
    const color = colorMap.get(hash) || 'rgba(100, 150, 200, 0.5)';

    // Set the color property on the feature
    feature.set('fillColor', color);
  }
};

/**
 * Get a style function for polygon features
 * @returns {Function} - Style function for OpenLayers
 */
export const getPolygonStyleFunction = () => {
  return (feature) => {
    const fillColor = feature.get('fillColor') || 'rgba(100, 150, 200, 0.5)';

    return new Style({
      fill: new Fill({
        color: fillColor
      }),
      stroke: new Stroke({
        color: 'rgba(0, 0, 0, 0.8)',
        width: 1
      })
    });
  };
};

/**
 * Get a style for location markers with high contrast
 * @returns {Style} - OpenLayers style for markers
 */
export const getMarkerStyle = () => {
  return new Style({
    image: new CircleStyle({
      radius: 6,
      fill: new Fill({
        color: 'rgba(255, 0, 0, 1)'
      }),
      stroke: new Stroke({
        color: 'white',
        width: 2
      })
    })
  });
};
