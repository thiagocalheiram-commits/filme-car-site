/* Sol do logo no topo: conforme a página rola, o sol gira, perde um pouco do brilho
   e desce atrás da foto. Só usa transform, opacity e filter (via a variável --p). */
(function () {
  'use strict';
  var wrap = document.getElementById('hero-sol');
  var rays = document.getElementById('sol-rays');
  if (!wrap || !rays) return;

  var NS = 'http://www.w3.org/2000/svg';
  /* 16 raios alternando longos e curtos, como no logo */
  for (var i = 0; i < 16; i++) {
    var long = i % 2 === 0;
    var r0 = 52, r1 = long ? 96 : 78, w = long ? 9 : 7;
    var p = document.createElementNS(NS, 'path');
    p.setAttribute('d', 'M' + (-w) + ' ' + (-r0) + 'L0 ' + (-r1) + 'L' + w + ' ' + (-r0) + 'Z');
    p.setAttribute('fill', 'url(#solRay)');
    p.setAttribute('transform', 'rotate(' + (i * 22.5) + ')');
    p.setAttribute('class', long ? 'ray ray-l' : 'ray ray-s');
    rays.appendChild(p);
  }

  var photo = wrap.querySelector('.hero-photo');
  var last = -1, ticking = false, m;

  function measure() {
    var vh = window.innerHeight;
    var top = photo.getBoundingClientRect().top + window.scrollY;
    return { start: Math.max(0, top - vh * 0.62), range: Math.max(260, vh * 0.7) };
  }
  function frame() {
    ticking = false;
    var p = (window.scrollY - m.start) / m.range;
    p = p < 0 ? 0 : p > 1 ? 1 : p;
    if (Math.abs(p - last) < 0.002) return;
    last = p;
    wrap.style.setProperty('--p', p.toFixed(3));
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }

  m = measure();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { m = measure(); onScroll(); });
  window.addEventListener('load', function () { m = measure(); onScroll(); });
  frame();
})();
