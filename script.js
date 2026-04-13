console.clear();

Splitting({ target: '.planet-title h1', by: 'chars' });

const elApp = document.querySelector('#app');
const svgNS = 'http://www.w3.org/2000/svg';
const elSvgNav = document.querySelector('.planet-nav svg');
const elTextPath = document.querySelector('.planet-nav textPath');

// Grouper les planets par catégorie
const allPlanets = Array.from(document.querySelectorAll('[data-planet]'));

let currentCategory = 'pizza';
let currentPlanetIndex = 0;
let currentPlanet = null;
let planetKeys = [];
let elPlanets = {};

function getPlanetsForCategory(category) {
  return allPlanets.filter(el => el.dataset.category === category);
}

function buildArcNav(category) {
  const planets = getPlanetsForCategory(category);

  elTextPath.innerHTML = '';
  planets.forEach(el => {
    const tspan = document.createElementNS(svgNS, 'tspan');
    tspan.textContent = el.querySelector('h1').textContent;
    elTextPath.appendChild(tspan);
  });

  elPlanets = {};
  planets.forEach(el => {
    elPlanets[el.dataset.planet] = el;
  });
  planetKeys = Object.keys(elPlanets);

  const elTspans = [...elTextPath.querySelectorAll('tspan')];
  const count = elTspans.length;
  elSvgNav.style.setProperty('--length', (count - 1) || 1);

  const elNavPath = document.querySelector('#navPath');
  const navPathTotal = elNavPath.getTotalLength();

  const fontSize = parseFloat(
    document.querySelector('.planet-nav textPath').getAttribute('font-size') || 10
  );
  const AVG_CHAR_WIDTH = fontSize * 0.45;

  // Largeur de chaque tspan
  const widths = elTspans.map(t => t.textContent.length * AVG_CHAR_WIDTH);
  const totalTextWidth = widths.reduce((a, b) => a + b, 0);

  // ✅ Gap fixe basé sur la taille de la police (pas sur l'espace restant)
  const FIXED_GAP = fontSize * 2.5;
  const totalContentWidth = totalTextWidth + FIXED_GAP * (count - 1);

  // ✅ Centrer le bloc sur le path
  let currentOffset = Math.max(0, (navPathTotal - totalContentWidth) / 2);

  elTspans.forEach((tspan, i) => {
    tspan.setAttribute('x', currentOffset);
    currentOffset += widths[i] + FIXED_GAP;

    tspan.addEventListener('click', e => {
      e.preventDefault();
      selectPlanetByIndex(i);
    });
  });

  selectPlanetByIndex(0);
}

function getDetails(planet) {
  if (!elPlanets[planet]) return { planet };
  return Array.from(elPlanets[planet].querySelectorAll('[data-detail]'))
    .reduce((acc, el) => {
      acc[el.dataset.detail] = el.innerHTML.trim();
      return acc;
    }, { planet });
}

function selectPlanet(planet) {
  const elActive = document.querySelector('[data-active]');
  if (elActive) delete elActive.dataset.active;

  const elPlanet = elPlanets[planet];
  if (!elPlanet) return;

  elPlanet.dataset.active = true;
  currentPlanet = getDetails(planet);

  // Rotation 360 de l'image
  const elImg = elPlanet.querySelector('.planet-figure img');
  if (elImg) {
    elImg.style.animation = 'none';
    void elImg.offsetWidth;
    elImg.style.animation = '';
    elImg.classList.remove('spinning');
    void elImg.offsetWidth;
    elImg.classList.add('spinning');
    elImg.addEventListener('animationend', () => {
      elImg.classList.remove('spinning');
    }, { once: true });
  }
}

// function selectPlanetByIndex(i) {
//   currentPlanetIndex = i;
//   elApp.style.setProperty('--active', i);
//   selectPlanet(planetKeys[i]);
// }


function selectPlanetByIndex(i) {
  currentPlanetIndex = i;
  elApp.style.setProperty('--active', i);
  selectPlanet(planetKeys[i]);

  // ✅ Centrer l'item actif sur le path
  const elTspans = [...elTextPath.querySelectorAll('tspan')];
  const elNavPath = document.querySelector('#navPath');
  const navPathTotal = elNavPath.getTotalLength();

  if (elTspans[i]) {
    const activeX = parseFloat(elTspans[i].getAttribute('x') || 0);
    const fontSize = parseFloat(elTextPath.getAttribute('font-size') || 12);
    const AVG_CHAR_WIDTH = fontSize * 0.45;
    const activeWidth = elTspans[i].textContent.length * AVG_CHAR_WIDTH;
    const activeCenter = activeX + activeWidth / 2;

    // Décaler pour que l'item actif soit au centre du path
    const offset = (navPathTotal / 2) - activeCenter;
    elTextPath.setAttribute('startOffset', offset);
  }
}

// Clic sur catégorie
document.querySelectorAll('.cat-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentCategory = btn.dataset.category;

    // Cacher toutes les planètes
    allPlanets.forEach(el => delete el.dataset.active);

    buildArcNav(currentCategory);
  });
});
adaptNavForScreen(); // ← ajoute avant buildArcNav

// Init avec la catégorie pizza
buildArcNav('pizza');

window.addEventListener('resize', () => {
  adaptNavForScreen(); // ← ajoute ici aussi
  buildArcNav(currentCategory);
});

/* ---- Fonctions d'animation ---- */
function animate(duration, fn) {
  const start = performance.now();
  let progress = 0;
  function tick(now) {
    if (progress >= 1) { fn(1); return; }
    progress = (now - start) / duration;
    fn(progress);
    requestAnimationFrame(tick);
  }
  tick(start);
}

function easing(progress) {
  return (1 - Math.cos(progress * Math.PI)) / 2;
}

animate.fromTo = ({ from, to, easing: ease, duration }, fn) => {
  ease = ease || easing;
  duration = duration || 1000;
  const delta = +to - +from;
  return animate(duration, p => fn(from + ease(p) * delta));
};


function adaptNavForScreen() {
  const isMobile = window.innerWidth <= 600;
  
  if (isMobile) {
    elSvgNav.setAttribute('viewBox', '-20 -50 440 500');
    document.querySelector('#navPath').setAttribute('d', 'M10,200 C30,-28 370,-28 390,200');
    document.querySelector('.planet-nav textPath').setAttribute('font-size', '14');
  } else {
    elSvgNav.setAttribute('viewBox', '0 20 400 400');
    document.querySelector('#navPath').setAttribute('d', 'M10,200 C30,-28 370,-28 390,200');
    document.querySelector('.planet-nav textPath').setAttribute('font-size', '12');
  }
}