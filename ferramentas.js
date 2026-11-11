(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var NS = 'http://www.w3.org/2000/svg';
  var WA = 'https://wa.me/5573991091547?text=';

  function svgEl(tag, attrs) {
    var el = document.createElementNS(NS, tag);
    Object.keys(attrs).forEach(function (k) { el.setAttribute(k, attrs[k]); });
    return el;
  }
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* =========================================================
     Simulador de fumê
     ========================================================= */
  var sim = $('#sim');
  if (sim) {
    var GLASS = 0.88; /* vidro de fábrica deixa passar cerca de 88% da luz */
    var LIMITS = { side: 70, wind: 70 };
    var NOTES = {
      100: 'Sem película: vidro de fábrica, sem privacidade extra e sem bloqueio de calor.',
      50: 'Discreto: escurece pouco e mantém ótima visão, dentro e fora.',
      35: 'Equilibrado: boa privacidade e boa visão à noite. É o mais pedido atrás.',
      20: 'Escuro: muita privacidade, mas pede mais atenção ao dirigir à noite.',
      5: 'Limousine: privacidade máxima e pouquíssima visão para fora, principalmente à noite.'
    };
    var COLORS = {
      branco: ['#ffffff', '#e4e9ee', '#b4bec9'],
      prata: ['#f1f3f6', '#c3cad2', '#8a94a0'],
      grafite: ['#7a8492', '#4a5360', '#252b33'],
      preto: ['#566070', '#252a32', '#0b0e12'],
      vermelho: ['#f2606b', '#c4202e', '#7d0f1b']
    };
    var state = { side: 35, wind: 90, view: 'out', time: 'day' };

    var stage = $('#sim-stage');
    var outSvg = $('#sim-out');
    var inSvg = $('#sim-in');
    var captionEl = $('#sim-caption');
    var modelEl = $('#sim-model');
    var waEl = $('#sim-wa');

    function filmName(key, v) {
      if (v === 100) return 'Sem película';
      return 'G' + (v < 10 ? '0' + v : v);
    }

    /* estrelas e luzes da cidade geradas por código */
    function scatterStars(group, w, h, n, seed) {
      var r = rng(seed);
      for (var i = 0; i < n; i++) {
        group.appendChild(svgEl('circle', {
          cx: (r() * w).toFixed(1), cy: (r() * h).toFixed(1),
          r: (0.5 + r() * 1.2).toFixed(2), fill: '#fff', opacity: (0.35 + r() * 0.6).toFixed(2)
        }));
      }
    }
    scatterStars($('#stars-out'), 960, 300, 46, 11);
    scatterStars($('#stars-in'), 960, 220, 46, 7);
    (function () {
      var g = $('#city-in'), r = rng(21);
      for (var i = 0; i < 40; i++) {
        var x = r() * 960;
        var y = 236 + r() * 14;
        g.appendChild(svgEl('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: (0.6 + r() * 0.9).toFixed(2), fill: '#ffd9a0', opacity: (0.45 + r() * 0.5).toFixed(2) }));
      }
    })();

    function legalText(key, total) {
      if (key === 'side') {
        if (total >= 70) return { ok: true, html: '<span class="legal-ico">✓</span><span>Cerca de <strong>' + total + '%</strong> da luz passa. Dentro do limite em todas as janelas.</span>' };
        if (total >= 28) return { ok: false, html: '<span class="legal-ico">!</span><span>Cerca de <strong>' + total + '%</strong> da luz passa. Vale para as <strong>traseiras e o vidro de trás</strong> (mín. 28%). Nas portas da frente o mínimo é 70%: aplicamos só película clara ali.</span>' };
        return { ok: false, html: '<span class="legal-ico">!</span><span>Cerca de <strong>' + total + '%</strong> da luz passa. Abaixo do mínimo legal de 28% em qualquer janela. Escolha G35 ou mais clara.</span>' };
      }
      var min = LIMITS[key];
      if (total >= min) {
        return { ok: true, html: '<span class="legal-ico">✓</span><span>Cerca de <strong>' + total + '%</strong> da luz passa. Dentro do mínimo de ' + min + '%.</span>' };
      }
      return { ok: false, html: '<span class="legal-ico">!</span><span>Cerca de <strong>' + total + '%</strong> da luz passa. Abaixo do mínimo legal de ' + min + '%. No para-brisa, a lei pede G80 ou mais clara.</span>' };
    }

    function render() {
      /* escurecimento dos vidros */
      $$('.gtint').forEach(function (el) {
        el.style.opacity = ((100 - state[el.dataset.win === 'wind' ? 'wind' : 'side']) / 100).toFixed(2);
      });

      ['side', 'wind'].forEach(function (key) {
        var total = Math.round(state[key] * GLASS);
        $('#mf-' + key).style.width = total + '%';
        $('#mm-' + key).style.left = LIMITS[key] + '%';
        if (key === 'side') $('#mm-side2').style.left = '28%';
        var lg = $('#lg-' + key);
        var info = legalText(key, total);
        lg.className = 'legal ' + (info.ok ? 'is-ok' : 'is-low');
        lg.innerHTML = info.html;
        $('#sum-' + key).textContent = filmName(key, state[key]);
        var checked = $('input[name="' + key + '"][value="' + state[key] + '"]');
        if (checked) checked.checked = true;
      });

      ['side', 'wind'].forEach(function (key) {
        var pv = $('[data-pill="' + key + '"] .pill-v');
        if (pv) pv.textContent = filmName(key, state[key]);
      });

      $$('.preset').forEach(function (b) {
        b.classList.toggle('is-on', +b.dataset.side === state.side && state.wind === 90);
      });

      var text = 'Laterais em <strong>' + filmName('side', state.side) + '</strong>. ' + NOTES[state.side];
      if (state.view === 'in' && state.time === 'night' && state.side <= 20) {
        text += ' À noite, essa película reduz bastante a visão para fora.';
      } else if (state.view === 'out' && state.side <= 20) {
        text += ' Veja como o interior some atrás do vidro.';
      }
      if (state.wind < 80) text += ' O para-brisa em ' + filmName('wind', state.wind) + ' fica abaixo do limite legal.';
      captionEl.innerHTML = text;

      var label = 'Laterais: ' + filmName('side', state.side) + '. Para-brisa: ' + filmName('wind', state.wind) + '.';
      outSvg.setAttribute('aria-label', 'Carro visto de lado. ' + label);
      inSvg.setAttribute('aria-label', 'Vista de dentro do carro, ' + (state.time === 'night' ? 'à noite' : 'de dia') + '. ' + label);

      var model = modelEl.value.trim();
      var msg = 'Olá, Filme Car! Montei meu projeto no simulador do site e quero um orçamento.\n\n' +
        '*Laterais e vidro traseiro:* ' + filmName('side', state.side) + '\n' +
        '*Para-brisa:* ' + filmName('wind', state.wind) + '\n' +
        (model
          ? '*Carro:* ' + model + '\n\nQual o valor e quando tem horário?'
          : '\nQual o valor e quando tem horário?\nModelo e ano do carro: ');
      waEl.href = WA + encodeURIComponent(msg);
    }

    $$('input[type="radio"]', sim).forEach(function (input) {
      input.addEventListener('change', function () {
        if (!input.checked) return;
        state[input.name] = +input.value;
        render();
        /* o para-brisa quase não aparece de lado: mostra de dentro, onde dá para ver a diferença */
        if (input.name === 'wind' && state.view === 'out') {
          var inBtn = $('[data-view="in"]');
          if (inBtn) inBtn.click();
        }
      });
    });

    $$('.preset').forEach(function (b) {
      b.addEventListener('click', function () {
        state.side = +b.dataset.side;
        state.wind = 90;
        render();
      });
    });

    function setPressed(buttons, active) {
      buttons.forEach(function (b) {
        var on = b === active;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-pressed', String(on));
      });
    }

    var viewBtns = $$('[data-view]');
    viewBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        state.view = b.dataset.view;
        setPressed(viewBtns, b);
        outSvg.toggleAttribute('hidden', state.view !== 'out');
        inSvg.toggleAttribute('hidden', state.view !== 'in');
        $('#sim-colors').toggleAttribute('hidden', state.view !== 'out');
        render();
      });
    });

    var timeBtns = $$('[data-time]');
    timeBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        state.time = b.dataset.time;
        setPressed(timeBtns, b);
        stage.classList.toggle('is-night', state.time === 'night');
        $$('use[data-scene]').forEach(function (u) {
          u.setAttribute('href', state.time === 'night' ? '#sceneNight' : '#sceneDay');
        });
        render();
      });
    });

    var swatches = $$('.swatch');
    swatches.forEach(function (b) {
      b.addEventListener('click', function () {
        var c = COLORS[b.dataset.color];
        outSvg.style.setProperty('--car-1', c[0]);
        outSvg.style.setProperty('--car-2', c[1]);
        outSvg.style.setProperty('--car-3', c[2]);
        setPressed(swatches, b);
      });
    });

    modelEl.addEventListener('input', render);
    render();
  }

  /* =========================================================
     Plotagem de eletrodomésticos
     ========================================================= */
  var eletro = $('#eletro');
  if (eletro) {
    var APPS = {
      geladeira: { name: 'Geladeira', photo: true, desc: 'Trabalho real: esta geladeira chegou com ferrugem e manchas na pintura. Arraste a barra para ver como ficou depois da plotagem. Para ver outros acabamentos, escolha outro aparelho.' },
      micro: { name: 'Micro-ondas', box: [120, 212, 360, 180], desc: 'Renova o frontal do aparelho e esconde arranhões e desbotado.' },
      fogao: { name: 'Fogão', box: [150, 96, 300, 300], desc: 'Dá cara nova à porta do forno e ao painel. Indicamos o material certo para cada área do fogão.' },
      lavadora: { name: 'Máquina de lavar', box: [190, 60, 220, 340], desc: 'Renova o frontal e o painel, e cobre manchas e marcas do tempo.' },
      frigobar: { name: 'Frigobar', box: [215, 210, 170, 184], desc: 'Deixa o frigobar com cara de planejado, combinando com o resto da cozinha.' }
    };
    var FINS = {
      inox: { name: 'Inox escovado', fill: 'url(#f-inox)', tex: 'url(#t-inox)' },
      preto: { name: 'Preto fosco', fill: 'url(#f-preto)', tex: 'none' },
      branco: { name: 'Branco', fill: 'url(#f-branco)', tex: 'none' },
      grafite: { name: 'Grafite', fill: 'url(#f-grafite)', tex: 'none' },
      madeira: { name: 'Madeira', fill: 'url(#f-madeira)', tex: 'url(#t-wood)' },
      vermelho: { name: 'Vermelho', fill: 'url(#f-vermelho)', tex: 'none' }
    };
    var es = { app: 'geladeira', fin: 'inox' };

    var svg = $('#eletro-svg');
    var range = $('#cmp-range');
    var ui = $('#cmp-ui');
    var rect = $('#cmpRect');
    var scr = $('#scratches');

    var cmp = $('#cmp');
    var photos = $('#cmp-photos');
    var fins = $('#fins');
    var finsNote = $('#fins-note');

    function setPos(p) {
      cmp.style.setProperty('--pos', p + '%');
      rect.setAttribute('width', (p / 100 * 600).toFixed(1));
    }
    range.addEventListener('input', function () { setPos(+range.value); });

    function buildWear(box, seed) {
      while (scr.firstChild) scr.removeChild(scr.firstChild);
      var r = rng(seed), x = box[0], y = box[1], w = box[2], h = box[3], i;
      for (i = 0; i < 4; i++) {
        var sx = x + 10 + r() * (w - 20), sy = y + 10 + r() * (h - 20), sr = 14 + r() * 24;
        scr.appendChild(svgEl('circle', { cx: sx.toFixed(1), cy: sy.toFixed(1), r: sr.toFixed(1), fill: 'url(#stainG)' }));
      }
      for (i = 0; i < 3; i++) {
        var rx = x + 8 + r() * (w - 16), ry = y + h * (0.55 + r() * 0.4), rr = 8 + r() * 12;
        scr.appendChild(svgEl('circle', { cx: rx.toFixed(1), cy: Math.min(ry, y + h - 8).toFixed(1), r: rr.toFixed(1), fill: 'url(#rustG)' }));
      }
      for (i = 0; i < 18; i++) {
        var ax = x + 8 + r() * (w - 16), ay = y + 8 + r() * (h - 16);
        var len = 14 + r() * 46, ang = (r() - 0.5) * 1.1 + (r() < 0.35 ? 1.4 : 0);
        var bx = Math.max(x + 4, Math.min(x + w - 4, ax + Math.cos(ang) * len));
        var by = Math.max(y + 4, Math.min(y + h - 4, ay + Math.sin(ang) * len));
        scr.appendChild(svgEl('line', {
          x1: ax.toFixed(1), y1: ay.toFixed(1), x2: bx.toFixed(1), y2: by.toFixed(1),
          stroke: i % 3 === 0 ? '#ffffff' : '#7a6d52', 'stroke-opacity': (0.35 + r() * 0.35).toFixed(2),
          'stroke-width': (0.7 + r() * 1.1).toFixed(2), 'stroke-linecap': 'round'
        }));
      }
    }

    function renderE() {
      var app = APPS[es.app], fin = FINS[es.fin], href = '#app-' + es.app;
      var photo = !!app.photo;
      cmp.classList.toggle('is-photo', photo);
      svg.toggleAttribute('hidden', photo);
      photos.toggleAttribute('hidden', !photo);
      fins.classList.toggle('is-disabled', photo);
      finsNote.toggleAttribute('hidden', !photo);
      $$('input[name="fin"]', eletro).forEach(function (i) { i.disabled = photo; });
      $('#eletro-desc').textContent = app.desc;
      if (photo) {
        $('#eletro-current').innerHTML = '<strong>Geladeira</strong>, trabalho real';
        $('#eletro-wa').href = WA + encodeURIComponent('Olá, Filme Car! Vi o antes e depois da geladeira no site e quero um orçamento para renovar a minha.\n\n*Aparelho:* Geladeira\n*Acabamento:* quero ver as opções\n\nPosso mandar uma foto dela por aqui.');
        return;
      }
      ['aU1', 'aU2', 'aU3', 'bU1', 'bU3'].forEach(function (id) { $('#' + id).setAttribute('href', href); });
      $('#aU1').setAttribute('fill', fin.fill);
      $('#aU2').setAttribute('fill', fin.tex);
      buildWear(app.box, es.app.length * 97 + 13);
      $('#eletro-desc').textContent = app.desc;
      $('#eletro-current').innerHTML = '<strong>' + app.name + '</strong> com acabamento <strong>' + fin.name.toLowerCase() + '</strong>';
      svg.setAttribute('aria-label', app.name + ' com acabamento ' + fin.name.toLowerCase() + ', comparando antes e depois');
      var msg = 'Olá, Filme Car! Vim pelo site e quero um orçamento de plotagem.\n\n' +
        '*Aparelho:* ' + app.name + '\n' +
        '*Acabamento:* ' + fin.name + '\n\n' +
        'Posso mandar uma foto do aparelho por aqui.';
      $('#eletro-wa').href = WA + encodeURIComponent(msg);
    }

    $$('input[name="app"]', eletro).forEach(function (i) {
      i.addEventListener('change', function () { if (i.checked) { es.app = i.value; renderE(); } });
    });
    $$('input[name="fin"]', eletro).forEach(function (i) {
      i.addEventListener('change', function () { if (i.checked) { es.fin = i.value; renderE(); } });
    });

    setPos(50);
    renderE();
  }

})();

(function () {
  'use strict';
  var form = document.getElementById('cov-form');
  if (!form) return;
  var bairro = document.getElementById('cov-bairro');
  var err = document.getElementById('cov-error');
  var WA = 'https://wa.me/5573991091547?text=';
  bairro.addEventListener('input', function () {
    bairro.removeAttribute('aria-invalid');
    err.hidden = true;
  });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var b = bairro.value.trim();
    if (!b) {
      bairro.setAttribute('aria-invalid', 'true');
      err.hidden = false;
      bairro.focus();
      return;
    }
    if (window.abrirOrcamento) {
      window.abrirOrcamento({ 'o-where': 'casa', 'o-bairro': b });
      return;
    }
    var msg = 'Olá, Filme Car! Vim pelo site e quero um orçamento.\n\n*Bairro:* ' + b + '\n\nVocês atendem no meu bairro?';
    window.open(WA + encodeURIComponent(msg), '_blank', 'noopener');
  });
})();
