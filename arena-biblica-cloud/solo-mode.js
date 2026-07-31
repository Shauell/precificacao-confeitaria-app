(() => {
  'use strict';

  const KEY = 'arenaBiblicaCloudProfile';
  const app = document.getElementById('app');
  const toast = document.getElementById('toast');
  const letters = ['A', 'B', 'C', 'D'];
  const Q = Array.isArray(window.ARENA_QUESTIONS) ? window.ARENA_QUESTIONS : [];
  let state = null;
  let ticker = null;
  let advance = null;

  function loadProfile() {
    try {
      return Object.assign(
        { name: '', avatar: '🦁', xp: 0, wins: 0, games: 0, correct: 0, bestSolo: 0, soloGames: 0 },
        JSON.parse(localStorage.getItem(KEY) || '{}')
      );
    } catch (_) {
      return { name: '', avatar: '🦁', xp: 0, wins: 0, games: 0, correct: 0, bestSolo: 0, soloGames: 0 };
    }
  }

  function saveProfile(profile) {
    localStorage.setItem(KEY, JSON.stringify(profile));
  }

  function esc(value) {
    return String(value ?? '').replace(/[&<>'\"]/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '\"': '&quot;'
    }[char]));
  }

  function shuffle(items) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function say(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(say.timer);
    say.timer = setTimeout(() => toast.classList.remove('show'), 2300);
  }

  function stopTimers() {
    clearInterval(ticker);
    clearTimeout(advance);
    ticker = null;
    advance = null;
  }

  function head(subtitle) {
    return `<header class="brand"><div class="brand-mark">📖🎯</div><h1>Arena Bíblica</h1><p>${esc(subtitle)}</p></header>`;
  }

  function buildDeck(config) {
    let pool = Q.filter(question =>
      (config.category === 'all' || question.c === config.category) &&
      (config.difficulty === 'all' || question.d === config.difficulty)
    );

    if (pool.length < config.count) {
      pool = Q.filter(question => config.difficulty === 'all' || question.d === config.difficulty);
    }

    return shuffle(pool)
      .slice(0, Math.min(config.count, pool.length))
      .map(question => {
        const order = shuffle(question.o.map((text, index) => ({ text, index })));
        return {
          c: question.c,
          d: question.d,
          q: question.q,
          o: order.map(item => item.text),
          a: order.findIndex(item => item.index === question.a),
          e: question.e,
          r: question.r,
          f: question.f || ''
        };
      });
  }

  function currentProfileFromHome() {
    const profile = loadProfile();
    const name = (document.getElementById('name')?.value || profile.name).trim();
    if (name.length < 2) {
      say('Digite um nome com pelo menos 2 letras.');
      return null;
    }
    profile.name = name.slice(0, 24);
    profile.avatar = document.querySelector('.avatar.selected')?.textContent?.trim() || profile.avatar || '🦁';
    saveProfile(profile);
    return profile;
  }

  function decorateHome() {
    const createButton = document.getElementById('create');
    if (!createButton || document.getElementById('solo-mode')) return;

    createButton.textContent = '⚔️ Criar duelo online';
    const actions = createButton.parentElement;
    if (!actions) return;

    const soloButton = document.createElement('button');
    soloButton.id = 'solo-mode';
    soloButton.className = 'btn primary';
    soloButton.textContent = '🎯 Jogar sozinho';
    soloButton.onclick = () => {
      const profile = currentProfileFromHome();
      if (profile) showConfig(profile);
    };
    actions.insertBefore(soloButton, createButton);

    const subtitle = app.querySelector('.brand p');
    if (subtitle) subtitle.textContent = 'Jogue sozinho ou desafie alguém em outro celular';
    const footer = app.querySelector('.footer-note');
    if (footer) footer.textContent = 'O modo individual não precisa de outro aparelho. Para o duelo online, mantenha os dois celulares conectados à internet.';
  }

  function showConfig(profile = loadProfile()) {
    stopTimers();
    state = null;
    const categories = [...new Set(Q.map(question => question.c))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
    app.innerHTML = `<main class="shell">${head('Treine no seu ritmo e tente superar seu recorde')}<section class="card"><div class="grid two"><label>Categoria<select id="solo-cat"><option value="all">Todas</option>${categories.map(category => `<option>${esc(category)}</option>`).join('')}</select></label><label>Dificuldade<select id="solo-dif"><option value="all">Misturada</option><option value="facil">Fácil</option><option value="medio">Média</option><option value="dificil">Difícil</option></select></label><label>Perguntas<select id="solo-count"><option>10</option><option selected>15</option><option>20</option><option>30</option></select></label><label>Tempo por pergunta<select id="solo-seconds"><option value="0">Sem limite</option><option value="15">15 segundos</option><option value="20" selected>20 segundos</option><option value="30">30 segundos</option></select></label><label>Explicação na tela<select id="solo-delay"><option value="3500">3,5 segundos</option><option value="5000" selected>5 segundos</option><option value="7000">7 segundos</option><option value="10000">10 segundos</option></select></label></div><div class="notice success" style="margin-top:14px"><b>Modo individual:</b> responda, confira a explicação bíblica e avance automaticamente. Acertos seguidos formam sua melhor sequência.</div><div class="statline" style="margin-top:14px"><span class="pill">🎯 Recorde: ${profile.bestSolo || 0}</span><span class="pill">🎮 Partidas solo: ${profile.soloGames || 0}</span></div><div class="actions"><button class="btn primary" id="solo-start">Começar desafio individual</button><button class="btn ghost" id="solo-back">Voltar</button></div></section></main>`;

    document.getElementById('solo-start').onclick = () => start({
      category: document.getElementById('solo-cat').value,
      difficulty: document.getElementById('solo-dif').value,
      count: Number(document.getElementById('solo-count').value),
      seconds: Number(document.getElementById('solo-seconds').value),
      delay: Number(document.getElementById('solo-delay').value)
    });
    document.getElementById('solo-back').onclick = () => location.reload();
  }

  function start(config) {
    const deck = buildDeck(config);
    if (!deck.length) {
      say('Não há perguntas disponíveis com esses filtros.');
      return;
    }

    const profile = loadProfile();
    state = {
      config,
      profile,
      deck,
      count: deck.length,
      index: -1,
      phase: 'question',
      current: null,
      selected: undefined,
      timedOut: false,
      time: 0,
      score: 0,
      correct: 0,
      streak: 0,
      bestStreak: 0,
      saved: false
    };
    nextQuestion();
  }

  function nextQuestion() {
    stopTimers();
    state.index += 1;
    if (state.index >= state.count) {
      finish();
      return;
    }

    state.phase = 'question';
    state.current = state.deck[state.index];
    state.selected = undefined;
    state.timedOut = false;
    state.time = state.config.seconds;
    renderGame();

    if (state.config.seconds) {
      ticker = setInterval(() => {
        state.time -= 1;
        renderGame();
        if (state.time <= 0) reveal(true);
      }, 1000);
    }
  }

  function answer(index) {
    if (!state || state.phase !== 'question' || ![0, 1, 2, 3].includes(index)) return;
    state.selected = index;
    if (index === state.current.a) {
      state.correct += 1;
      state.streak += 1;
      state.bestStreak = Math.max(state.bestStreak, state.streak);
      state.score += 100 + (state.config.seconds ? Math.max(0, state.time) * 2 : 0);
    } else {
      state.streak = 0;
    }
    reveal(false);
  }

  function reveal(timedOut) {
    if (!state || state.phase !== 'question') return;
    stopTimers();
    state.phase = 'reveal';
    state.timedOut = timedOut;
    if (timedOut) state.streak = 0;
    renderGame();
    advance = setTimeout(nextQuestion, state.config.delay);
  }

  function finish() {
    stopTimers();
    if (!state) return;
    state.phase = 'finished';

    if (!state.saved) {
      state.saved = true;
      const profile = loadProfile();
      profile.games = (profile.games || 0) + 1;
      profile.soloGames = (profile.soloGames || 0) + 1;
      profile.correct = (profile.correct || 0) + state.correct;
      profile.xp = (profile.xp || 0) + state.correct * 20 + 20;
      if (state.correct === state.count) profile.xp += 100;
      profile.bestSolo = Math.max(profile.bestSolo || 0, state.score);
      saveProfile(profile);
      state.profile = profile;
    }
    renderResult();
  }

  function difficultyLabel(value) {
    if (value === 'dificil') return 'Difícil';
    if (value === 'medio') return 'Média';
    return 'Fácil';
  }

  function renderGame() {
    if (!state || state.phase === 'finished') return;
    const question = state.current;
    const canAnswer = state.phase === 'question';
    const selected = state.selected;
    const status = state.phase === 'reveal'
      ? (state.timedOut ? 'O tempo terminou. ⏳' : selected === question.a ? 'Resposta correta! 🎉' : 'Resposta incorreta.')
      : 'Escolha uma alternativa.';

    app.innerHTML = `<main class="shell"><div class="topbar"><div><div class="room-code">MODO SOLO</div><div class="connection ok">● ${esc(state.profile.name)}</div></div><button class="btn small danger" id="solo-end">Encerrar</button></div><section class="card"><div class="player-grid solo-grid"><div class="player me active"><div class="player-head"><span class="player-emoji">${state.profile.avatar}</span><b>${esc(state.profile.name)}</b></div><div class="score">${state.score}</div><div class="corrects">${state.correct} acertos • sequência ${state.streak} • melhor ${state.bestStreak}</div></div></div><div class="progress-wrap"><div class="progress" style="width:${((state.index + 1) / state.count) * 100}%"></div></div><div class="question-head"><span>${esc(question.c)} • ${difficultyLabel(question.d)} • ${state.index + 1}/${state.count}</span>${state.config.seconds ? `<span class="timer ${state.time <= 5 ? 'low' : ''}">${state.time}</span>` : ''}</div><div class="question">${esc(question.q)}</div><div class="notice ${canAnswer ? 'success' : selected === question.a ? 'success' : state.timedOut ? 'warn' : 'error'}">${status}</div><div class="options" style="margin-top:13px">${question.o.map((option, index) => {
      const classes = ['option'];
      if (selected === index) classes.push('selected');
      if (state.phase === 'reveal' && question.a === index) classes.push('correct');
      if (state.phase === 'reveal' && selected === index && selected !== question.a) classes.push('wrong');
      return `<button class="${classes.join(' ')}" data-solo-answer="${index}" ${canAnswer ? '' : 'disabled'}><span class="letter">${letters[index]}</span><span>${esc(option)}</span></button>`;
    }).join('')}</div>${state.phase === 'reveal' ? `<div class="reveal notice ${selected === question.a ? 'success' : state.timedOut ? 'warn' : 'error'}"><h3>${status}</h3><p>${esc(question.e)}</p><p class="reference">${esc(question.r)}</p>${question.f ? `<p>${esc(question.f)}</p>` : ''}<p>Próxima pergunta automaticamente…</p></div>` : ''}</section><p class="footer-note">Seu recorde individual fica salvo neste aparelho.</p></main>`;

    document.querySelectorAll('[data-solo-answer]').forEach(button => {
      button.onclick = () => answer(Number(button.dataset.soloAnswer));
    });
    document.getElementById('solo-end').onclick = () => {
      if (confirm('Encerrar o desafio individual agora?')) finish();
    };
  }

  function renderResult() {
    const percent = state.count ? Math.round((state.correct / state.count) * 100) : 0;
    const title = percent === 100 ? 'Perfeito! 🏆' : percent >= 80 ? 'Excelente! 🌟' : percent >= 60 ? 'Muito bem! 👏' : 'Continue treinando! 📖';
    const trophy = percent === 100 ? '🏆' : percent >= 80 ? '🌟' : percent >= 60 ? '👏' : '📖';

    app.innerHTML = `<main class="shell">${head('Resultado do desafio individual')}<section class="card result"><div class="trophy">${trophy}</div><h2>${title}</h2><p>${esc(state.profile.name)}, você acertou ${state.correct} de ${state.count} perguntas e fez ${state.score} pontos.</p><div class="player-grid solo-grid"><div class="player active"><div class="score">${percent}%</div><div class="corrects">Melhor sequência: ${state.bestStreak} • Recorde: ${state.profile.bestSolo || 0}</div></div></div><div class="statline solo-stats"><span class="pill">✨ ${state.profile.xp} XP</span><span class="pill">🎯 ${state.score} pontos</span><span class="pill">✅ ${state.correct} acertos</span></div>${state.correct === state.count ? '<div class="notice success" style="margin-top:14px">Desafio perfeito! Você recebeu 100 XP extras. 🎉</div>' : ''}<div class="actions"><button class="btn primary" id="solo-again">Jogar novamente</button><button class="btn secondary" id="solo-config">Mudar configuração</button><button class="btn ghost" id="solo-home">Voltar ao início</button></div></section></main>`;

    document.getElementById('solo-again').onclick = () => start({ ...state.config });
    document.getElementById('solo-config').onclick = () => showConfig(loadProfile());
    document.getElementById('solo-home').onclick = () => location.reload();
  }

  const style = document.createElement('style');
  style.textContent = '.player-grid.solo-grid{grid-template-columns:1fr}.solo-stats{justify-content:center}';
  document.head.appendChild(style);

  const observer = new MutationObserver(decorateHome);
  observer.observe(app, { childList: true, subtree: true });
  decorateHome();
})();
