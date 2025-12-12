const CONFIG = {
    OPENWEATHER_API_KEY: '08c931ad76699699b220d3e48bb58030',
    MAX_WIDGETS: 8,
    DEFAULT_CITY: 'Екатеринбург',
    UNITS: 'metric'
};

const elements = {
    locationInput: document.getElementById('locationInput'),
    searchButton: document.getElementById('searchButton'),
    latitudeInput: document.getElementById('latitudeInput'),
    longitudeInput: document.getElementById('longitudeInput'),
    coordSearchButton: document.getElementById('coordSearchButton'),
    weatherWidgetsContainer: document.getElementById('weatherWidgetsContainer')
 
};

let state = {
    widgets: [] 
};

const WEATHER_ICONS = {
    '01d': '☀️', '01n': '🌙',
    '02d': '⛅', '02n': '⛅',
    '03d': '☁️', '03n': '☁️',
    '04d': '☁️', '04n': '☁️',
    '09d': '🌧️', '09n': '🌧️',
    '10d': '🌦️', '10n': '🌦️',
    '11d': '⛈️', '11n': '⛈️',
    '13d': '❄️', '13n': '❄️',
    '50d': '🌫️', '50n': '🌫️'
};

function initApp() {
    setupEventListeners();
    addWeatherWidgetByCity(CONFIG.DEFAULT_CITY);
}

function setupEventListeners() {
    elements.searchButton.addEventListener('click', handleCitySearch);
    elements.locationInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleCitySearch();
    });
    elements.coordSearchButton.addEventListener('click', handleCoordSearch);
}

function handleCitySearch() {
    const city = elements.locationInput.value.trim();
    if (!validateCity(city)) {
        alert('Пожалуйста, введите корректное название города');
        return;
    }
    addWeatherWidgetByCity(city);
    elements.locationInput.value = '';
}

function validateCity(city) {
    return city.length > 0 && /^[a-zA-Zа-яА-ЯёЁ\s,'-]+$/.test(city);
}

function validateCoordinates(lat, lng) {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    return !isNaN(latNum) && !isNaN(lngNum) &&
           latNum >= -90 && latNum <= 90 &&
           lngNum >= -180 && lngNum <= 180;
}

function handleCoordSearch() {
    const lat = elements.latitudeInput.value.trim();
    const lng = elements.longitudeInput.value.trim();
    if (!validateCoordinates(lat, lng)) {
        alert('Пожалуйста, введите корректные координаты:\nШирота: от -90 до 90\nДолгота: от -180 до 180');
        return;
    }
    addWeatherWidgetByCoords(parseFloat(lat), parseFloat(lng));
    elements.latitudeInput.value = '';
    elements.longitudeInput.value = '';
}

async function addWeatherWidgetByCity(city) {
    if (state.widgets.length >= CONFIG.MAX_WIDGETS) {
        alert(`Максимальное количество виджетов: ${CONFIG.MAX_WIDGETS}`);
        return;
    }
    try {
        const weatherData = await fetchWeatherByCity(city);
        const widget = createWeatherWidget(weatherData);
        state.widgets.push(widget);
        updateWidgetsDisplay();
    } catch (error) {
        alert(`Ошибка: ${error.message}`);
    }
}

async function addWeatherWidgetByCoords(lat, lng) {
    if (state.widgets.length >= CONFIG.MAX_WIDGETS) {
        alert(`Максимальное количество виджетов: ${CONFIG.MAX_WIDGETS}`);
        return;
    }
    try {
        const weatherData = await fetchWeatherByCoords(lat, lng);
        const widget = createWeatherWidget(weatherData);
        state.widgets.push(widget);
        updateWidgetsDisplay();
    } catch (error) {
        alert(`Ошибка: ${error.message}`);
    }
}

async function fetchWeatherByCity(city) {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=${CONFIG.UNITS}&appid=${CONFIG.OPENWEATHER_API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Город не найден: ${city}`);
    }
    return await response.json();
}

async function fetchWeatherByCoords(lat, lng) {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=${CONFIG.UNITS}&appid=${CONFIG.OPENWEATHER_API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Местоположение не найдено');
    }
    return await response.json();
}

function createWeatherWidget(weatherData) {
    return {
        id: Date.now() + Math.random(),
        location: weatherData.name,
        country: weatherData.sys.country,
        temperature: Math.round(weatherData.main.temp),
        feelsLike: Math.round(weatherData.main.feels_like),
        humidity: weatherData.main.humidity,
        pressure: weatherData.main.pressure,
        windSpeed: weatherData.wind.speed,
        windDirection: getWindDirection(weatherData.wind.deg),
        description: weatherData.weather[0].description,
        icon: weatherData.weather[0].icon,
        lat: weatherData.coord.lat,
        lon: weatherData.coord.lon,
        timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    };
}

function updateWidgetsDisplay() {
    const container = elements.weatherWidgetsContainer;
    if (state.widgets.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>Нет виджетов погоды</h3>
                <p>Найдите город или введите координаты, чтобы добавить первый виджет погоды</p>
            </div>
        `;
        return;
    }
    container.innerHTML = '';
    state.widgets.forEach(widget => {
        const widgetElement = createWidgetElement(widget);
        container.appendChild(widgetElement);
    });
}

function createWidgetElement(widget) {
    const div = document.createElement('div');
    div.className = 'weather-widget';
    div.dataset.id = widget.id;
    div.innerHTML = `
        <button class="close-widget" onclick="removeWidget('${widget.id}')">×</button>
        <div class="widget-header">
            <h2 class="location-name">${widget.location}, ${widget.country}</h2>
            <span class="timestamp">${widget.timestamp}</span>
        </div>
        <div class="weather-main">
            <div class="weather-icon">${WEATHER_ICONS[widget.icon] || '🌡️'}</div>
            <div>
                <div class="temperature">${widget.temperature}°C</div>
                <div class="weather-desc">${widget.description}</div>
                <div class="feels-like">Ощущается как: ${widget.feelsLike}°C</div>
            </div>
        </div>
        <div class="weather-details">
            <div class="detail-item">
                <div class="detail-label">Влажность</div>
                <div class="detail-value">${widget.humidity}%</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Давление</div>
                <div class="detail-value">${widget.pressure} гПа</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Ветер</div>
                <div class="detail-value">${widget.windSpeed} м/с</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Направление</div>
                <div class="detail-value">${widget.windDirection}</div>
            </div>
        </div>
    `;
    return div;
}

function removeWidget(widgetId) {
    state.widgets = state.widgets.filter(w => w.id.toString() !== widgetId);
    updateWidgetsDisplay();
}

function getWindDirection(degrees) {
    const directions = ['С', 'СВ', 'В', 'ЮВ', 'Ю', 'ЮЗ', 'З', 'СЗ'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
}


window.removeWidget = removeWidget;
document.addEventListener('DOMContentLoaded', initApp);