const leftInput = document.querySelector('.amount.left');
const rightInput = document.querySelector('.amount.right');
const offlineText = document.querySelector('.offline-text');

const leftTabs = document.querySelectorAll('.box:first-child .tab');
const rightTabs = document.querySelectorAll('.box:last-child .tab');
const rateTexts = document.querySelectorAll('.rate-text');

let leftCurrency = 'RUB';
let rightCurrency = 'USD';
let activeSide = 'left';
let isOnline = navigator.onLine;

const API_KEY = '3d990d76138302c27fcc219933f3835f';
let rates = {};

function setEnabled(enabled) {
  leftInput.disabled = !enabled;
  rightInput.disabled = !enabled;

  [...leftTabs, ...rightTabs].forEach(tab => {
    tab.style.pointerEvents = enabled ? 'auto' : 'none';
    tab.style.opacity = enabled ? '1' : '0.5';
  });
}

async function getRates() {
  if (!isOnline) return;

  try {
    const res = await fetch(
      `https://api.currencylayer.com/live?access_key=${API_KEY}`
    );
    const data = await res.json();

    if (!data.success) {
      console.log('API error:', data.error);
      return;
    }

    rates = {
      USD: 1,
      RUB: data.quotes.USDRUB,
      EUR: data.quotes.USDEUR,
      GBP: data.quotes.USDGBP
    };

    calculateFromLeft();
    updateRateText();
  } catch (err) {
    console.error(err);
  }
}

function cleanInput(input) {
  let value = input.value
    .replace(/\./g, ',')
    .replace(/[^0-9,]/g, '');

  const parts = value.split(',');
  if (parts.length > 2) {
    value = parts[0] + ',' + parts.slice(1).join('');
  }

  input.value = value;
}

function toNumber(value) {
  return parseFloat(value.replace(',', '.')) || 0;
}

function updateRateText() {
  if (!rates[leftCurrency] || !rates[rightCurrency]) return;

  const leftToRight =
    (rates[rightCurrency] / rates[leftCurrency])
      .toFixed(4)
      .replace('.', ',');

  const rightToLeft =
    (rates[leftCurrency] / rates[rightCurrency])
      .toFixed(4)
      .replace('.', ',');

  rateTexts[0].textContent = `1 ${leftCurrency} = ${leftToRight} ${rightCurrency}`;
  rateTexts[1].textContent = `1 ${rightCurrency} = ${rightToLeft} ${leftCurrency}`;
}

function calculateFromLeft() {
  if (!isOnline) return;

  const amount = toNumber(leftInput.value);
  const usd = amount / rates[leftCurrency];
  rightInput.value = (usd * rates[rightCurrency])
    .toFixed(4)
    .replace('.', ',');

  updateRateText();
}

function calculateFromRight() {
  if (!isOnline) return;

  const amount = toNumber(rightInput.value);
  const usd = amount / rates[rightCurrency];
  leftInput.value = (usd * rates[leftCurrency])
    .toFixed(4)
    .replace('.', ',');

  updateRateText();
}

leftInput.addEventListener('input', () => {
  if (!isOnline) return;
  activeSide = 'left';
  cleanInput(leftInput);
  calculateFromLeft();
});

rightInput.addEventListener('input', () => {
  if (!isOnline) return;
  activeSide = 'right';
  cleanInput(rightInput);
  calculateFromRight();
});

function setupTabs(tabs, side) {
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      if (!isOnline) return;

      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      side === 'left'
        ? (leftCurrency = tab.textContent)
        : (rightCurrency = tab.textContent);

      activeSide === 'left'
        ? calculateFromLeft()
        : calculateFromRight();
    });
  });
}

setupTabs(leftTabs, 'left');
setupTabs(rightTabs, 'right');

function goOffline() {
  isOnline = false;
  offlineText.hidden = false;
  setEnabled(false);
}

function goOnline() {
  isOnline = true;
  offlineText.hidden = true;

  leftInput.value = '0';
  rightInput.value = '0';

  setEnabled(true);
  getRates();
}

window.addEventListener('offline', goOffline);
window.addEventListener('online', goOnline);

leftInput.value = '0';
rightInput.value = '0';

if (!isOnline) {
  goOffline();
} else {
  getRates();
}
