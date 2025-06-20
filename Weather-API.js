class WeatherExtension {
  constructor() {
    this.cache = new Map();
  }

  getInfo() {
    return {
      id: 'weather',
      name: 'Weather API',
      color1: '#8ab4f8',     // основной цвет (голубой)
      color2: '#6c9bdc',     // чуть темнее
      color3: '#4e82c0',     // ещё темнее
      blocks: [
        {
          opcode: 'getTemperature',
          blockType: Scratch.BlockType.REPORTER,
          text: 'Температура в [CITY] °C',
          arguments: {
            CITY: { type: Scratch.ArgumentType.STRING, defaultValue: 'Москва' }
          }
        },
        {
          opcode: 'getFeelsLike',
          blockType: Scratch.BlockType.REPORTER,
          text: 'Ощущается как в [CITY] °C',
          arguments: {
            CITY: { type: Scratch.ArgumentType.STRING, defaultValue: 'Москва' }
          }
        },
        {
          opcode: 'getWindSpeed',
          blockType: Scratch.BlockType.REPORTER,
          text: 'Ветер в [CITY] м/с',
          arguments: {
            CITY: { type: Scratch.ArgumentType.STRING, defaultValue: 'Москва' }
          }
        },
        {
          opcode: 'getWindDirection',
          blockType: Scratch.BlockType.REPORTER,
          text: 'Направление ветра в [CITY] °',
          arguments: {
            CITY: { type: Scratch.ArgumentType.STRING, defaultValue: 'Москва' }
          }
        },
        {
          opcode: 'getHumidity',
          blockType: Scratch.BlockType.REPORTER,
          text: 'Влажность в [CITY] %',
          arguments: {
            CITY: { type: Scratch.ArgumentType.STRING, defaultValue: 'Москва' }
          }
        },
        {
          opcode: 'getPrecipitation',
          blockType: Scratch.BlockType.REPORTER,
          text: 'Вероятность осадков в [CITY] %',
          arguments: {
            CITY: { type: Scratch.ArgumentType.STRING, defaultValue: 'Москва' }
          }
        },
        {
          opcode: 'getCloudCover',
          blockType: Scratch.BlockType.REPORTER,
          text: 'Облачность в [CITY] %',
          arguments: {
            CITY: { type: Scratch.ArgumentType.STRING, defaultValue: 'Москва' }
          }
        },
        {
          opcode: 'getPressure',
          blockType: Scratch.BlockType.REPORTER,
          text: 'Давление в [CITY] гПа',
          arguments: {
            CITY: { type: Scratch.ArgumentType.STRING, defaultValue: 'Москва' }
          }
        },
        {
          opcode: 'getSunrise',
          blockType: Scratch.BlockType.REPORTER,
          text: 'Время рассвета в [CITY]',
          arguments: {
            CITY: { type: Scratch.ArgumentType.STRING, defaultValue: 'Москва' }
          }
        },
        {
          opcode: 'getSunset',
          blockType: Scratch.BlockType.REPORTER,
          text: 'Время заката в [CITY]',
          arguments: {
            CITY: { type: Scratch.ArgumentType.STRING, defaultValue: 'Москва' }
          }
        },
        {
          opcode: 'getWeatherText',
          blockType: Scratch.BlockType.REPORTER,
          text: 'Погода в [CITY] как текст',
          arguments: {
            CITY: { type: Scratch.ArgumentType.STRING, defaultValue: 'Москва' }
          }
        },
        {
          opcode: 'getWeatherJson',
          blockType: Scratch.BlockType.REPORTER,
          text: 'Погода в [CITY] (JSON)',
          arguments: {
            CITY: { type: Scratch.ArgumentType.STRING, defaultValue: 'Москва' }
          }
        }
      ]
    };
  }

  getWeatherDescription(code) {
    const descriptions = {
      0: 'ясно', 1: 'преимущественно ясно', 2: 'переменная облачность', 3: 'пасмурно',
      45: 'туман', 48: 'иней',
      51: 'лёгкая морось', 53: 'умеренная морось', 55: 'густая морось',
      56: 'лёгкий ледяной дождь', 57: 'сильный ледяной дождь',
      61: 'небольшой дождь', 63: 'умеренный дождь', 65: 'сильный дождь',
      66: 'лёгкий ледяной дождь', 67: 'сильный ледяной дождь',
      71: 'небольшой снег', 73: 'умеренный снег', 75: 'сильный снег', 77: 'снежные зёрна',
      80: 'небольшой ливень', 81: 'умеренный ливень', 82: 'сильный ливень',
      85: 'небольшой снегопад', 86: 'сильный снегопад',
      95: 'гроза', 96: 'гроза с небольшим градом', 99: 'гроза с сильным градом'
    };
    return descriptions[code] || 'неизвестно';
  }

  getWeatherIcon(code) {
    const icons = {
      0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
      45: '🌫️', 48: '🌫️',
      51: '🌧️', 53: '🌧️', 55: '🌧️',
      56: '❄️🌧️', 57: '❄️🌧️',
      61: '🌧️', 63: '🌧️', 65: '🌧️',
      66: '❄️🌧️', 67: '❄️🌧️',
      71: '❄️', 73: '❄️', 75: '❄️', 77: '❄️',
      80: '🌧️', 81: '🌧️', 82: '🌧️',
      85: '❄️', 86: '❄️',
      95: '⛈️', 96: '⛈️', 99: '⛈️'
    };
    return icons[code] || '❓';
  }

  async getCoordinates(city) {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`);
    const data = await response.json();
    if (data.length === 0) throw new Error('Город не найден');
    return { lat: data[0].lat, lon: data[0].lon };
  }

  async getWeatherData(city) {
    if (this.cache.has(city)) {
      const { data, timestamp } = this.cache.get(city);
      if (Date.now() - timestamp < 3600000) return data;
    }
    const { lat, lon } = await this.getCoordinates(city);
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relativehumidity_2m,precipitation_probability,cloudcover,pressure_msl,windspeed_10m,winddirection_10m&daily=sunrise,sunset&timezone=auto`);
    const data = await response.json();
    if (!data.current_weather) throw new Error('Ошибка загрузки погоды');
    const result = { city, current: data.current_weather, hourly: data.hourly, daily: data.daily };
    this.cache.set(city, { data: result, timestamp: Date.now() });
    return result;
  }

  async getTemperature(args) {
    try {
      const { current } = await this.getWeatherData(args.CITY);
      return current.temperature;
    } catch (e) {
      return 'Ошибка';
    }
  }

  async getFeelsLike(args) {
    try {
      const { current } = await this.getWeatherData(args.CITY);
      return current.temperature;
    } catch (e) {
      return 'Ошибка';
    }
  }

  async getWindSpeed(args) {
    try {
      const { current } = await this.getWeatherData(args.CITY);
      return current.windspeed;
    } catch (e) {
      return 'Ошибка';
    }
  }

  async getWindDirection(args) {
    try {
      const { current } = await this.getWeatherData(args.CITY);
      return current.winddirection;
    } catch (e) {
      return 'Ошибка';
    }
  }

  async getHumidity(args) {
    try {
      const { hourly } = await this.getWeatherData(args.CITY);
      return hourly.relativehumidity_2m[0] || '—';
    } catch (e) {
      return 'Ошибка';
    }
  }

  async getPrecipitation(args) {
    try {
      const { hourly } = await this.getWeatherData(args.CITY);
      return hourly.precipitation_probability[0] || '—';
    } catch (e) {
      return 'Ошибка';
    }
  }

  async getCloudCover(args) {
    try {
      const { hourly } = await this.getWeatherData(args.CITY);
      return hourly.cloudcover[0] || '—';
    } catch (e) {
      return 'Ошибка';
    }
  }

  async getPressure(args) {
    try {
      const { hourly } = await this.getWeatherData(args.CITY);
      return hourly.pressure_msl[0] || '—';
    } catch (e) {
      return 'Ошибка';
    }
  }

  async getSunrise(args) {
    try {
      const { daily } = await this.getWeatherData(args.CITY);
      return daily.sunrise[0].split('T')[1].slice(0, 5);
    } catch (e) {
      return 'Ошибка';
    }
  }

  async getSunset(args) {
    try {
      const { daily } = await this.getWeatherData(args.CITY);
      return daily.sunset[0].split('T')[1].slice(0, 5);
    } catch (e) {
      return 'Ошибка';
    }
  }

  async getWeatherText(args) {
    try {
      const { city, current, hourly, daily } = await this.getWeatherData(args.CITY);
      const feelsLike = current.temperature;
      const humidity = hourly.relativehumidity_2m[0] || '—';
      const precipitation = hourly.precipitation_probability[0] || '—';
      const cloudCover = hourly.cloudcover[0] || '—';
      const pressure = hourly.pressure_msl[0] || '—';
      const windDirection = current.winddirection || '—';
      const sunrise = daily.sunrise[0].split('T')[1].slice(0, 5);
      const sunset = daily.sunset[0].split('T')[1].slice(0, 5);
      const weatherDesc = this.getWeatherDescription(current.weathercode);
      const weatherIcon = this.getWeatherIcon(current.weathercode);
      return `Погода в ${city}: ${current.temperature}°C (ощущается ${feelsLike}°C), ветер ${current.windspeed} м/с (${windDirection}°), влажность ${humidity}%, осадки ${precipitation}%, облачность ${cloudCover}%, давление ${pressure} гПа, рассвет ${sunrise}, закат ${sunset}, ${weatherDesc} ${weatherIcon}`;
    } catch (e) {
      return 'Ошибка';
    }
  }

  async getWeatherJson(args) {
    try {
      const { city, current, hourly, daily } = await this.getWeatherData(args.CITY);
      return JSON.stringify({
        city,
        temperature: current.temperature,
        feels_like: current.temperature,
        windspeed: current.windspeed,
        winddirection: current.winddirection,
        humidity: hourly.relativehumidity_2m[0],
        precipitation: hourly.precipitation_probability[0],
        cloudcover: hourly.cloudcover[0],
        pressure: hourly.pressure_msl[0],
        sunrise: daily.sunrise[0].split('T')[1].slice(0, 5),
        sunset: daily.sunset[0].split('T')[1].slice(0, 5)
      });
    } catch (e) {
      return 'Ошибка';
    }
  }
}

Scratch.extensions.register(new WeatherExtension());
