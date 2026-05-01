'use strict';

const CONFIG = {
  API_KEY: 'fe320bf3fe48aeee530ee31f7a4ca1bd',
  BASE_URL: 'https://api.openweathermap.org/data/2.5/weather',
  UNITS: 'metric',
  LANG: 'es',
};

const DOM = {
  searchForm:   document.getElementById('searchForm'),
  cityInput:    document.getElementById('cityInput'),
  loadingState: document.getElementById('loadingState'),
  errorState:   document.getElementById('errorState'),
  errorMessage: document.getElementById('errorMessage'),
  weatherCard:  document.getElementById('weatherCard'),
  quickBtns:    document.querySelectorAll('.quick-btn'),
  cityName:    document.getElementById('cityName'),
  countryName: document.getElementById('countryName'),
  currentTime: document.getElementById('currentTime'),
  weatherIcon: document.getElementById('weatherIcon'),
  tempMain:    document.getElementById('tempMain'),
  weatherDesc: document.getElementById('weatherDesc'),
  feelsLike:   document.getElementById('feelsLike'),
  humidity:    document.getElementById('humidity'),
  windSpeed:   document.getElementById('windSpeed'),
  visibility:  document.getElementById('visibility'),
  pressure:    document.getElementById('pressure'),
  sunrise:     document.getElementById('sunrise'),
  sunset:      document.getElementById('sunset'),
  tempMin:     document.getElementById('tempMin'),
  tempMax:     document.getElementById('tempMax'),
  rangeFill:   document.getElementById('rangeFill'),
};

/**
 * @param {number} code
 * @param {boolean} isNight
 * @returns {string}
 */
function getWeatherEmoji(code, isNight = false) {
  if (code >= 200 && code < 300) return '⛈️';
  if (code >= 300 && code < 400) return '🌦️';
  if (code >= 500 && code < 510) return '🌧️';
  if (code === 511)              return '🌨️';
  if (code >= 520 && code < 600) return '🌦️';
  if (code >= 600 && code < 700) return '❄️';
  if (code === 701)              return '🌫️';
  if (code === 721)              return '🌫️';
  if (code === 741)              return '🌫️';
  if (code >= 700 && code < 800) return '🌪️';
  if (code === 800) return isNight ? '🌙' : '☀️';
  if (code === 802) return '⛅';
  if (code >= 803 && code < 900) return '☁️';
  return '🌈';
}
/**
 * @param {number} unixTimestamp
 * @param {number} timezoneOffset
 * @returns {string}
 */
function formatTime(unixTimestamp, timezoneOffset) {
  const date = new Date((unixTimestamp + timezoneOffset) * 1000);
  const hours   = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * @param {number} n
 * @returns {string}
 */
const round = (n) => Math.round(n).toString();

/**
 * @param {number} sunrise
 * @param {number} sunset
 * @param {number} current 
 * @returns {boolean}
 */
function isNightTime(sunrise, sunset, current) {
  return current < sunrise || current > sunset;
}

/**
 * @param {number} temp
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function tempPercent(temp, min, max) {
  if (max === min) return 50;
  return Math.round(((temp - min) / (max - min)) * 100);
}

function hideAllStates() {
  DOM.loadingState.hidden = true;
  DOM.errorState.hidden   = true;
  DOM.weatherCard.hidden  = true;
}

function showLoading() {
  hideAllStates();
  DOM.loadingState.hidden = false;
}

/**
 * @param {string} message
 */
function showError(message) {
  hideAllStates();
  DOM.errorMessage.textContent = message;
  DOM.errorState.hidden = false;
}

function showWeatherCard() {
  hideAllStates();
  DOM.weatherCard.hidden = false;
}

/**
 * @param {Object} data
 */
function renderWeather(data) {
  const {
    name,
    sys,
    weather,
    main,
    wind,
    visibility,
    dt,
    timezone,
  } = data;

  const condition = weather[0];
  const night = isNightTime(sys.sunrise, sys.sunset, dt);

  DOM.cityName.textContent    = name;
  DOM.countryName.textContent = sys.country;
  const localTime = formatTime(dt, timezone);

  DOM.currentTime.textContent     = `${localTime} h`;
  DOM.currentTime.dateTime        = localTime;
  DOM.weatherIcon.textContent = getWeatherEmoji(condition.id, night);
  DOM.weatherDesc.textContent = condition.description;
  DOM.tempMain.textContent  = `${round(main.temp)}°`;
  DOM.feelsLike.textContent = `${round(main.feels_like)}°`;
  DOM.tempMin.textContent   = `${round(main.temp_min)}°`;
  DOM.tempMax.textContent   = `${round(main.temp_max)}°`;
  const pct = tempPercent(main.temp, main.temp_min, main.temp_max);

  DOM.rangeFill.style.width = `${pct}%`;
  DOM.humidity.textContent  = `${main.humidity}%`;
  DOM.windSpeed.textContent = `${round(wind.speed * 3.6)} km/h`;
  DOM.visibility.textContent = visibility
    ? `${(visibility / 1000).toFixed(1)} km`
    : 'N/D';
  DOM.pressure.textContent = `${main.pressure} hPa`;
  DOM.sunrise.textContent = `${formatTime(sys.sunrise, timezone)} h`;
  DOM.sunset.textContent  = `${formatTime(sys.sunset, timezone)} h`;

  showWeatherCard();
}

/**
 * @param {string} city
 */
async function fetchWeather(city) {
  if (!CONFIG.API_KEY || CONFIG.API_KEY === 'TU_API_KEY_AQUI') {
    showError('⚙️ Agrega tu API Key en app.js para usar la aplicación.');
    return;
  }

  showLoading();

  const url = new URL(CONFIG.BASE_URL);
  url.searchParams.set('q',     city.trim());
  url.searchParams.set('appid', CONFIG.API_KEY);
  url.searchParams.set('units', CONFIG.UNITS);
  url.searchParams.set('lang',  CONFIG.LANG);

  try {
    const response = await fetch(url.toString());

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      handleApiError(response.status, errorData.message);
      return;
    }

    const data = await response.json();
    renderWeather(data);

  } catch (error) {
    console.error('[Skye] Error de red:', error);
    showError('No se pudo conectar con el servidor. Revisa tu conexión a internet.');
  }
}

/**
 * @param {number} status
 * @param {string} apiMessage
 */
function handleApiError(status, apiMessage) {
  const messages = {
    401: 'API Key inválida. Verifica tu clave en app.js.',
    404: 'Ciudad no encontrada. Intenta con otro nombre.',
    429: 'Demasiadas solicitudes. Espera un momento e intenta de nuevo.',
    500: 'Error en el servidor. Intenta más tarde.',
  };

  const message = messages[status] || `Error inesperado (${status}): ${apiMessage ?? ''}`;
  showError(message);
  console.warn('[Skye] Error API:', status, apiMessage);
}

DOM.searchForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const city = DOM.cityInput.value.trim();
  if (!city) {
    DOM.cityInput.focus();
    return;
  }

  fetchWeather(city);
});

DOM.quickBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    const city = btn.dataset.city;
    DOM.cityInput.value = city;
    fetchWeather(city);
  });
});

DOM.cityInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    DOM.searchForm.dispatchEvent(new Event('submit', { cancelable: true }));
  }
});

window.addEventListener('DOMContentLoaded', () => {
  fetchWeather('Santo Domingo');
});
