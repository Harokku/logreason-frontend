import { render, screen } from '@solidjs/testing-library';
import { describe, it, expect, vi } from 'vitest';
import App from './App';

// Mock the Map component
vi.mock('./components/Map', () => ({
  default: () => <div data-testid="map-component">Map Component</div>
}));

describe('App component', () => {
  it('renders the title', () => {
    render(() => <App />);
    expect(screen.getByText('LogReason Map')).toBeInTheDocument();
  });

  it('renders the description', () => {
    render(() => <App />);
    expect(screen.getByText(/Displaying GeoJSON polygons and location markers/)).toBeInTheDocument();
  });

  it('renders the Map component', () => {
    render(() => <App />);
    expect(screen.getByTestId('map-component')).toBeInTheDocument();
  });
});
