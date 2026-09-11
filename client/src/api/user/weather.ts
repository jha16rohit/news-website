export interface WeatherForecast {
  day: string;
  icon: string;
  high: number;
  low: number;
}

export interface WeatherData {
  temperature: number;
  condition: string;
  location: string;
  forecast: WeatherForecast[];
}

/**
 * Get weather for exact latitude/longitude
 */
export async function getWeather(
  latitude: number,
  longitude: number,
  location = "India"
): Promise<WeatherData> {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${latitude}` +
    `&longitude=${longitude}` +
    `&current=temperature_2m,weather_code` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min` +
    `&timezone=auto`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch weather");
  }

  const data = await response.json();

  const weatherCodes: Record<number, string> = {
    0: "Clear Sky",
    1: "Mainly Clear",
    2: "Partly Cloudy",
    3: "Cloudy",

    45: "Foggy",
    48: "Foggy",

    51: "Light Drizzle",
    53: "Drizzle",
    55: "Heavy Drizzle",

    61: "Light Rain",
    63: "Rain",
    65: "Heavy Rain",

    71: "Light Snow",
    73: "Snow",
    75: "Heavy Snow",

    80: "Rain Showers",
    81: "Rain Showers",
    82: "Heavy Rain Showers",

    95: "Thunderstorm",
    96: "Thunderstorm",
    99: "Thunderstorm",
  };

  const forecast: WeatherForecast[] = data.daily.time.map(
    (date: string, index: number) => ({
      day: new Date(date).toLocaleDateString("en-US", {
        weekday: "short",
      }),

      icon: getWeatherIcon(
        data.daily.weather_code[index]
      ),

      high: Math.round(
        data.daily.temperature_2m_max[index]
      ),

      low: Math.round(
        data.daily.temperature_2m_min[index]
      ),
    })
  );

  return {
    temperature: Math.round(
      data.current.temperature_2m
    ),

    condition:
      weatherCodes[data.current.weather_code] ||
      "Unknown",

    location,

    forecast: forecast.slice(0, 5),
  };
}

/**
 * Convert weather code to icon name
 */
function getWeatherIcon(code: number): string {
  if (code === 0) {
    return "sun";
  }

  if (code >= 1 && code <= 3) {
    return "cloud";
  }

  if (
    (code >= 51 && code <= 67) ||
    (code >= 80 && code <= 82)
  ) {
    return "rain";
  }

  if (code >= 95) {
    return "storm";
  }

  return "cloud";
}

/**
 * Get the user's city from latitude/longitude
 */
export async function getCityName(
  latitude: number,
  longitude: number
): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
    );

    if (!response.ok) {
      return "India";
    }

    const data = await response.json();

    const address = data.address;

    return (
      address?.city ||
      address?.town ||
      address?.municipality ||
      address?.village ||
      address?.county ||
      "India"
    );
  } catch (error) {
    console.error("Reverse geocoding error:", error);

    return "India";
  }
}