import Map from './components/Map';

function App() {
  return (
    <div class="w-full h-screen">
      <div class="absolute top-0 left-0 z-10 bg-white bg-opacity-80 p-4 m-4 rounded shadow-md">
        <h1 class="text-2xl font-bold mb-2">LogReason Map</h1>
        <p class="text-sm text-gray-700">
          Displaying GeoJSON polygons and location markers from environment variables.
        </p>
      </div>
      <Map />
    </div>
  );
}

export default App;
