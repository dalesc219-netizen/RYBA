export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1`, {
      headers: {
        'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
        'User-Agent': 'Vnedorozhnik/1.0'
      }
    });
    if (!response.ok) throw new Error('Geocoding failed');
    const data = await response.json();
    
    if (data.address) {
      const city = data.address.city || data.address.town || data.address.village || data.address.hamlet || data.address.county || data.address.state;
      if (city) {
        return city;
      }
    }
    return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  }
}

export async function forwardGeocode(query: string): Promise<[number, number] | null> {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`, {
      headers: {
        'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
        'User-Agent': 'Vnedorozhnik/1.0'
      }
    });
    if (!response.ok) throw new Error('Geocoding failed');
    const data = await response.json();
    if (data && data.length > 0) {
      return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    }
    return null;
  } catch (error) {
    console.error('Forward geocoding error:', error);
    return null;
  }
}
