const apiUrl = "https://dataservice.accuweather.com/";

const searchBar = document.getElementById('searchBar');
const searchBtn = document.getElementById('searchBtn');
const suggestions = document.getElementById('suggestions');
const favListElement = document.getElementById('favList');
const mapTooltip = document.getElementById('map-tooltip');

const cityList = [
    "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Amasya", "Ankara", "Antalya", "Artvin", "Aydın", "Balıkesir",
    "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli",
    "Diyarbakır", "Edirne", "Elazığ", "Erzincan", "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane",
    "Hakkari", "Hatay", "Isparta", "Mersin", "İstanbul", "İzmir", "Kars", "Kastamonu", "Kayseri", "Kırklareli",
    "Kırşehir", "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Kahramanmaraş", "Mardin", "Muğla", "Muş",
    "Nevşehir", "Niğde", "Ordu", "Rize", "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas", "Tekirdağ", "Tokat",
    "Trabzon", "Tunceli", "Şanlıurfa", "Uşak", "Van", "Yozgat", "Zonguldak", "Aksaray", "Bayburt", "Karaman",
    "Kırıkkale", "Batman", "Şırnak", "Bartın", "Ardahan", "Iğdır", "Yalova", "Karabük", "Kilis", "Osmaniye", "Düzce"
];

window.addEventListener('load', () => {
    getResult('Istanbul'); 
    loadFavorites();
});

const getResult = async (cityName) => {
    try {
        const locRes = await fetch(`${apiUrl}locations/v1/cities/search?apikey=${apiKey}&q=${encodeURIComponent(cityName)}&language=tr-tr`);
        const locData = await locRes.json();
        if (!locData || locData.length === 0) return;

        const cityKey = locData[0].Key;
        const fullCityName = locData[0].LocalizedName;
        const countryId = locData[0].Country.ID;

        const currRes = await fetch(`${apiUrl}currentconditions/v1/${cityKey}?apikey=${apiKey}&language=tr-tr&details=true`);
        const currData = await currRes.json();
        
        const foreRes = await fetch(`${apiUrl}forecasts/v1/daily/5day/${cityKey}?apikey=${apiKey}&language=tr-tr&metric=true`);
        const foreData = await foreRes.json();

        displayResult(currData[0], fullCityName, countryId);
        displayForecast(foreData);
    } catch (err) {
        console.error("Hata:", err);
    }
    if(searchBar) searchBar.value = '';
    if(suggestions) suggestions.style.display = 'none';
};

const displayResult = (result, name, country) => {
    document.querySelector('#city').innerText = `${name}, ${country}`;
    document.querySelector('#temp').innerText = Math.round(result.Temperature.Metric.Value);
    document.querySelector('#desc').innerText = result.WeatherText.toUpperCase();
    document.querySelector('#min').innerText = `${Math.round(result.Temperature.Metric.Value - 2)}°`;
    document.querySelector('#max').innerText = `${Math.round(result.Temperature.Metric.Value + 2)}°`;
    document.querySelector('#weatherEmoji').innerText = getCustomEmoji(result.WeatherIcon);
};

const displayForecast = (result) => {
    const container = document.getElementById('forecastContainer');
    if(!container) return;
    container.innerHTML = ''; 
    result.DailyForecasts.forEach(day => {
        const date = new Date(day.Date);
        const dayName = date.toLocaleDateString('tr-TR', { weekday: 'long' });
        const temp = Math.round(day.Temperature.Maximum.Value);
        const desc = day.Day.IconPhrase;
        const emoji = getCustomEmoji(day.Day.Icon);
        const cardHtml = `<div class="col"><div class="forecast-card text-center"><h5 class="fw-bold mb-2">${dayName}</h5><div class="fs-1 my-1">${emoji}</div><div class="fs-3 fw-bold">${temp}°C</div><small class="text-capitalize opacity-75">${desc}</small></div></div>`;
        container.innerHTML += cardHtml;
    });
};

function getCustomEmoji(iconId) {
    if (iconId >= 15 && iconId <= 17) return '⛈️'; 
    if (iconId >= 12 && iconId <= 14) return '🌦️'; 
    if (iconId >= 18 && iconId <= 21) return '🌧️'; 
    if (iconId >= 22 && iconId <= 29) return '🌨️'; 
    if (iconId >= 5 && iconId <= 11) return '🌫️'; 
    if (iconId >= 1 && iconId <= 2) return '☀️'; 
    if (iconId >= 3 && iconId <= 4) return '☁️'; 
    return '🌡️';
}

document.querySelectorAll('.fav-city-btn').forEach(button => {
    button.addEventListener('click', () => {
        getResult(button.innerText);
    });
});

if(searchBar) {
    searchBar.addEventListener('input', () => {
        const input = searchBar.value.toLocaleLowerCase('tr-TR');
        suggestions.innerHTML = '';
        if (input.length > 0) {
            const filtered = cityList.filter(city => city.toLocaleLowerCase('tr-TR').includes(input));
            if (filtered.length > 0) {
                suggestions.style.display = 'block';
                filtered.forEach(city => {
                    const li = document.createElement('li');
                    li.className = 'list-group-item';
                    li.innerText = city;
                    li.onclick = () => { getResult(city); };
                    suggestions.appendChild(li);
                });
            }
        } else { suggestions.style.display = 'none'; }
    });
    searchBar.addEventListener('keypress', (e) => { if (e.key === 'Enter') getResult(searchBar.value); });
}

if(searchBtn) searchBtn.addEventListener('click', () => { if (searchBar.value) getResult(searchBar.value); });

const addFavBtn = document.getElementById('addFavBtn');
if(addFavBtn) {
    addFavBtn.addEventListener('click', () => {
        const cityName = document.querySelector('#city').innerText.split(',')[0];
        if (!cityName || cityName === "Şehir Seçiniz") return;
        let favs = JSON.parse(localStorage.getItem('favCities')) || [];
        if (!favs.includes(cityName)) {
            favs.push(cityName);
            localStorage.setItem('favCities', JSON.stringify(favs));
            loadFavorites();
        }
    });
}

function loadFavorites() {
    if(!favListElement) return;
    favListElement.innerHTML = '';
    let favs = JSON.parse(localStorage.getItem('favCities')) || [];
    favs.forEach(city => {
        const div = document.createElement('div');
        div.className = 'fav-tag';
        div.innerHTML = `<span onclick="getResult('${city}')">${city}</span> <span class="fav-remove" onclick="removeFav('${city}')">×</span>`;
        favListElement.appendChild(div);
    });
}

window.removeFav = (city) => {
    let favs = JSON.parse(localStorage.getItem('favCities')) || [];
    favs = favs.filter(c => c !== city);
    localStorage.setItem('favCities', JSON.stringify(favs));
    loadFavorites();
};

const mapContainer = document.getElementById('turkey-provinces');
if (mapContainer) {
    mapContainer.addEventListener('click', (e) => {
        const path = e.target.closest('path');
        if (path) {
            const cityName = path.parentNode.getAttribute('data-city-name') || path.getAttribute('data-city-name');
            if (cityName) {
                getResult(cityName);
                const modalEl = document.getElementById('mapModal');
                if(modalEl) {
                    const modal = bootstrap.Modal.getInstance(modalEl);
                    if(modal) modal.hide();
                }
            }
        }
    });
    mapContainer.addEventListener('mouseover', (e) => {
        const path = e.target.closest('path');
        if (path) {
            const cityName = path.parentNode.getAttribute('data-city-name') || path.getAttribute('data-city-name');
            if (cityName && mapTooltip) {
                mapTooltip.innerText = cityName;
                mapTooltip.style.display = 'block';
            }
        }
    });
    mapContainer.addEventListener('mousemove', (e) => {
        if(mapTooltip) {
            mapTooltip.style.left = e.clientX + 'px';
            mapTooltip.style.top = e.clientY + 'px';
        }
    });
    mapContainer.addEventListener('mouseout', () => { if(mapTooltip) mapTooltip.style.display = 'none'; });
}
const locationBtn = document.getElementById('locationBtn');
if (locationBtn) {
    locationBtn.addEventListener('click', () => {
        if (navigator.geolocation) {
            locationBtn.innerHTML = '⌛';
            navigator.geolocation.getCurrentPosition(onPositionSuccess, onPositionError);
        } else {
            alert("Tarayıcınız konum özelliğini desteklemiyor.");
        }
    });
}

const onPositionSuccess = async (position) => {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;

    try {
        const geoUrl = `${apiUrl}locations/v1/cities/geoposition/search?apikey=${apiKey}&q=${lat},${lon}&language=tr-tr`;
        
        const res = await fetch(geoUrl);
        const data = await res.json();

        if (data) {
            const cityKey = data.Key;
            const fullCityName = data.LocalizedName;
            const countryId = data.Country.ID;
            const adminArea = data.AdministrativeArea.LocalizedName;
            const displayName = `${fullCityName}, ${adminArea}`;

            const currRes = await fetch(`${apiUrl}currentconditions/v1/${cityKey}?apikey=${apiKey}&language=tr-tr&details=true`);
            const currData = await currRes.json();
            const foreRes = await fetch(`${apiUrl}forecasts/v1/daily/5day/${cityKey}?apikey=${apiKey}&language=tr-tr&metric=true`);
            const foreData = await foreRes.json();

            displayResult(currData[0], displayName, countryId);
            displayForecast(foreData);
        }
    } catch (err) {
        console.error("Konum bazlı hava durumu alınamadı:", err);
        alert("Konum verisi alınırken bir hata oluştu.");
    } finally {
        locationBtn.innerHTML = '📍';
    }
};

const onPositionError = (err) => {
    locationBtn.innerHTML = '📍';
    if (err.code === 1) {
        alert("Konum izni reddedildi. Lütfen tarayıcı ayarlarından izin verin.");
    } else {
        alert("Konum alınamadı.");
    }
};
