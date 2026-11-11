/* Janela de orçamento: o cliente escolhe as opções e vê a mensagem antes de enviar no WhatsApp. */
(function () {
  'use strict';
  var dlg = document.getElementById('orc');
  if (!dlg || typeof dlg.showModal !== 'function') return; /* sem suporte: os links diretos continuam funcionando */

  var WA = 'https://wa.me/5573991091547?text=';
  var form = document.getElementById('orc-form');
  var bubble = document.getElementById('orc-bubble');
  var hint = document.getElementById('orc-hint');
  var send = document.getElementById('orc-send');
  var addr = document.getElementById('o-addr');
  var groups = Array.prototype.slice.call(dlg.querySelectorAll('.orc-group'));
  var SERV = {
    carro: 'Película no carro',
    casa: 'Película em casa ou empresa',
    eletro: 'Plotagem de eletrodoméstico',
    frota: 'Adesivo em veículo ou frota',
    outro: 'Outro serviço'
  };

  function radio(name) {
    var el = form.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : '';
  }
  function setRadio(name, value) {
    form.querySelectorAll('input[name="' + name + '"]').forEach(function (i) { i.checked = i.value === value; });
  }
  function val(id) { return document.getElementById(id).value.trim(); }

  function buildMessage() {
    var s = radio('o-serv');
    if (!s) return '';
    var lines = [];
    function add(label, v) { if (v) lines.push('*' + label + ':* ' + v); }
    add('Serviço', SERV[s]);
    if (s === 'carro') {
      add('Película', radio('o-film'));
      add('Laterais e vidro traseiro', radio('o-side'));
      add('Para-brisa', radio('o-wind'));
      add('Carro', val('o-car'));
    } else if (s === 'casa') {
      add('Local', radio('o-place'));
      add('Película', radio('o-hfilm'));
      add('Janelas/medidas', val('o-size'));
    } else if (s === 'eletro') {
      add('Aparelho', radio('o-app'));
      add('Acabamento', radio('o-fin'));
    } else {
      add('Detalhes', val('o-desc'));
    }
    var where = radio('o-where');
    if (where === 'loja') add('Onde', 'Na loja');
    if (where === 'casa') {
      var place = [val('o-bairro'), val('o-city')].filter(Boolean).join(', ');
      add('Onde', 'No meu endereço' + (place ? ' (' + place + ')' : ''));
    }
    add('Nome', val('o-name'));

    var close = 'Qual o valor e quando tem horário?';
    if (s === 'eletro' || s === 'casa') close += ' Posso mandar fotos por aqui.';
    return 'Olá, Filme Car! Vim pelo site e quero um orçamento.\n\n' + lines.join('\n') + '\n\n' + close;
  }

  function escapeHtml(t) {
    return t.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  }
  /* mostra o *negrito* do WhatsApp como negrito de verdade */
  function toHtml(msg) {
    return escapeHtml(msg).replace(/\*([^*\n]+)\*/g, '<b>$1</b>').replace(/\n/g, '<br>');
  }

  function update() {
    var s = radio('o-serv');
    groups.forEach(function (g) {
      g.hidden = !s || g.dataset.for.split(' ').indexOf(s) === -1;
    });
    addr.hidden = radio('o-where') !== 'casa';
    var msg = buildMessage();
    bubble.innerHTML = msg ? toHtml(msg) : '';
    bubble.hidden = !msg;
    hint.hidden = !!msg;
    send.classList.toggle('is-disabled', !msg);
    send.setAttribute('aria-disabled', String(!msg));
    send.href = msg ? WA + encodeURIComponent(msg) : '#';
  }

  form.addEventListener('input', update);
  form.addEventListener('change', function (e) {
    update();
    /* no celular, depois de escolher o serviço, desce até as próximas perguntas */
    if (e.target.name === 'o-serv' && window.matchMedia('(max-width: 760px)').matches) {
      var next = form.querySelector('.orc-q');
      var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (next) setTimeout(function () { next.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); }, 60);
    }
  });
  send.addEventListener('click', function (e) {
    if (!buildMessage()) {
      e.preventDefault();
      var first = form.querySelector('input[name="o-serv"]');
      if (first) first.focus();
      return;
    }
    setTimeout(function () { dlg.close(); }, 300);
  });
  document.getElementById('orc-peek').addEventListener('click', function () {
    document.getElementById('orc-preview').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  document.getElementById('orc-close').addEventListener('click', function () { dlg.close(); });
  dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener('close', function () { document.body.style.overflow = ''; });

  /* abre a janela já preenchida com o que o cliente escolheu no site */
  function open(preset) {
    preset = preset || {};
    Object.keys(preset).forEach(function (k) {
      var v = preset[k];
      if (v == null) return;
      var el = document.getElementById(k);
      if (el && el.type !== 'radio') el.value = v;
      else setRadio(k, v);
    });
    update();
    dlg.showModal();
    document.body.style.overflow = 'hidden';
    dlg.querySelector('.orc-body').scrollTop = 0;
    var s = radio('o-serv');
    var focusEl = s ? dlg.querySelector('.orc-group:not([hidden]) input, .orc-group:not([hidden]) textarea') : dlg.querySelector('input[name="o-serv"]');
    if (focusEl && window.matchMedia('(pointer: fine)').matches) focusEl.focus();
  }
  window.abrirOrcamento = open;

  function glass(v) {
    v = +v;
    if (!v) return '';
    if (v === 100) return 'Sem película';
    return 'G' + (v < 10 ? '0' + v : v);
  }
  function checked(sel) {
    var el = document.querySelector(sel);
    return el ? el.value : '';
  }
  var APP_NAMES = { geladeira: 'Geladeira', micro: 'Micro-ondas', fogao: 'Fogão', lavadora: 'Máquina de lavar', frigobar: 'Frigobar' };
  var FIN_NAMES = { inox: 'Inox escovado', preto: 'Preto fosco', branco: 'Branco', grafite: 'Grafite', madeira: 'Madeira', vermelho: 'Vermelho' };

  function presetFor(btn) {
    var kind = btn.dataset.orc;
    if (kind === 'sim') {
      var side = glass(checked('input[name="side"]:checked'));
      return {
        'o-serv': 'carro',
        'o-film': side === 'Sem película' ? null : 'Fumê',
        'o-side': side === 'Sem película' ? '' : side,
        'o-wind': glass(checked('input[name="wind"]:checked')),
        'o-car': (document.getElementById('sim-model') || {}).value || null
      };
    }
    if (kind === 'eletro') {
      var app = checked('input[name="app"]:checked');
      return {
        'o-serv': 'eletro',
        'o-app': APP_NAMES[app] || null,
        'o-fin': app === 'geladeira' ? 'Quero ver as opções' : FIN_NAMES[checked('input[name="fin"]:checked')] || null
      };
    }
    var p = {};
    if (kind) p['o-serv'] = kind;
    if (btn.dataset.film) p['o-film'] = btn.dataset.film;
    return p;
  }

  document.querySelectorAll('[data-orc]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      open(presetFor(btn));
    });
  });
})();
