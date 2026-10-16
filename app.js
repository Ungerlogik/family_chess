/* ============================================================================
 * FAMILIEN-SCHACH APP (ES5-kompatibel für iOS 10+ & Android)
 * ============================================================================ */

// 1. SUPABASE KONFIGURATION
var SUPABASE_URL = 'https://tkxwgshnsxvvrwghmois.supabase.co';
var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRreHdnc2huc3h2dnJ3Z2htb2lzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxNzg5MDcsImV4cCI6MjEwNzc1NDkwN30.DyNlKFtStR0sOPsYjJHxZPRL11YoqReMv2QMMKTNJ04';

// Klassischer Elo K-Faktor (bei Bedarf hier anpassbar, wird in DB genutzt)
var ELO_K_FACTOR = 20;
var SANDBOX_WAIT_SECONDS = 60;

// App-Status
var state = {
    userName: '',
    password: '',
    serverToday: '',
    players: [],
    games: [],
    currentGame: null,
    chess: null,          // Aktuelle Brettstellung (inkl. Sandkasten-Probezüge)
    baseFen: '',          // Echte gespeicherte Stellung der Partie
    mySide: 'w',          // 'w' oder 'b'
    canMoveToday: false,  // Bin ich am Zug UND habe heute noch nicht gezogen?
    selectedSq: null,
    pendingPromoMove: null,
    sandboxStartTs: 0,
    sandboxSecondsLeft: 60,
    sandboxTimerId: null,
    arrowMode: false,
    arrowStartSq: null,
    arrows: []            // [{from: 'e2', to: 'e4'}]
};

// Hochwertige, gestochen scharfe Inline-SVG-Schachfiguren
var PIECE_SVGS = {
    wp: '<svg viewBox="0 0 45 45" class="piece-svg"><path d="M 22.5,9 C 19.5,9 17,11.5 17,14.5 C 17,16.8 18.4,18.7 20.4,19.5 C 17,21 14.5,24.5 14.5,29 L 30.5,29 C 30.5,24.5 28,21 24.6,19.5 C 26.6,18.7 28,16.8 28,14.5 C 28,11.5 25.5,9 22.5,9 z M 11.5,33 L 33.5,33 L 33.5,36 L 11.5,36 L 11.5,33 z" fill="#ffffff" stroke="#111" stroke-width="2"/></svg>',
    wr: '<svg viewBox="0 0 45 45" class="piece-svg"><g fill="#ffffff" stroke="#111" stroke-width="2"><path d="M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 z M 14,29.5 L 14,16.5 L 31,16.5 L 31,29.5 L 14,29.5 z M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14"/></g></svg>',
    wn: '<svg viewBox="0 0 45 45" class="piece-svg"><g fill="#ffffff" stroke="#111" stroke-width="2"><path d="M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18"/><path d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,9.506 13.5,8.5 13.5,7.5 C 14.5,6.5 16.5,10 16.5,10 L 18.5,10 C 18.5,10 19.28,8.008 21,7 C 22,7 22,10 22,10"/></g></svg>',
    wb: '<svg viewBox="0 0 45 45" class="piece-svg"><g fill="#ffffff" stroke="#111" stroke-width="2"><path d="M 9,36 C 12.39,35.03 19.11,36.43 22.5,34 C 25.89,36.43 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.35,38.99 36,38.5 C 32.61,37.53 25.89,38.96 22.5,37.5 C 19.11,38.96 12.39,37.53 9,38.5 C 7.646,38.99 6.677,38.97 6,38 C 7.354,36.06 9,36 9,36 z"/><path d="M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 30.5,30.5 30,30 30,30 C 30,27.5 27.5,26 27.5,26 C 33,24.5 33.5,14.5 22.5,10.5 C 11.5,14.5 12,24.5 17.5,26 C 17.5,26 15,27.5 15,30 C 15,30 14.5,30.5 15,32 z"/><circle cx="22.5" cy="8" r="2.2"/></g></svg>',
    wq: '<svg viewBox="0 0 45 45" class="piece-svg"><g fill="#ffffff" stroke="#111" stroke-width="2"><path d="M 9,26 C 17.5,24.5 30,24.5 36,26 L 38.5,13.5 L 31,25 L 30.7,10.9 L 25.5,24.5 L 22.5,10 L 19.5,24.5 L 14.3,10.9 L 14,25 L 6.5,13.5 L 9,26 z"/><path d="M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 11,36 11,36 C 9.5,37.5 11,38.5 11,38.5 C 17.5,39.5 27.5,39.5 34,38.5 C 34,38.5 35.5,37.5 34,36 C 34,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26 C 27.5,24.5 17.5,24.5 9,26 z"/></g></svg>',
    wk: '<svg viewBox="0 0 45 45" class="piece-svg"><g fill="#ffffff" stroke="#111" stroke-width="2"><path d="M 22.5,11.63 L 22.5,6"/><path d="M 20,8 L 25,8"/><path d="M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 25.5,14.5 24.5,12 22.5,12 C 20.5,12 19.5,14.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25"/><path d="M 11.5,37 C 17,40.5 27,40.5 32.5,37 L 32.5,30 C 32.5,30 41.5,25.5 38.5,19.5 C 34.5,13 25,16 22.5,23.5 L 22.5,27 L 22.5,23.5 C 19,16 9.5,13 6.5,19.5 C 3.5,25.5 11.5,29.5 11.5,29.5 L 11.5,37 z"/></g></svg>'
};
// Schwarze Figuren automatisch aus den weißen generieren
var pKeys = ['p', 'r', 'n', 'b', 'q', 'k'];
for (var i = 0; i < pKeys.length; i++) {
    var k = pKeys[i];
    PIECE_SVGS['b' + k] = PIECE_SVGS['w' + k]
    .replace('fill="#ffffff"', 'fill="#262b30"')
    .replace('stroke="#111"', 'stroke="#f5f6fa"');
}

var PIECE_VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

/* ============================================================================
 * 2. KOMPATIBLE SUPABASE REST-API FUNKTION (XMLHttpRequest für iOS 10)
 * ============================================================================ */
function callRpc(fnName, params, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', SUPABASE_URL + '/rest/v1/rpc/' + fnName, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('apikey', SUPABASE_KEY);
    xhr.setRequestHeader('Authorization', 'Bearer ' + SUPABASE_KEY);

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status >= 200 && xhr.status < 300) {
                var res = null;
                try { res = JSON.parse(xhr.responseText); } catch (e) {}
                callback(null, res);
            } else {
                var errMsg = 'Server-Fehler (' + xhr.status + ')';
                try {
                    var errObj = JSON.parse(xhr.responseText);
                    if (errObj && errObj.message) errMsg = errObj.message;
                } catch (e) {}
                callback(errMsg, null);
            }
        }
    };
    xhr.send(JSON.stringify(params));
}

/* ============================================================================
 * 3. LOGIN, LOCALSTORAGE & LOBBY-SYNCHRONISATION
 * ============================================================================ */
function initApp() {
    var savedName = localStorage.getItem('fc_name') || '';
    var savedPw = localStorage.getItem('fc_pw') || '';

    document.getElementById('inp-name').value = savedName;
    document.getElementById('inp-pw').value = savedPw;

    if (savedName && savedPw) {
        attemptLogin(savedName, savedPw);
    }
}

function attemptLogin(name, pw) {
    var errEl = document.getElementById('login-error');
    errEl.textContent = '';

    if (!name || !pw) {
        errEl.textContent = 'Bitte gib deinen Vornamen und das Familien-Passwort ein.';
        return;
    }

    document.getElementById('btn-login').textContent = 'Verbinde...';
    callRpc('rpc_sync_state', { pw: pw, p_name: name }, function (err, data) {
        document.getElementById('btn-login').textContent = 'Anmelden & Merken';
        if (err) {
            errEl.textContent = err;
            return;
        }

        state.userName = name.trim();
        state.password = pw;
        localStorage.setItem('fc_name', state.userName);
        localStorage.setItem('fc_pw', state.password);

        applySyncData(data);
        showView('view-lobby');
    });
}

function syncLobby(callback) {
    callRpc('rpc_sync_state', { pw: state.password, p_name: state.userName }, function (err, data) {
        if (!err && data) {
            applySyncData(data);
        }
        if (callback) callback(err, data);
    });
}

function applySyncData(data) {
    state.serverToday = data.today;
    state.players = data.players || [];
    state.games = data.games || [];
    renderLobby();
}

function showView(viewId) {
    var views = ['view-login', 'view-lobby', 'view-game'];
    for (var i = 0; i < views.length; i++) {
        var el = document.getElementById(views[i]);
        if (views[i] === viewId) {
            el.classList.remove('hidden');
        } else {
            el.classList.add('hidden');
        }
    }
}

/* ============================================================================
 * 4. LOBBY & LEADERBOARD RENDERN
 * ============================================================================ */
function renderLobby() {
    document.getElementById('lbl-user-name').textContent = state.userName;
    var me = findPlayer(state.userName);
    if (me) {
        document.getElementById('lbl-user-elo').textContent = me.elo + ' Elo';
    }

    // 1. Offene & Beendete Partien trennen
    var activeContainer = document.getElementById('list-active-games');
    var finishedContainer = document.getElementById('list-finished-games');
    activeContainer.innerHTML = '';
    finishedContainer.innerHTML = '';

    var activeCount = 0;
    var finishedCount = 0;

    for (var i = 0; i < state.games.length; i++) {
        var g = state.games[i];
        var isParticipant = (g.white_player === state.userName || g.black_player === state.userName);

        if (g.status === 'active' && isParticipant) {
            activeCount++;
            activeContainer.appendChild(createGameRow(g, true));
        } else if (g.status !== 'active') {
            finishedCount++;
            if (finishedCount <= 10) {
                finishedContainer.appendChild(createGameRow(g, false));
            }
        }
    }

    if (activeCount === 0) {
        activeContainer.innerHTML = '<p class="hint">Keine offenen Partien. Starte unten ein neues Spiel!</p>';
    }
    if (finishedCount === 0) {
        finishedContainer.innerHTML = '<p class="hint">Noch keine abgeschlossenen Partien.</p>';
    }

    // 2. Gegner-Buttons
    var oppGrid = document.getElementById('list-opponents');
    oppGrid.innerHTML = '';
    for (var j = 0; j < state.players.length; j++) {
        var p = state.players[j];
        if (p.name === state.userName) continue;

        var btn = document.createElement('button');
        btn.className = 'btn opp-btn' + (p.is_bot ? ' bot-btn' : '');
        btn.textContent = (p.is_bot ? '🤖 ' : '👤 ') + p.name + ' (' + p.elo + ')';
        btn.setAttribute('data-opp', p.name);
        btn.onclick = function () {
            startNewGame(this.getAttribute('data-opp'));
        };
        oppGrid.appendChild(btn);
    }

    // 3. Leaderboard (OHNE Bots!)
    var tbody = document.getElementById('tbody-leaderboard');
    tbody.innerHTML = '';
    var rank = 1;
    for (var k = 0; k < state.players.length; k++) {
        var pl = state.players[k];
        if (pl.is_bot) continue; // Bots hier im Leaderboard überspringen!

        var tr = document.createElement('tr');
        tr.innerHTML =
        '<td>' + (rank++) + '.</td>' +
        '<td><strong>' + escapeHtml(pl.name) + '</strong></td>' +
        '<td><strong>' + pl.elo + '</strong></td>' +
        '<td>' + pl.wins + '</td>' +
        '<td>' + pl.draws + '</td>' +
        '<td>' + pl.losses + '</td>';
        tbody.appendChild(tr);
    }
}

function createGameRow(g, isActive) {
    var div = document.createElement('div');
    var mySide = (g.white_player === state.userName) ? 'w' : 'b';
    var oppName = (mySide === 'w') ? g.black_player : g.white_player;
    var statusLabel = '';
    var extraClass = '';

    if (isActive) {
        var isMyTurn = (g.turn === mySide);
        var myLastDate = (mySide === 'w') ? g.white_last_move_date : g.black_last_move_date;
        var movedToday = (myLastDate === state.serverToday);

        if (isMyTurn && !movedToday) {
            statusLabel = '🟢 Du bist am Zug!';
            extraClass = ' my-turn';
        } else if (isMyTurn && movedToday) {
            statusLabel = '⏳ Heute schon gezogen (ab 00:00 Uhr)';
            extraClass = ' waiting-tomorrow';
        } else {
            statusLabel = '⚪ Warte auf ' + oppName;
        }
    } else {
        statusLabel = g.result_reason || g.status;
    }

    div.className = 'game-item' + extraClass;
    div.innerHTML =
    '<div><strong>' + escapeHtml(g.white_player) + ' (W)</strong> vs. <strong>' + escapeHtml(g.black_player) + ' (S)</strong><br>' +
    '<small>' + escapeHtml(statusLabel) + '</small></div>' +
    '<span>→</span>';

    div.onclick = function () {
        openGame(g.id);
    };
    return div;
}

function startNewGame(opponentName) {
    callRpc('rpc_start_game', {
        pw: state.password,
        p_creator: state.userName,
        p_opponent: opponentName
    }, function (err, newGame) {
        if (err) {
            alert(err);
            return;
        }
        syncLobby(function () {
            openGame(newGame.id);
        });
    });
}

/* ============================================================================
 * 5. SPIELBRETT ÖFFNEN & 60-SEKUNDEN SANDKASTEN-TIMER
 * ============================================================================ */
function openGame(gameId) {
    var g = null;
    for (var i = 0; i < state.games.length; i++) {
        if (state.games[i].id === gameId) { g = state.games[i]; break; }
    }
    if (!g) return;

    state.currentGame = g;
    state.baseFen = g.fen;
    state.chess = new Chess(g.fen);
    state.mySide = (g.white_player === state.userName) ? 'w' : 'b';
    state.selectedSq = null;
    state.arrows = [];
    state.arrowMode = false;
    updateArrowButton();

    showView('view-game');

    // Falls Gegner ein Bot ist und der Bot in einer neu gestarteten Partie Weiß hat:
    var currentTurnPlayer = (g.turn === 'w') ? g.white_player : g.black_player;
    var turnPlayerObj = findPlayer(currentTurnPlayer);
    if (g.status === 'active' && turnPlayerObj && turnPlayerObj.is_bot) {
        setupGameUI();
        renderBoard();
        triggerBotTurn(g, turnPlayerObj);
        return;
    }

    // Prüfen, ob der Spieler jetzt ziehen darf (am Zug + heute noch nicht gezogen)
    var isMyTurn = (g.status === 'active' && g.turn === state.mySide);
    var myLastDate = (state.mySide === 'w') ? g.white_last_move_date : g.black_last_move_date;
    var alreadyMovedToday = (myLastDate === state.serverToday);

    state.canMoveToday = (isMyTurn && !alreadyMovedToday);

    if (state.canMoveToday) {
        startSandboxTimer();
    } else {
        stopSandboxTimer();
    }

    setupGameUI();
    renderBoard();
}

function startSandboxTimer() {
    stopSandboxTimer();
    state.sandboxStartTs = Date.now();
    state.sandboxSecondsLeft = SANDBOX_WAIT_SECONDS;
    document.getElementById('timer-box').classList.remove('hidden');

    // Sandkasten-Hilfen (Bedrohungs-Radar & Patzer-Warnung) freischalten
    setSandboxHelpersEnabled(true);
    updateTimerUI();

    state.sandboxTimerId = setInterval(function () {
        var elapsed = Math.floor((Date.now() - state.sandboxStartTs) / 1000);
        var left = SANDBOX_WAIT_SECONDS - elapsed;
        if (left <= 0) {
            state.sandboxSecondsLeft = 0;
            clearInterval(state.sandboxTimerId);
            state.sandboxTimerId = null;
            // Nach 60s: Starke Sandkasten-Hilfen automatisch abschalten!
            setSandboxHelpersEnabled(false);
            renderBoard();
        } else {
            state.sandboxSecondsLeft = left;
        }
        updateTimerUI();
        updateSubmitButtonState();
    }, 500);
}

function stopSandboxTimer() {
    if (state.sandboxTimerId) {
        clearInterval(state.sandboxTimerId);
        state.sandboxTimerId = null;
    }
    document.getElementById('timer-box').classList.add('hidden');
    setSandboxHelpersEnabled(false);
}

function setSandboxHelpersEnabled(inSandboxWindow) {
    var chkRadar = document.getElementById('chk-radar');
    var chkBlunder = document.getElementById('chk-blunder');
    var lblRadar = document.getElementById('lbl-chk-radar');
    var lblBlunder = document.getElementById('lbl-chk-blunder');

    if (inSandboxWindow) {
        chkRadar.disabled = false;
        chkBlunder.disabled = false;
        lblRadar.classList.remove('disabled-helper');
        lblBlunder.classList.remove('disabled-helper');
    } else {
        chkRadar.checked = false;
        chkBlunder.checked = false;
        chkRadar.disabled = true;
        chkBlunder.disabled = true;
        lblRadar.classList.add('disabled-helper');
        lblBlunder.classList.add('disabled-helper');
        document.getElementById('blunder-warning').classList.add('hidden');
    }
}

function updateTimerUI() {
    var pct = Math.min(100, Math.round(((SANDBOX_WAIT_SECONDS - state.sandboxSecondsLeft) / SANDBOX_WAIT_SECONDS) * 100));
    var bar = document.getElementById('timer-bar');
    bar.style.width = pct + '%';

    if (state.sandboxSecondsLeft > 0) {
        bar.classList.remove('ready');
        document.getElementById('timer-text').textContent = 'Sandkasten-Phase: Figuren frei ausprobieren!';
        document.getElementById('timer-sec').textContent = state.sandboxSecondsLeft + 's';
    } else {
        bar.classList.add('ready');
        document.getElementById('timer-text').textContent = 'Bedenkzeit erreicht! Stelle deinen 1. Zug aufs Brett.';
        document.getElementById('timer-sec').textContent = 'Bereit ✓';
    }
}

function setupGameUI() {
    var g = state.currentGame;
    document.getElementById('game-title-bar').textContent = g.white_player + ' vs. ' + g.black_player;

    var topName = (state.mySide === 'w') ? g.black_player + ' (Schwarz)' : g.white_player + ' (Weiß)';
    var botName = (state.mySide === 'w') ? g.white_player + ' (Weiß)' : g.black_player + ' (Schwarz)';
    document.getElementById('lbl-top-player').textContent = topName;
    document.getElementById('lbl-bottom-player').textContent = botName;

    var banner = document.getElementById('turn-banner');
    banner.className = 'turn-banner';

    if (g.status !== 'active') {
        banner.textContent = 'Partie beendet: ' + (g.result_reason || g.status);
        banner.classList.add('blue');
    } else if (state.canMoveToday) {
        banner.textContent = 'Du bist am Zug! Nutze das Brett zum Ausprobieren.';
        banner.classList.add('green');
    } else if (g.turn === state.mySide) {
        banner.textContent = 'Du hast heute in dieser Partie schon gezogen. Nächster Zug ab 00:00 Uhr!';
        banner.classList.add('orange');
    } else {
        banner.textContent = 'Gegner ist am Zug. (Du kannst trotzdem Probe-Züge auf dem Brett testen)';
    }

    // Vor dem 1. Zug: "Beenden" statt "Aufgeben"
    var btnResignAbort = document.getElementById('btn-resign-abort');
    if (g.move_count <= 1) {
        btnResignAbort.textContent = '✕ Spiel beenden (ohne Wertung)';
    } else {
        btnResignAbort.textContent = '🏳️ Aufgeben';
    }

    // Remis-Banner prüfen
    var drawBanner = document.getElementById('draw-offer-banner');
    if (g.status === 'active' && g.draw_offered_by && g.draw_offered_by !== state.mySide) {
        drawBanner.classList.remove('hidden');
    } else {
        drawBanner.classList.add('hidden');
    }

    updateSubmitButtonState();
}

/* ============================================================================
 * 6. SCHACHBRETT RENDERN & LERN-HILFEN BERECHNEN
 * ============================================================================ */
function renderBoard() {
    var boardEl = document.getElementById('chessboard');
    boardEl.innerHTML = '';

    var showLegal = document.getElementById('chk-legal').checked;
    var showLast = document.getElementById('chk-lastmove').checked;
    var showMat = document.getElementById('chk-material').checked;
    var showHeat = document.getElementById('chk-heatmap').checked;
    var showRadar = document.getElementById('chk-radar').checked && (state.sandboxSecondsLeft > 0);
    var showBlunder = document.getElementById('chk-blunder').checked && (state.sandboxSecondsLeft > 0);

    // Legale Züge für ausgewähltes Feld berechnen
    var legalTargets = {};
    if (state.selectedSq && showLegal) {
        var moves = state.chess.moves({ square: state.selectedSq, verbose: true });
        for (var m = 0; m < moves.length; m++) {
            legalTargets[moves[m].to] = moves[m].captured ? 'capture' : 'move';
        }
    }

    // Taktische Analyse (Heatmap & Bedrohungs-Radar)
    var analysis = analyzeBoardControl(state.chess, state.mySide);

    var files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    for (var r = 0; r < 8; r++) {
        for (var c = 0; c < 8; c++) {
            var rank = (state.mySide === 'w') ? (8 - r) : (r + 1);
            var fileIndex = (state.mySide === 'w') ? c : (7 - c);
            var sqName = files[fileIndex] + rank;

            var sqDiv = document.createElement('div');
            var isLight = ((r + c) % 2 === 0);
            sqDiv.className = 'square ' + (isLight ? 'sq-light' : 'sq-dark');
            sqDiv.setAttribute('data-sq', sqName);

            // Auswahl & letzter Zug
            if (state.selectedSq === sqName) {
                sqDiv.classList.add('sq-selected');
            } else if (showLast && state.currentGame && state.currentGame.last_move_uci) {
                var uci = state.currentGame.last_move_uci;
                if (sqName === uci.substring(0, 2) || sqName === uci.substring(2, 4)) {
                    sqDiv.classList.add('sq-last-move');
                }
            }

            // Raumkontrolle (Heatmap)
            if (showHeat) {
                var myCtrl = analysis.myAttacks[sqName] || 0;
                var oppCtrl = analysis.oppAttacks[sqName] || 0;
                if (myCtrl > 0 && oppCtrl === 0) sqDiv.classList.add('sq-heat-mine');
                else if (oppCtrl > 0 && myCtrl === 0) sqDiv.classList.add('sq-heat-opp');
                else if (myCtrl > 0 && oppCtrl > 0) sqDiv.classList.add('sq-heat-both');
            }

            // Bedrohungs-Radar (nur in den 60s!)
            var piece = state.chess.get(sqName);
            if (showRadar && piece && piece.color === state.mySide && piece.type !== 'k') {
                var attackers = analysis.oppAttacks[sqName] || 0;
                var defenders = analysis.myAttacks[sqName] || 0;
                if (attackers > 0 && defenders === 0) {
                    sqDiv.classList.add('sq-hanging'); // Rot: Figur hängt komplett ungedeckt!
                } else if (attackers > 0) {
                    sqDiv.classList.add('sq-attacked'); // Orange: Figur wird angegriffen
                }
            }

            // Koordinaten am Rand
            if (c === 0) {
                var rSpan = document.createElement('span');
                rSpan.className = 'coord-rank';
                rSpan.textContent = rank;
                sqDiv.appendChild(rSpan);
            }
            if (r === 7) {
                var fSpan = document.createElement('span');
                fSpan.className = 'coord-file';
                fSpan.textContent = files[fileIndex];
                sqDiv.appendChild(fSpan);
            }

            // Figur einfügen
            if (piece) {
                var svgContainer = document.createElement('div');
                svgContainer.className = 'piece-svg';
                svgContainer.innerHTML = PIECE_SVGS[piece.color + piece.type];
                sqDiv.appendChild(svgContainer.firstChild);
            }

            // Punkte für mögliche Züge
            if (legalTargets[sqName] === 'move') {
                var dot = document.createElement('div');
                dot.className = 'legal-dot';
                sqDiv.appendChild(dot);
            } else if (legalTargets[sqName] === 'capture') {
                var ring = document.createElement('div');
                ring.className = 'legal-capture';
                sqDiv.appendChild(ring);
            }

            sqDiv.onclick = function () {
                onSquareClick(this.getAttribute('data-sq'));
            };

            boardEl.appendChild(sqDiv);
        }
    }

    // Material-Waage aktualisieren
    updateMaterialDisplay(showMat);

    // Patzer-Warnung (Gefahren-Warnung in den 60s) prüfen
    checkBlunderWarning(showBlunder, analysis);

    // Pfeile rendern
    renderArrows();

    // Zug-Bestätigen-Button prüfen
    updateSubmitButtonState();
}

function onSquareClick(sqName) {
    // 1. Pfeil-Zeichenmodus aktiv?
    if (state.arrowMode) {
        if (!state.arrowStartSq) {
            state.arrowStartSq = sqName;
            state.selectedSq = sqName;
        } else {
            if (state.arrowStartSq !== sqName) {
                state.arrows.push({ from: state.arrowStartSq, to: sqName });
            }
            state.arrowStartSq = null;
            state.selectedSq = null;
        }
        renderBoard();
        return;
    }

    // 2. Normales Figuren-Ziehen (Im Sandkasten darf man beliebig Züge ausprobieren!)
    if (!state.selectedSq) {
        var p = state.chess.get(sqName);
        if (p && p.color === state.chess.turn()) {
            state.selectedSq = sqName;
            renderBoard();
        }
        return;
    }

    if (state.selectedSq === sqName) {
        state.selectedSq = null;
        renderBoard();
        return;
    }

    // Prüfen, ob Bauern-Umwandlung ansteht
    var movingPiece = state.chess.get(state.selectedSq);
    var isPromo = movingPiece && movingPiece.type === 'p' &&
    ((movingPiece.color === 'w' && sqName.charAt(1) === '8') ||
    (movingPiece.color === 'b' && sqName.charAt(1) === '1'));

    if (isPromo) {
        var testMoves = state.chess.moves({ square: state.selectedSq, verbose: true });
        var canGoThere = false;
        for (var i = 0; i < testMoves.length; i++) {
            if (testMoves[i].to === sqName) { canGoThere = true; break; }
        }
        if (canGoThere) {
            state.pendingPromoMove = { from: state.selectedSq, to: sqName };
            document.getElementById('modal-promote').classList.remove('hidden');
            return;
        }
    }

    // Zug im Sandkasten ausführen
    var moveObj = state.chess.move({ from: state.selectedSq, to: sqName, promotion: 'q' });
    if (moveObj) {
        state.selectedSq = null;
        renderBoard();
    } else {
        // Falls auf eigene andere Figur geklickt wurde -> Auswahl wechseln
        var clickedP = state.chess.get(sqName);
        if (clickedP && clickedP.color === state.chess.turn()) {
            state.selectedSq = sqName;
        } else {
            state.selectedSq = null;
        }
        renderBoard();
    }
}

/* ============================================================================
 * 7. TAKTISCHE HILFSFUNKTIONEN (RADAR, HEATMAP, PATZER-WARNUNG, MATERIAL)
 * ============================================================================ */
function analyzeBoardControl(chessInstance, myColor) {
    var myAttacks = {};
    var oppAttacks = {};
    var oppColor = (myColor === 'w') ? 'b' : 'w';

    var files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    var fenParts = chessInstance.fen().split(' ');

    // Wir prüfen für beide Farben alle Angriffs-/Deckungsfelder
    var colors = ['w', 'b'];
    for (var ci = 0; ci < colors.length; ci++) {
        var col = colors[ci];
        var targetMap = (col === myColor) ? myAttacks : oppAttacks;

        for (var r = 1; r <= 8; r++) {
            for (var f = 0; f < 8; f++) {
                var sq = files[f] + r;
                var p = chessInstance.get(sq);
                if (!p || p.color !== col) continue;

                var attackedSquares = getAttackedSquaresFrom(chessInstance, sq, p);
                for (var a = 0; a < attackedSquares.length; a++) {
                    var targetSq = attackedSquares[a];
                    targetMap[targetSq] = (targetMap[targetSq] || 0) + 1;
                }
            }
        }
    }

    return { myAttacks: myAttacks, oppAttacks: oppAttacks };
}

function getAttackedSquaresFrom(chessInstance, sq, piece) {
    var files = 'abcdefgh';
    var fIdx = files.indexOf(sq.charAt(0));
    var rIdx = parseInt(sq.charAt(1), 10);
    var res = [];

    function inside(f, r) { return f >= 0 && f < 8 && r >= 1 && r <= 8; }
    function toSq(f, r) { return files.charAt(f) + r; }

    if (piece.type === 'p') {
        var dir = (piece.color === 'w') ? 1 : -1;
        if (inside(fIdx - 1, rIdx + dir)) res.push(toSq(fIdx - 1, rIdx + dir));
        if (inside(fIdx + 1, rIdx + dir)) res.push(toSq(fIdx + 1, rIdx + dir));
        return res;
    }

    if (piece.type === 'n') {
        var jumps = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
        for (var i = 0; i < jumps.length; i++) {
            var nf = fIdx + jumps[i][0], nr = rIdx + jumps[i][1];
            if (inside(nf, nr)) res.push(toSq(nf, nr));
        }
        return res;
    }

    if (piece.type === 'k') {
        for (var df = -1; df <= 1; df++) {
            for (var dr = -1; dr <= 1; dr++) {
                if (df === 0 && dr === 0) continue;
                if (inside(fIdx + df, rIdx + dr)) res.push(toSq(fIdx + df, rIdx + dr));
            }
        }
        return res;
    }

    var dirs = [];
    if (piece.type === 'r' || piece.type === 'q') dirs.push([1,0],[-1,0],[0,1],[0,-1]);
    if (piece.type === 'b' || piece.type === 'q') dirs.push([1,1],[1,-1],[-1,1],[-1,-1]);

    for (var d = 0; d < dirs.length; d++) {
        var cf = fIdx + dirs[d][0];
        var cr = rIdx + dirs[d][1];
        while (inside(cf, cr)) {
            var target = toSq(cf, cr);
            res.push(target);
            if (chessInstance.get(target)) break; // Strahl endet bei erster Figur
            cf += dirs[d][0];
            cr += dirs[d][1];
        }
    }
    return res;
}

function checkBlunderWarning(showBlunder, analysis) {
    var warnEl = document.getElementById('blunder-warning');
    if (!showBlunder) {
        warnEl.classList.add('hidden');
        return;
    }

    var hist = state.chess.history({ verbose: true });
    if (hist.length === 0) {
        warnEl.classList.add('hidden');
        return;
    }

    var lastMove = hist[0]; // Erster Probe-Halbzug des Spielers
    var movedSq = lastMove.to;
    var movedPiece = state.chess.get(movedSq);

    if (movedPiece && movedPiece.color === state.mySide) {
        var oppAtt = analysis.oppAttacks[movedSq] || 0;
        var myDef = analysis.myAttacks[movedSq] || 0;
        if (oppAtt > 0 && myDef === 0) {
            warnEl.textContent = '⚠️ Patzer-Warnung: Deine gezogene Figur auf ' + movedSq.toUpperCase() + ' ist dort ungedeckt und kann geschlagen werden!';
            warnEl.classList.remove('hidden');
            return;
        } else if (oppAtt > 0) {
            warnEl.textContent = '💡 Hinweis: Das Zielfeld ' + movedSq.toUpperCase() + ' wird vom Gegner angegriffen (Prüfe, ob sich der Abtausch lohnt).';
            warnEl.classList.remove('hidden');
            return;
        }
    }
    warnEl.classList.add('hidden');
}

function updateMaterialDisplay(showMat) {
    var topMatEl = document.getElementById('lbl-top-material');
    var botMatEl = document.getElementById('lbl-bottom-material');
    if (!showMat) {
        topMatEl.textContent = '';
        botMatEl.textContent = '';
        return;
    }

    var wScore = 0, bScore = 0;
    var files = 'abcdefgh';
    for (var r = 1; r <= 8; r++) {
        for (var f = 0; f < 8; f++) {
            var p = state.chess.get(files.charAt(f) + r);
            if (p) {
                if (p.color === 'w') wScore += PIECE_VALUES[p.type];
                else bScore += PIECE_VALUES[p.type];
            }
        }
    }

    var diff = wScore - bScore;
    var myAdv = (state.mySide === 'w') ? diff : -diff;
    if (myAdv > 0) {
        botMatEl.textContent = 'Material: +' + myAdv;
        topMatEl.textContent = '';
    } else if (myAdv < 0) {
        topMatEl.textContent = 'Material: +' + Math.abs(myAdv);
        botMatEl.textContent = '';
    } else {
        botMatEl.textContent = 'Material: Ausgeglichen (0)';
        topMatEl.textContent = '';
    }
}

/* ============================================================================
 * 8. PFEILE ZEICHNEN AUF DEM SVG-OVERLAY
 * ============================================================================ */
function renderArrows() {
    var svg = document.getElementById('arrow-overlay');
    var html = '<defs><marker id="arrowhead" markerWidth="4" markerHeight="4" refX="2.5" refY="2" orient="auto">' +
    '<polygon points="0 0, 4 2, 0 4" fill="rgba(230, 126, 34, 0.9)"/></marker></defs>';

    for (var i = 0; i < state.arrows.length; i++) {
        var a = state.arrows[i];
        var c1 = sqToCoords(a.from);
        var c2 = sqToCoords(a.to);
        html += '<line x1="' + c1.x + '" y1="' + c1.y + '" x2="' + c2.x + '" y2="' + c2.y + '" ' +
        'stroke="rgba(230, 126, 34, 0.85)" stroke-width="16" stroke-linecap="round" marker-end="url(#arrowhead)"/>';
    }
    svg.innerHTML = html;
}

function sqToCoords(sq) {
    var files = 'abcdefgh';
    var f = files.indexOf(sq.charAt(0));
    var r = parseInt(sq.charAt(1), 10);

    var col = (state.mySide === 'w') ? f : (7 - f);
    var row = (state.mySide === 'w') ? (8 - r) : (r - 1);

    return { x: col * 100 + 50, y: row * 100 + 50 };
}

function updateArrowButton() {
    var btn = document.getElementById('btn-arrow-mode');
    if (state.arrowMode) {
        btn.textContent = '↗ Pfeil malen: AN';
        btn.classList.add('btn-active-mode');
    } else {
        btn.textContent = '↗ Pfeil malen: AUS';
        btn.classList.remove('btn-active-mode');
    }
}

/* ============================================================================
 * 9. ZUG ENDGÜLTIG ABSENDEN & SCHACH-BOT-ANTWORT
 * ============================================================================ */
function updateSubmitButtonState() {
    var btn = document.getElementById('btn-submit-move');
    if (!state.canMoveToday) {
        btn.disabled = true;
        btn.textContent = 'Zug endgültig absenden';
        return;
    }

    var hist = state.chess.history({ verbose: true });
    if (state.sandboxSecondsLeft > 0) {
        btn.disabled = true;
        btn.textContent = 'Noch ' + state.sandboxSecondsLeft + 's Bedenkzeit...';
    } else if (hist.length === 1) {
        btn.disabled = false;
        btn.textContent = '✓ Zug (' + hist[0].san + ') jetzt verbindlich absenden!';
    } else if (hist.length === 0) {
        btn.disabled = true;
        btn.textContent = 'Ziehe jetzt deinen Zug auf dem Brett';
    } else {
        btn.disabled = true;
        btn.textContent = 'Du hast ' + hist.length + ' Probe-Züge gemacht (Bitte auf 1 Zug zurücksetzen)';
    }
}

function submitFinalMove() {
    var hist = state.chess.history({ verbose: true });
    if (!state.canMoveToday || state.sandboxSecondsLeft > 0 || hist.length !== 1) return;

    var move = hist[0];
    var uci = move.from + move.to + (move.promotion ? move.promotion : '');
    var newFen = state.chess.fen();
    var statusInfo = evaluateGameEnd(state.chess);

    var btn = document.getElementById('btn-submit-move');
    btn.disabled = true;
    btn.textContent = 'Sende Zug...';

    callRpc('rpc_make_move', {
        pw: state.password,
        p_game_id: state.currentGame.id,
        p_player: state.userName,
        p_new_fen: newFen,
        p_move_uci: uci,
        p_new_status: statusInfo.status,
        p_reason: statusInfo.reason
    }, function (err, updatedGame) {
        if (err) {
            alert(err);
            updateSubmitButtonState();
            return;
        }

        state.currentGame = updatedGame;
        state.baseFen = updatedGame.fen;
        state.canMoveToday = false;
        stopSandboxTimer();

        // Prüfen, ob der Gegner ein Bot ist und die Partie noch läuft
        var nextPlayerName = (updatedGame.turn === 'w') ? updatedGame.white_player : updatedGame.black_player;
        var nextPlayerObj = findPlayer(nextPlayerName);

        if (updatedGame.status === 'active' && nextPlayerObj && nextPlayerObj.is_bot) {
            triggerBotTurn(updatedGame, nextPlayerObj);
        } else {
            syncLobby(function () {
                openGame(updatedGame.id);
            });
        }
    });
}

function evaluateGameEnd(chessInst) {
    if (chessInst.in_checkmate()) {
        var winnerStatus = (chessInst.turn() === 'w') ? 'black_won' : 'white_won';
        return { status: winnerStatus, reason: 'Schachmatt!' };
    }
    if (chessInst.in_stalemate()) {
        return { status: 'draw', reason: 'Remis durch Patt' };
    }
    if (chessInst.in_threefold_repetition()) {
        return { status: 'draw', reason: 'Remis (Dreifache Stellungswiederholung)' };
    }
    if (chessInst.insufficient_material()) {
        return { status: 'draw', reason: 'Remis (Ungenügendes Material)' };
    }
    if (chessInst.in_draw()) {
        return { status: 'draw', reason: 'Remis (50-Züge-Regel)' };
    }
    return { status: 'active', reason: '' };
}

/* ============================================================================
 * 10. EINGEBAUTE SCHACH-ENGINES (4 STÄRKEN FÜR ALTE SMARTPHONES)
 * ============================================================================ */
function triggerBotTurn(game, botPlayer) {
    var banner = document.getElementById('turn-banner');
    banner.textContent = '🤖 ' + botPlayer.name + ' denkt nach...';

    setTimeout(function () {
        var botChess = new Chess(game.fen);
        var chosenMove = chooseBotMove(botChess, botPlayer.bot_level || 1);
        if (!chosenMove) return;

        botChess.move(chosenMove);
        var uci = chosenMove.from + chosenMove.to + (chosenMove.promotion ? chosenMove.promotion : '');
        var statusInfo = evaluateGameEnd(botChess);

        callRpc('rpc_make_move', {
            pw: state.password,
            p_game_id: game.id,
            p_player: botPlayer.name,
            p_new_fen: botChess.fen(),
                p_move_uci: uci,
                p_new_status: statusInfo.status,
                p_reason: statusInfo.reason
        }, function (err, updatedAfterBot) {
            syncLobby(function () {
                openGame(game.id);
            });
        });
    }, 750);
}

function chooseBotMove(chessInst, level) {
    var moves = chessInst.moves({ verbose: true });
    if (moves.length === 0) return null;

    // Level 1: Zufalls-Zieher (Elo 350)
    if (level <= 1) {
        return moves[Math.floor(Math.random() * moves.length)];
    }

    // Level 2: Gieriger Bauer (Elo 500) - Nimmt sofort beste schlagbare Figur
    var botColor = chessInst.turn();
    if (level === 2) {
        var bestScore = -9999;
        var bestMoves = [];
        for (var i = 0; i < moves.length; i++) {
            chessInst.move(moves[i]);
            var sc = evaluatePosition(chessInst, botColor);
            chessInst.undo();
            if (sc > bestScore) { bestScore = sc; bestMoves = [moves[i]]; }
            else if (sc === bestScore) { bestMoves.push(moves[i]); }
        }
        return bestMoves[Math.floor(Math.random() * bestMoves.length)];
    }

    // Level 3 (Tiefe 2) & Level 4 (Tiefe 3): Minimax mit Alpha-Beta-Suche
    var depth = (level === 3) ? 2 : 3;
    var bestVal = -99999;
    var topMove = moves[0];

    for (var m = 0; m < moves.length; m++) {
        chessInst.move(moves[m]);
        var val = -negamax(chessInst, depth - 1, -100000, 100000, (botColor === 'w' ? 'b' : 'w'));
        chessInst.undo();
        // Kleine Zufallsstreuung bei gleichen Zügen
        val += (Math.random() * 0.15);
        if (val > bestVal) {
            bestVal = val;
            topMove = moves[m];
        }
    }
    return topMove;
}

function negamax(chessInst, depth, alpha, beta, colorToMove) {
    if (depth === 0 || chessInst.game_over()) {
        return evaluatePosition(chessInst, colorToMove);
    }
    var moves = chessInst.moves({ verbose: true });
    var maxVal = -99999;
    var nextColor = (colorToMove === 'w') ? 'b' : 'w';

    for (var i = 0; i < moves.length; i++) {
        chessInst.move(moves[i]);
        var score = -negamax(chessInst, depth - 1, -beta, -alpha, nextColor);
        chessInst.undo();
        if (score > maxVal) maxVal = score;
        if (score > alpha) alpha = score;
        if (alpha >= beta) break;
    }
    return maxVal;
}

function evaluatePosition(chessInst, perspectiveColor) {
    if (chessInst.in_checkmate()) {
        return (chessInst.turn() === perspectiveColor) ? -9000 : 9000;
    }
    if (chessInst.in_draw()) return 0;

    var total = 0;
    var files = 'abcdefgh';
    for (var r = 1; r <= 8; r++) {
        for (var f = 0; f < 8; f++) {
            var sq = files.charAt(f) + r;
            var p = chessInst.get(sq);
            if (!p) continue;
            var val = PIECE_VALUES[p.type] * 10;
            // Leichter Zentrums-Bonus für gutes Positionsspiel
            if (f >= 2 && f <= 5 && r >= 3 && r <= 6) val += 1;
            if (p.color === perspectiveColor) total += val;
            else total -= val;
        }
    }
    return total;
}

/* ============================================================================
 * 11. EVENT-LISTENER & HILFSFUNKTIONEN
 * ============================================================================ */
function findPlayer(name) {
    for (var i = 0; i < state.players.length; i++) {
        if (state.players[i].name === name) return state.players[i];
    }
    return null;
}

function escapeHtml(str) {
    return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

document.addEventListener('DOMContentLoaded', function () {
    initApp();

    document.getElementById('btn-login').onclick = function () {
        attemptLogin(
            document.getElementById('inp-name').value,
                     document.getElementById('inp-pw').value
        );
    };

    document.getElementById('btn-refresh').onclick = function () {
        syncLobby();
    };

    document.getElementById('btn-logout').onclick = function () {
        localStorage.removeItem('fc_name');
        localStorage.removeItem('fc_pw');
        showView('view-login');
    };

    document.getElementById('btn-back-lobby').onclick = function () {
        stopSandboxTimer();
        syncLobby(function () {
            showView('view-lobby');
        });
    };

    document.getElementById('btn-reset-sandbox').onclick = function () {
        if (!state.currentGame) return;
        state.chess = new Chess(state.baseFen);
        state.selectedSq = null;
        renderBoard();
    };

    document.getElementById('btn-arrow-mode').onclick = function () {
        state.arrowMode = !state.arrowMode;
        state.arrowStartSq = null;
        state.selectedSq = null;
        updateArrowButton();
        renderBoard();
    };

    document.getElementById('btn-clear-arrows').onclick = function () {
        state.arrows = [];
        state.arrowStartSq = null;
        renderArrows();
    };

    document.getElementById('btn-submit-move').onclick = function () {
        submitFinalMove();
    };

    // Checkboxen für Lern-Hilfen live umschalten
    var helperIds = ['chk-legal', 'chk-lastmove', 'chk-material', 'chk-heatmap', 'chk-radar', 'chk-blunder'];
    for (var i = 0; i < helperIds.length; i++) {
        document.getElementById(helperIds[i]).onchange = function () {
            renderBoard();
        };
    }

    // Bauern-Umwandlung Auswahl
    var promoBtns = document.querySelectorAll('.promo-btn');
    for (var j = 0; j < promoBtns.length; j++) {
        promoBtns[j].onclick = function () {
            var pieceType = this.getAttribute('data-piece');
            document.getElementById('modal-promote').classList.add('hidden');
            if (state.pendingPromoMove) {
                state.chess.move({
                    from: state.pendingPromoMove.from,
                    to: state.pendingPromoMove.to,
                    promotion: pieceType
                });
                state.pendingPromoMove = null;
                state.selectedSq = null;
                renderBoard();
            }
        };
    }

    // Partie-Aktionen: Beenden / Aufgeben / Remis
    document.getElementById('btn-resign-abort').onclick = function () {
        if (!state.currentGame || state.currentGame.status !== 'active') return;
        var isAbort = (state.currentGame.move_count <= 1);
        var msg = isAbort
        ? 'Möchtest du die Partie wirklich vorzeitig beenden (ohne Elo-Änderung)?'
        : 'Möchtest du die Partie wirklich aufgeben?';

        if (!confirm(msg)) return;

        callRpc('rpc_game_action', {
            pw: state.password,
            p_game_id: state.currentGame.id,
            p_player: state.userName,
            p_action: isAbort ? 'abort' : 'resign'
        }, function (err) {
            if (err) { alert(err); return; }
            stopSandboxTimer();
            syncLobby(function () { showView('view-lobby'); });
        });
    };

    document.getElementById('btn-offer-draw').onclick = function () {
        if (!state.currentGame || state.currentGame.status !== 'active') return;
        callRpc('rpc_game_action', {
            pw: state.password,
            p_game_id: state.currentGame.id,
            p_player: state.userName,
            p_action: 'offer_draw'
        }, function (err) {
            if (err) { alert(err); return; }
            alert('Remis-Angebot wurde gespeichert!');
            syncLobby(function () { openGame(state.currentGame.id); });
        });
    };

    document.getElementById('btn-accept-draw').onclick = function () {
        if (!state.currentGame) return;
        callRpc('rpc_game_action', {
            pw: state.password,
            p_game_id: state.currentGame.id,
            p_player: state.userName,
            p_action: 'accept_draw'
        }, function (err) {
            if (err) { alert(err); return; }
            stopSandboxTimer();
            syncLobby(function () { openGame(state.currentGame.id); });
        });
    };

    // Regel-Modal
    document.getElementById('btn-rules-modal').onclick = function () {
        document.getElementById('modal-rules').classList.remove('hidden');
    };
    document.getElementById('btn-close-rules').onclick = function () {
        document.getElementById('modal-rules').classList.add('hidden');
    };
});

/* ============================================================================
 * 12. AUTOMATISCHES HOMESCREEN-APP-ICON (FÜR iOS & ANDROID GENERIEREN)
 * ============================================================================ */
(function generateAppIcon() {
    try {
        var canvas = document.createElement('canvas');
        canvas.width = 192;
        canvas.height = 192;
        var ctx = canvas.getContext('2d');

        // Dunkler edler Hintergrund
        ctx.fillStyle = '#1e242b';
        ctx.fillRect(0, 0, 192, 192);

        // 2x2 Schachbrett-Muster in der Mitte
        ctx.fillStyle = '#f0d9b5';
        ctx.fillRect(20, 20, 76, 76);
        ctx.fillRect(96, 96, 76, 76);
        ctx.fillStyle = '#b58863';
        ctx.fillRect(96, 20, 76, 76);
        ctx.fillRect(20, 96, 76, 76);

        // Goldener Rahmen um das Brett
        ctx.strokeStyle = '#f39c12';
        ctx.lineWidth = 6;
        ctx.strokeRect(20, 20, 152, 152);

        // Schachfigur (Springer-Symbol) in die Mitte setzen
        ctx.fillStyle = '#1e242b';
        ctx.font = 'bold 115px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('♞', 96, 102);

        var dataUrl = canvas.toDataURL('image/png');

        // Icon für iOS ("Zum Home-Bildschirm") setzen
        var appleIcon = document.createElement('link');
        appleIcon.rel = 'apple-touch-icon';
        appleIcon.href = dataUrl;
        document.head.appendChild(appleIcon);

        // Normales Favicon für den Browser-Tab setzen
        var favIcon = document.createElement('link');
        favIcon.rel = 'icon';
        favIcon.type = 'image/png';
        favIcon.href = dataUrl;
        document.head.appendChild(favIcon);
    } catch (e) {}
})();
