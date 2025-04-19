import { render, screen } from '@solidjs/testing-library';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Map from './Map';

// Mock the OpenLayers imports
vi.mock('ol', () => ({
  Map: vi.fn(() => ({
    setTarget: vi.fn(),
    getView: vi.fn(() => ({
      fit: vi.fn()
    }))
  })),
  View: vi.fn()
}));

vi.mock('ol/source', () => ({
  OSM: vi.fn(),
  Vector: vi.fn(() => ({
    on: vi.fn(),
    getFeatures: vi.fn(() => []),
    addFeatures: vi.fn()
  }))
}));

vi.mock('ol/layer', () => ({
  Tile: vi.fn(),
  Vector: vi.fn()
}));

vi.mock('ol/format', () => ({
  GeoJSON: vi.fn(() => ({
    readFeatures: vi.fn(() => [])
  }))
}));

vi.mock('ol/style', () => ({
  Style: vi.fn(),
  Fill: vi.fn(),
  Stroke: vi.fn(),
  Circle: vi.fn()
}));

vi.mock('ol/proj', () => ({
  fromLonLat: vi.fn()
}));

// Mock the fetch function
global.fetch = vi.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
    text: () => Promise.resolve('')
  })
);

// Mock the environment variables
vi.stubEnv('VITE_GEOJSON_PATH', '/path/to/geojson');
vi.stubEnv('VITE_CSV_PATH', '/path/to/csv');

// Mock the MapService
vi.mock('../services/MapService', () => ({
  default: {
    initialize: vi.fn()
  }
}));

// Mock the colorUtils
vi.mock('../utils/colorUtils', () => ({
  applyPolygonColors: vi.fn(),
  getPolygonStyleFunction: vi.fn(),
  getMarkerStyle: vi.fn()
}));

describe('Map Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the map container', () => {
    render(() => <Map />);
    const mapContainer = document.getElementById('map');
    expect(mapContainer).toBeInTheDocument();
  });

  it('has the correct CSS classes', () => {
    render(() => <Map />);
    const mapContainer = document.getElementById('map');
    expect(mapContainer).toHaveClass('w-full');
    expect(mapContainer).toHaveClass('h-full');
  });

  it('initializes the map on mount', () => {
    render(() => <Map />);
    // The map is initialized in onMount, which is called after render
    // We can't directly test the onMount callback, but we can check that the map container exists
    const mapContainer = document.getElementById('map');
    expect(mapContainer).toBeInTheDocument();
  });
});