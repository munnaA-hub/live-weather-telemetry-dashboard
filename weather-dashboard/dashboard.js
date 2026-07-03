(function () {
  'use strict';

  const form = document.getElementById('weather-lookup-form');
  const input = document.getElementById('station-input');
  const errorText = document.getElementById('validation-error-msg');
  
  const spinner = document.getElementById('ui-loading-spinner');
  const emptyState = document.getElementById('ui-empty-state');
  const dataView = document.getElementById('ui-data-view');

  const nodeStationTitle = document.getElementById('render-station-title');
  const nodeTemp = document.getElementById('metric-temp');
  const nodeWind = document.getElementById('metric-wind');
  const nodeWaves = document.getElementById('metric-waves');
  const nodePressure = document.getElementById('metric-pressure');

  function secureEscape(raw) {
    const div = document.createElement('div');
    div.textContent = raw;
    return div.innerHTML;
  }

  function emitTelemetry(action, payload) {
    console.log(`[Analytics] User interacted with Live Weather Dashboard | Action: ${action} | Destination: ${payload}`);
  }

  function setUIState(state) {
    spinner.style.display = state === 'loading' ? 'block' : 'none';
    emptyState.style.display = state === 'empty' ? 'block' : 'none';
    dataView.style.display = state === 'ready' ? 'block' : 'none';
  }

  function generateDynamicMetrics(seedString) {
    let hash = 0;
    for (let i = 0; i < seedString.length; i++) {
      hash = seedString.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const factor = Math.abs(hash);
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    
    return {
      name: seedString,
      temp: `${((factor % 15) + 12).toFixed(1)}°C`,
      wind: `${((factor % 22) + 4).toFixed(1)} knots ${directions[factor % directions.length]}`,
      waves: `${((factor % 25) / 10 + 0.3).toFixed(1)} meters`,
      pressure: `${((factor % 30) + 995).toFixed(1)} hPa`
    };
  }

  async function fetchStationTelemetry(location) {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (location.toLowerCase().includes('empty') || !location.trim()) {
          resolve(null);
          return;
        }
        resolve(generateDynamicMetrics(location));
      }, 950); 
    });
  }

  form.addEventListener('submit', async function (event) {
    event.preventDefault();

    const rawInput = input.value.trim();
    const whitelist = /^[a-zA-Z0-9\s,.-]+$/;

    if (!rawInput || !whitelist.test(rawInput)) {
      input.classList.add('input-invalid');
      errorText.style.display = 'block';
      input.setAttribute('aria-invalid', 'true');
      input.focus();
      return;
    }

    input.classList.remove('input-invalid');
    errorText.style.display = 'none';
    input.removeAttribute('aria-invalid');

    const cleanLocation = secureEscape(rawInput);
    setUIState('loading');

    try {
      const data = await fetchStationTelemetry(cleanLocation);

      if (!data) {
        setUIState('empty');
        return;
      }

      nodeStationTitle.textContent = data.name;
      nodeTemp.textContent = data.temp;
      nodeWind.textContent = data.wind;
      nodeWaves.textContent = data.waves;
      nodePressure.textContent = data.pressure;

      setUIState('ready');
      emitTelemetry('Execute Weather Query Submission', cleanLocation);

    } catch (err) {
      console.error('[Telemetry Failure]:', err);
      setUIState('empty');
    }
  });
})();