var valuesElement = document.getElementById('values');
window.addEventListener('deviceorientation', function(evt) {
  valuesElement.textContent = [evt.gamma, evt.alpha].join(", ");
}, false);
