/**
 * MapService provides a clean API for accessing map elements and performing calculations
 */

// Singleton instance
let instance = null;

class MapService {
  constructor() {
    if (instance) {
      return instance;
    }
    
    this.map = null;
    this.geojsonSource = null;
    this.markersSource = null;
    this.geojsonFeatures = new Map(); // Map of feature id to feature
    this.markerFeatures = new Map();  // Map of feature id to feature
    
    instance = this;
  }
  
  /**
   * Initialize the service with map and sources
   * @param {Object} map - OpenLayers Map instance
   * @param {Object} geojsonSource - Vector source for GeoJSON features
   * @param {Object} markersSource - Vector source for marker features
   */
  initialize(map, geojsonSource, markersSource) {
    this.map = map;
    this.geojsonSource = geojsonSource;
    this.markersSource = markersSource;
    
    // Index features for quick access
    this.indexFeatures();
    
    // Add listeners for feature changes
    this.addFeatureListeners();
  }
  
  /**
   * Index features for quick access
   */
  indexFeatures() {
    if (this.geojsonSource) {
      this.geojsonFeatures.clear();
      this.geojsonSource.getFeatures().forEach(feature => {
        const id = feature.getId() || this.generateFeatureId(feature);
        feature.setId(id);
        this.geojsonFeatures.set(id, feature);
      });
    }
    
    if (this.markersSource) {
      this.markerFeatures.clear();
      this.markersSource.getFeatures().forEach(feature => {
        const id = feature.getId() || this.generateFeatureId(feature);
        feature.setId(id);
        this.markerFeatures.set(id, feature);
      });
    }
  }
  
  /**
   * Generate a unique ID for a feature
   * @param {Object} feature - OpenLayers Feature
   * @returns {string} - Unique ID
   */
  generateFeatureId(feature) {
    const geometry = feature.getGeometry();
    const type = geometry.getType();
    const coordinates = geometry.getCoordinates().flat(Infinity).join(',');
    return `${type}_${coordinates}`;
  }
  
  /**
   * Add listeners for feature changes
   */
  addFeatureListeners() {
    if (this.geojsonSource) {
      this.geojsonSource.on('addfeature', (event) => {
        const feature = event.feature;
        const id = feature.getId() || this.generateFeatureId(feature);
        feature.setId(id);
        this.geojsonFeatures.set(id, feature);
      });
      
      this.geojsonSource.on('removefeature', (event) => {
        const feature = event.feature;
        const id = feature.getId();
        if (id) {
          this.geojsonFeatures.delete(id);
        }
      });
    }
    
    if (this.markersSource) {
      this.markersSource.on('addfeature', (event) => {
        const feature = event.feature;
        const id = feature.getId() || this.generateFeatureId(feature);
        feature.setId(id);
        this.markerFeatures.set(id, feature);
      });
      
      this.markersSource.on('removefeature', (event) => {
        const feature = event.feature;
        const id = feature.getId();
        if (id) {
          this.markerFeatures.delete(id);
        }
      });
    }
  }
  
  /**
   * Get all GeoJSON features
   * @returns {Array} - Array of GeoJSON features
   */
  getAllGeoJSONFeatures() {
    return Array.from(this.geojsonFeatures.values());
  }
  
  /**
   * Get all marker features
   * @returns {Array} - Array of marker features
   */
  getAllMarkerFeatures() {
    return Array.from(this.markerFeatures.values());
  }
  
  /**
   * Get a GeoJSON feature by ID
   * @param {string} id - Feature ID
   * @returns {Object|null} - GeoJSON feature or null if not found
   */
  getGeoJSONFeatureById(id) {
    return this.geojsonFeatures.get(id) || null;
  }
  
  /**
   * Get a marker feature by ID
   * @param {string} id - Feature ID
   * @returns {Object|null} - Marker feature or null if not found
   */
  getMarkerFeatureById(id) {
    return this.markerFeatures.get(id) || null;
  }
  
  /**
   * Get markers within a polygon
   * @param {Object} polygon - GeoJSON polygon feature
   * @returns {Array} - Array of marker features within the polygon
   */
  getMarkersWithinPolygon(polygon) {
    const polygonGeometry = polygon.getGeometry();
    return this.getAllMarkerFeatures().filter(marker => {
      const markerGeometry = marker.getGeometry();
      return polygonGeometry.intersectsCoordinate(markerGeometry.getCoordinates());
    });
  }
  
  /**
   * Get polygons containing a marker
   * @param {Object} marker - Marker feature
   * @returns {Array} - Array of polygon features containing the marker
   */
  getPolygonsContainingMarker(marker) {
    const markerGeometry = marker.getGeometry();
    const markerCoordinates = markerGeometry.getCoordinates();
    
    return this.getAllGeoJSONFeatures().filter(polygon => {
      const polygonGeometry = polygon.getGeometry();
      return polygonGeometry.intersectsCoordinate(markerCoordinates);
    });
  }
  
  /**
   * Calculate the distance between two markers
   * @param {Object} marker1 - First marker feature
   * @param {Object} marker2 - Second marker feature
   * @returns {number} - Distance in meters
   */
  calculateDistanceBetweenMarkers(marker1, marker2) {
    const geometry1 = marker1.getGeometry();
    const geometry2 = marker2.getGeometry();
    
    return geometry1.getCoordinates().distanceTo(geometry2.getCoordinates());
  }
  
  /**
   * Calculate the area of a polygon
   * @param {Object} polygon - Polygon feature
   * @returns {number} - Area in square meters
   */
  calculatePolygonArea(polygon) {
    const geometry = polygon.getGeometry();
    return geometry.getArea();
  }
  
  /**
   * Find the nearest marker to a given marker
   * @param {Object} marker - Marker feature
   * @returns {Object|null} - Nearest marker feature or null if no other markers
   */
  findNearestMarker(marker) {
    const allMarkers = this.getAllMarkerFeatures();
    if (allMarkers.length <= 1) return null;
    
    let nearestMarker = null;
    let minDistance = Infinity;
    
    for (const otherMarker of allMarkers) {
      if (otherMarker === marker) continue;
      
      const distance = this.calculateDistanceBetweenMarkers(marker, otherMarker);
      if (distance < minDistance) {
        minDistance = distance;
        nearestMarker = otherMarker;
      }
    }
    
    return nearestMarker;
  }
  
  /**
   * Find all markers within a given distance of a marker
   * @param {Object} marker - Marker feature
   * @param {number} distance - Distance in meters
   * @returns {Array} - Array of marker features within the distance
   */
  findMarkersWithinDistance(marker, distance) {
    const allMarkers = this.getAllMarkerFeatures();
    const result = [];
    
    for (const otherMarker of allMarkers) {
      if (otherMarker === marker) continue;
      
      const actualDistance = this.calculateDistanceBetweenMarkers(marker, otherMarker);
      if (actualDistance <= distance) {
        result.push(otherMarker);
      }
    }
    
    return result;
  }
  
  /**
   * Get the map instance
   * @returns {Object|null} - OpenLayers Map instance or null if not initialized
   */
  getMap() {
    return this.map;
  }
  
  /**
   * Get the GeoJSON source
   * @returns {Object|null} - Vector source for GeoJSON features or null if not initialized
   */
  getGeoJSONSource() {
    return this.geojsonSource;
  }
  
  /**
   * Get the markers source
   * @returns {Object|null} - Vector source for marker features or null if not initialized
   */
  getMarkersSource() {
    return this.markersSource;
  }
}

// Export a singleton instance
export default new MapService();