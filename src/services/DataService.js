/**
 * DataService provides methods for fetching data from the backend API
 */

// Get the backend URL from environment variables
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:3000';

/**
 * DataService class for handling all data fetching operations
 */
class DataService {
  /**
   * Fetch CSV data from the backend
   * @returns {Promise<string>} - CSV data as a string
   * @throws {Error} - If the fetch operation fails
   */
  async fetchCSVData() {
    try {
      const response = await fetch(`${BACKEND_URL}/api/locations/csv`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch CSV data: ${response.status} ${response.statusText}`);
      }
      
      return await response.text();
    } catch (error) {
      console.error('Error fetching CSV data:', error);
      throw error;
    }
  }

  /**
   * Fetch CSV data as JSON from the backend
   * @returns {Promise<Array>} - CSV data as a JSON array
   * @throws {Error} - If the fetch operation fails
   */
  async fetchCSVAsJSON() {
    try {
      const response = await fetch(`${BACKEND_URL}/api/locations/json`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch CSV as JSON: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching CSV as JSON:', error);
      throw error;
    }
  }

  /**
   * Fetch all GeoJSON data from the backend
   * @returns {Promise<Array>} - Array of GeoJSON objects
   * @throws {Error} - If the fetch operation fails
   */
  async fetchAllGeoJSON() {
    try {
      const response = await fetch(`${BACKEND_URL}/api/geojson`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch GeoJSON data: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching all GeoJSON data:', error);
      throw error;
    }
  }

  /**
   * Fetch a specific GeoJSON file by name
   * @param {string} name - Name of the GeoJSON file (without .json extension)
   * @returns {Promise<Object>} - GeoJSON object
   * @throws {Error} - If the fetch operation fails
   */
  async fetchGeoJSONByName(name) {
    try {
      const response = await fetch(`${BACKEND_URL}/api/geojson/${name}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch GeoJSON ${name}: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error fetching GeoJSON ${name}:`, error);
      throw error;
    }
  }

  /**
   * Fetch multiple specific GeoJSON files by name
   * @param {Array<string>} names - Array of GeoJSON file names (without .json extension)
   * @returns {Promise<Array>} - Array of GeoJSON objects
   * @throws {Error} - If the fetch operation fails
   */
  async fetchGeoJSONByNames(names) {
    try {
      const namesParam = names.join(',');
      const response = await fetch(`${BACKEND_URL}/api/geojson/filter?names=${namesParam}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch filtered GeoJSON data: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching filtered GeoJSON data:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export default new DataService();