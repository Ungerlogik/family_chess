/* ============================================================================
 * FAMILIEN-SCHACH APP (ES5-kompatibel für iOS 10+ & Android)
 * ============================================================================ */

// 1. SUPABASE KONFIGURATION
var SUPABASE_URL = 'https://tkxwgshnsxvvrwghmois.supabase.co';
var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRreHdnc2huc3h2dnJ3Z2htb2lzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxNzg5MDcsImV4cCI6MjEwNzc1NDkwN30.DyNlKFtStR0sOPsYjJHxZPRL11YoqReMv2QMMKTNJ04';
var VAPID_PUBLIC_KEY = 'BA-9ii-6pQbhCMLo-MEvNUMc5ejBU5R5-fkOk4LX3n2ea8cK_VTIjpahOmu-ajl0bz3xkLmIb-G1UxPxykqK6b0';

var ELO_K_FACTOR = 20;
var BOT_DISPLAY_NAME = 'Botgnus';

// App-Status
var state = {
    userName: '',
    password: '',
    serverToday: '',
    settings: {
        sandbox_wait_seconds: 60,
        max_moves_per_day: 1,
        unlimited_moves_global: false
    },
    players: [],
    games: [],
    currentGame: null,
    chess: null,          // Aktuelle Brettstellung (inkl. Sandkasten-Probezüge)
    baseFen: '',          // Echte gespeicherte Stellung der Partie
    mySide: 'w',          // 'w' oder 'b'
    canMoveToday: false,  // Bin ich am Zug UND darf heute in diesem Spiel noch ziehen?
    selectedSq: null,
    pendingPromoMove: null,
    sandboxStartTs: 0,
    sandboxSecondsLeft: 60,
    sandboxTimerId: null,
    arrowMode: false,
    arrowStartSq: null,
    arrows: [],           // [{from: 'e2', to: 'e4'}]
    botDepth: 2,          // 1 bis 5 Halbzüge im Voraus
    activeTab: 'tab-home',
    historyFilter: 'all', // 'all', 'win', 'draw', 'loss'
    gamePlies: [],        // Gespeicherte Halbzüge der Partie für Zughistorie/Replay
    replayIndex: 0        // Aktuell angezeigter Halbzug-Index im Replay
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
var pKeys = ['p', 'r', 'n', 'b', 'q', 'k'];
for (var i = 0; i < pKeys.length; i++) {
    var k = pKeys[i];
    PIECE_SVGS['b' + k] = PIECE_SVGS['w' + k]
    .replace('fill="#ffffff"', 'fill="#262b30"')
    .replace('stroke="#111"', 'stroke="#f5f6fa"');
}

var PIECE_VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
var CAPTURE_SYMBOLS = { q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' };

var OPENING_BOOK = {
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR': ['e2e4', 'd2d4', 'g1f3', 'c2c4'],
    'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR': ['e7e5', 'c7c5', 'e7e6', 'c7c6'],
    'rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR': ['d7d5', 'g8f6', 'e7e6'],
    'rnbqkbnr/pppppppp/8/8/8/5N2/PPPPPPPP/RNBQKB1R': ['d7d5', 'g8f6', 'c7c5'],
    'rnbqkbnr/pppppppp/8/8/2P5/8/PP1PPPPP/RNBQKBNR': ['e7e5', 'g8f6', 'c7c5'],
    'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR': ['g1f3', 'b1c3', 'f1c4'],
    'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR': ['g1f3', 'b1c3', 'c2c3'],
    'rnbqkbnr/pppp1ppp/4p3/8/4P3/8/PPPP1PPP/RNBQKBNR': ['d2d4', 'b1c3', 'g1f3'],
    'rnbqkbnr/pp1ppppp/2p5/8/4P3/8/PPPP1PPP/RNBQKBNR': ['d2d4', 'b1c3', 'g1f3'],
    'rnbqkbnr/ppp1pppp/8/3p4/3P4/8/PPP1PPPP/RNBQKBNR': ['c2c4', 'g1f3', 'c1f4'],
    'rnbqkb1r/pppppppp/5n2/8/3P4/8/PPP1PPPP/RNBQKBNR': ['c2c4', 'g1f3', 'c1f4'],
    'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R': ['b8c6', 'g8f6'],
    'rnbqkbnr/pp1ppppp/8/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R': ['d7d6', 'b8c6', 'e7e6'],
    'rnbqkbnr/ppp1pppp/8/3p4/2PP4/8/PP2PPPP/RNBQKBNR': ['e7e6', 'c7c6', 'd5c4'],
    'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R': ['f1c4', 'f1b5', 'd2d4', 'b1c3'],
    'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R': ['f8c5', 'g8f6'],
    'r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R': ['a7a6', 'g8f6']
};

var PST = {
    p: [
        [ 0,  0,  0,  0,  0,  0,  0,  0],
        [ 5,  5,  5,  5,  5,  5,  5,  5],
        [ 1,  1,  2,  3,  3,  2,  1,  1],
        [ 0,  0,  1,  2.5,2.5,1,  0,  0],
        [ 0,  0,  0,  2,  2,  0,  0,  0],
        [ 0.5,-0.5,-1, 0,  0, -1, -0.5,0.5],
        [ 0.5, 1,  1, -2, -2,  1,  1,  0.5],
        [ 0,  0,  0,  0,  0,  0,  0,  0]
    ],
    n: [
        [-5, -4, -3, -3, -3, -3, -4, -5],
        [-4, -2,  0,  0,  0,  0, -2, -4],
        [-3,  0,  1,  1.5,1.5, 1,  0, -3],
        [-3,  0.5,1.5, 2,  2,  1.5,0.5,-3],
        [-3,  0,  1.5, 2,  2,  1.5, 0, -3],
        [-3,  0.5, 1,  1.5,1.5, 1, 0.5,-3],
        [-4, -2,  0,  0.5,0.5, 0, -2, -4],
        [-5, -4, -3, -3, -3, -3, -4, -5]
    ],
    b: [
        [-2, -1, -1, -1, -1, -1, -1, -2],
        [-1,  0,  0,  0,  0,  0,  0, -1],
        [-1,  0,  0.5, 1,  1,  0.5, 0, -1],
        [-1,  0.5,0.5, 1,  1,  0.5,0.5,-1],
        [-1,  0,  1,   1,  1,  1,   0, -1],
        [-1,  1,  1,   1,  1,  1,   1, -1],
        [-1,  0.5, 0,  0,  0,  0,  0.5,-1],
        [-2, -1, -1, -1, -1, -1, -1, -2]
    ],
    r: [
        [ 0,  0,  0,  0,  0,  0,  0,  0],
        [ 0.5, 1,  1,  1,  1,  1,  1, 0.5],
        [-0.5, 0,  0,  0,  0,  0,  0, -0.5],
        [-0.5, 0,  0,  0,  0,  0,  0, -0.5],
        [-0.5, 0,  0,  0,  0,  0,  0, -0.5],
        [-0.5, 0,  0,  0,  0,  0,  0, -0.5],
        [-0.5, 0,  0,  0,  0,  0,  0, -0.5],
        [ 0,  0,  0,  0.5,0.5, 0,  0,  0]
    ],
    q: [
        [-2, -1, -1, -0.5,-0.5,-1, -1, -2],
        [-1,  0,  0,  0,   0,   0,  0, -1],
        [-1,  0,  0.5,0.5, 0.5, 0.5,0, -1],
        [-0.5,0,  0.5,0.5, 0.5, 0.5,0, -0.5],
        [ 0,  0,  0.5,0.5, 0.5, 0.5,0, -0.5],
        [-1,  0.5,0.5,0.5, 0.5, 0.5,0, -1],
        [-1,  0,  0.5, 0,   0,  0,  0, -1],
        [-2, -1, -1, -0.5,-0.5,-1, -1, -2]
    ],
    k: [
        [-3, -4, -4, -5, -5, -4, -4, -3],
        [-3, -4, -4, -5, -5, -4, -4, -3],
        [-3, -4, -4, -5, -5, -4, -4, -3],
        [-3, -4, -4, -5, -5, -4, -4, -3],
        [-2, -3, -3, -4, -4, -3, -3, -2],
        [-1, -2, -2, -2, -2, -2, -2, -1],
        [ 2,  2,  0,  0,  0,  0,  2,  2],
        [ 2,  3,  1,  0,  0,  1,  3,  2]
    ]
};

/* ============================================================================
 * 2. KOMPATIBLE SUPABASE REST-API FUNKTION & ZUGLIMIT-HELFER
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

function getWaitSeconds() {
    var s = state.settings && state.settings.sandbox_wait_seconds;
    var val = parseInt(s, 10);
    return isNaN(val) ? 60 : Math.max(0, val);
}

function getMaxMovesPerDay() {
    var m = state.settings && state.settings.max_moves_per_day;
    var val = parseInt(m, 10);
    return (isNaN(val) || val < 1) ? 1 : val;
}

function isUnlimitedForGame(g) {
    if (!g) return false;
    return !!(state.settings.unlimited_moves_global || g.unlimited_moves);
}

// Ermittelt, wie viele Züge ich HEUTE in DIESEM Spiel g bereits gemacht habe
function getMyMovesTodayInGame(g) {
    if (!g) return 0;
    var mySide = (g.white_player === state.userName) ? 'w' : 'b';
    var myLastDate = (mySide === 'w') ? g.white_last_move_date : g.black_last_move_date;
    if (myLastDate !== state.serverToday) return 0;

    var count = (mySide === 'w') ? g.white_moves_today : g.black_moves_today;
    if (typeof count === 'number') return count;
    return 1; // Fallback für ältere Datensätze ohne Counter
}

function canPlayerMoveInGameToday(g) {
    if (!g || g.status !== 'active') return false;
    var mySide = (g.white_player === state.userName) ? 'w' : 'b';
    if (g.turn !== mySide) return false;
    if (isUnlimitedForGame(g)) return true;

    return getMyMovesTodayInGame(g) < getMaxMovesPerDay();
}

/* ============================================================================
 * 3. LOGIN, LOCALSTORAGE & LOBBY-SYNCHRONISATION
 * ============================================================================ */
function initApp() {
    var savedName = localStorage.getItem('fc_name') || '';
    var savedPw = localStorage.getItem('fc_pw') || '';
    var savedDepth = parseInt(localStorage.getItem('fc_bot_depth') || '2', 10);
    if (isNaN(savedDepth) || savedDepth < 1 || savedDepth > 5) savedDepth = 2;

    state.botDepth = savedDepth;
    var slider = document.getElementById('inp-bot-depth');
    if (slider) {
        slider.value = String(savedDepth);
        updateBotSliderLabel();
    }

    document.getElementById('inp-name').value = savedName;
    document.getElementById('inp-pw').value = savedPw;

    if (savedName && savedPw) {
        attemptLogin(savedName, savedPw);
    }
}

function updateBotSliderLabel() {
    var d = state.botDepth;
    var labels = {
        1: '1 Zug im Voraus (Einsteiger)',
        2: '2 Züge im Voraus (Leicht + Buch)',
        3: '3 Züge im Voraus (Mittel + Buch)',
        4: '4 Züge im Voraus (Stark + Buch)',
        5: '5 Züge im Voraus (Meister + Buch)'
    };
    var el = document.getElementById('lbl-bot-depth-info');
    if (el) el.textContent = labels[d] || (d + ' Züge im Voraus');
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
    if (data.settings) {
        state.settings = {
            sandbox_wait_seconds: (data.settings.sandbox_wait_seconds !== undefined) ? data.settings.sandbox_wait_seconds : 60,
            max_moves_per_day: (data.settings.max_moves_per_day !== undefined) ? data.settings.max_moves_per_day : 1,
            unlimited_moves_global: !!data.settings.unlimited_moves_global
        };
    }

    // Untertitel aktualisieren
    var subEl = document.getElementById('lbl-login-subtitle');
    if (subEl) {
        var maxM = getMaxMovesPerDay();
        var waitS = getWaitSeconds();
        subEl.textContent = 'Maximal ' + maxM + (maxM === 1 ? ' Zug' : ' Züge') + ' pro Tag & Spiel · ' + waitS + 's Bedenkzeit';
    }

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

function switchLobbyTab(tabId) {
    state.activeTab = tabId;
    var panes = ['tab-home', 'tab-highscore', 'tab-history'];
    for (var i = 0; i < panes.length; i++) {
        var paneEl = document.getElementById(panes[i]);
        if (panes[i] === tabId) paneEl.classList.remove('hidden');
        else paneEl.classList.add('hidden');
    }

    var btns = document.querySelectorAll('.tab-btn');
    for (var j = 0; j < btns.length; j++) {
        if (btns[j].getAttribute('data-tab') === tabId) {
            btns[j].classList.add('active');
        } else {
            btns[j].classList.remove('active');
        }
    }
}

/* ============================================================================
 * 4. BOTGNUS HELFER & STARTSEITE / HIGHSCORE / HISTORIE RENDERN
 * ============================================================================ */
function isBotPlayer(name) {
    if (!name) return false;
    if (name === BOT_DISPLAY_NAME || name.toLowerCase().indexOf('bot') !== -1) return true;
    var p = findPlayer(name);
    return !!(p && p.is_bot);
}

function resolveBotDbName() {
    var exact = findPlayer(BOT_DISPLAY_NAME);
    if (exact) return exact.name;
    for (var i = 0; i < state.players.length; i++) {
        if (state.players[i].is_bot) return state.players[i].name;
    }
    return BOT_DISPLAY_NAME;
}

function formatDisplayName(name) {
    if (isBotPlayer(name)) return BOT_DISPLAY_NAME;
    return name || '';
}

function hasActiveBotGame() {
    for (var i = 0; i < state.games.length; i++) {
        var g = state.games[i];
        if (g.status !== 'active') continue;
        var isParticipant = (g.white_player === state.userName || g.black_player === state.userName);
        if (!isParticipant) continue;
        var opp = (g.white_player === state.userName) ? g.black_player : g.white_player;
        if (isBotPlayer(opp)) return true;
    }
    return false;
}

function renderLobby() {
    document.getElementById('lbl-user-name').textContent = state.userName;
    var me = findPlayer(state.userName);

    var humanPlayers = [];
    for (var pIdx = 0; pIdx < state.players.length; pIdx++) {
        if (!state.players[pIdx].is_bot && state.players[pIdx].name !== BOT_DISPLAY_NAME) {
            humanPlayers.push(state.players[pIdx]);
        }
    }
    humanPlayers.sort(function (a, b) { return (b.elo || 0) - (a.elo || 0); });

    var myRank = '-';
    for (var rIdx = 0; rIdx < humanPlayers.length; rIdx++) {
        if (humanPlayers[rIdx].name === state.userName) {
            myRank = (rIdx + 1) + ' von ' + humanPlayers.length;
            break;
        }
    }

    if (me) {
        document.getElementById('lbl-user-elo').textContent = me.elo + ' Elo';
        document.getElementById('hero-elo-value').textContent = me.elo;
        document.getElementById('hero-rank-badge').textContent = 'Platz ' + myRank;
        document.getElementById('hero-stats-line').textContent =
        (me.wins || 0) + ' Siege · ' + (me.draws || 0) + ' Remis · ' + (me.losses || 0) + ' Niederlagen';
    }

    var activeContainer = document.getElementById('list-active-games');
    activeContainer.innerHTML = '';

    var myActiveGames = [];
    var myFinishedGames = [];

    for (var i = 0; i < state.games.length; i++) {
        var g = state.games[i];
        var isParticipant = (g.white_player === state.userName || g.black_player === state.userName);
        if (!isParticipant) continue;

        if (g.status === 'active') {
            myActiveGames.push(g);
        } else {
            myFinishedGames.push(g);
        }
    }

    myActiveGames.sort(function (a, b) {
        return getGamePriority(a) - getGamePriority(b);
    });

    document.getElementById('badge-active-count').textContent = myActiveGames.length + ' aktiv';

    if (myActiveGames.length === 0) {
        activeContainer.innerHTML = '<p class="hint">Keine offenen Partien. Starte unten ein Spiel gegen Botgnus oder die Familie!</p>';
    } else {
        for (var a = 0; a < myActiveGames.length; a++) {
            activeContainer.appendChild(createActiveGameRow(myActiveGames[a]));
        }
    }

    var botRunning = hasActiveBotGame();
    var btnStartBot = document.getElementById('btn-start-bot');
    var botHint = document.getElementById('bot-active-hint');
    var botPill = document.getElementById('bot-status-pill');

    if (botRunning) {
        btnStartBot.disabled = true;
        btnStartBot.textContent = '🔒 Bereits 1 Spiel gegen Botgnus aktiv';
        botHint.classList.remove('hidden');
        botPill.textContent = '1/1 Aktiv';
        botPill.classList.add('locked');
    } else {
        btnStartBot.disabled = false;
        btnStartBot.textContent = '🤖 Spiel gegen Botgnus starten';
        botHint.classList.add('hidden');
        botPill.textContent = 'Bereit';
        botPill.classList.remove('locked');
    }

    var oppGrid = document.getElementById('list-opponents');
    oppGrid.innerHTML = '';
    var humanCount = 0;
    for (var j = 0; j < humanPlayers.length; j++) {
        var hp = humanPlayers[j];
        if (hp.name === state.userName) continue;
        humanCount++;

        var btn = document.createElement('button');
        btn.className = 'btn opp-btn';
        btn.textContent = '👤 ' + hp.name + ' (' + hp.elo + ')';
        btn.setAttribute('data-opp', hp.name);
        btn.onclick = function () {
            startNewGame(this.getAttribute('data-opp'));
        };
        oppGrid.appendChild(btn);
    }
    if (humanCount === 0) {
        oppGrid.innerHTML = '<p class="hint">Noch keine weiteren Familienmitglieder angemeldet.</p>';
    }

    var tbody = document.getElementById('tbody-leaderboard');
    tbody.innerHTML = '';
    for (var k = 0; k < humanPlayers.length; k++) {
        var pl = humanPlayers[k];
        var total = (pl.wins || 0) + (pl.draws || 0) + (pl.losses || 0);
        var winRate = total > 0 ? Math.round(((pl.wins || 0) / total) * 100) + '%' : '–';

        var tr = document.createElement('tr');
        if (pl.name === state.userName) tr.className = 'me-row';
        tr.innerHTML =
        '<td>' + (k + 1) + '.</td>' +
        '<td><strong>' + escapeHtml(pl.name) + '</strong></td>' +
        '<td><strong>' + pl.elo + '</strong></td>' +
        '<td>' + (pl.wins || 0) + '</td>' +
        '<td>' + (pl.draws || 0) + '</td>' +
        '<td>' + (pl.losses || 0) + '</td>' +
        '<td>' + winRate + '</td>';
        tbody.appendChild(tr);
    }

    renderHistoryList(myFinishedGames);
}

function getGamePriority(g) {
    var mySide = (g.white_player === state.userName) ? 'w' : 'b';
    var isMyTurn = (g.turn === mySide);
    var canMove = canPlayerMoveInGameToday(g);

    if (isMyTurn && canMove) return 1;
    if (!isMyTurn) return 2;
    return 3;
}

function createActiveGameRow(g) {
    var div = document.createElement('div');
    var mySide = (g.white_player === state.userName) ? 'w' : 'b';
    var rawOppName = (mySide === 'w') ? g.black_player : g.white_player;
    var oppDisplay = formatDisplayName(rawOppName);
    var isBotOpp = isBotPlayer(rawOppName);

    var isMyTurn = (g.turn === mySide);
    var canMove = canPlayerMoveInGameToday(g);
    var usedToday = getMyMovesTodayInGame(g);
    var maxMoves = getMaxMovesPerDay();
    var unlim = isUnlimitedForGame(g);

    var statusLabel = '';
    var extraClass = '';

    if (isMyTurn && canMove) {
        if (unlim) {
            statusLabel = '🟢 Du bist am Zug! (🔓 Freispiel aktiv)';
        } else if (maxMoves > 1) {
            statusLabel = '🟢 Du bist am Zug! (Heute ' + usedToday + '/' + maxMoves + ' Züge in diesem Spiel)';
        } else {
            statusLabel = '🟢 Du bist am Zug!';
        }
        extraClass = ' my-turn';
    } else if (isMyTurn && !canMove) {
        statusLabel = '⏳ Heute in diesem Spiel schon gezogen (' + usedToday + '/' + maxMoves + ' · ab 00:00 Uhr wieder)';
        extraClass = ' waiting-tomorrow';
    } else {
        statusLabel = '⚪ Warte auf ' + oppDisplay + (unlim ? ' (🔓 Freispiel)' : '');
    }

    var myColorBadge = (mySide === 'w') ? '♔ Weiß' : '♚ Schwarz';
    var oppIcon = isBotOpp ? '🤖 ' : '👤 ';

    div.className = 'game-item' + extraClass;
    div.innerHTML =
    '<div>' +
    '<strong>' + oppIcon + escapeHtml(oppDisplay) + '</strong> <small>(' + myColorBadge + ' · Zug ' + (g.move_count || 1) + ')</small><br>' +
    '<small>' + escapeHtml(statusLabel) + '</small>' +
    '</div>' +
    '<span>Spielen →</span>';

    div.onclick = function () {
        openGame(g.id);
    };
    return div;
}

function getPersonalOutcome(g) {
    var mySide = (g.white_player === state.userName) ? 'w' : 'b';
    if (g.status === 'aborted') return 'abort';
    if (g.status === 'draw') return 'draw';
    if (g.status === 'white_won') return (mySide === 'w') ? 'win' : 'loss';
    if (g.status === 'black_won') return (mySide === 'b') ? 'win' : 'loss';
    return 'draw';
}

function renderHistoryList(myFinishedGames) {
    var finishedContainer = document.getElementById('list-finished-games');
    finishedContainer.innerHTML = '';

    document.getElementById('badge-history-count').textContent = myFinishedGames.length + ' Partien';

    var filtered = [];
    for (var i = 0; i < myFinishedGames.length; i++) {
        var g = myFinishedGames[i];
        var outcome = getPersonalOutcome(g);
        if (state.historyFilter === 'all' || state.historyFilter === outcome) {
            filtered.push(g);
        }
    }

    if (filtered.length === 0) {
        finishedContainer.innerHTML = '<p class="hint">Keine abgeschlossenen Partien für diesen Filter gefunden.</p>';
        return;
    }

    for (var j = 0; j < filtered.length; j++) {
        finishedContainer.appendChild(createHistoryGameRow(filtered[j]));
    }
}

function createHistoryGameRow(g) {
    var div = document.createElement('div');
    var mySide = (g.white_player === state.userName) ? 'w' : 'b';
    var rawOpp = (mySide === 'w') ? g.black_player : g.white_player;
    var oppDisplay = formatDisplayName(rawOpp);
    var outcome = getPersonalOutcome(g);

    var badgeText = 'Remis';
    var badgeClass = 'res-draw';
    var itemClass = 'hist-draw';

    if (outcome === 'win') {
        badgeText = '🏆 Sieg';
        badgeClass = 'res-win';
        itemClass = 'hist-win';
    } else if (outcome === 'loss') {
        badgeText = '❌ Niederlage';
        badgeClass = 'res-loss';
        itemClass = 'hist-loss';
    } else if (outcome === 'abort') {
        badgeText = '✕ Abbruch';
        badgeClass = 'res-abort';
        itemClass = 'hist-abort';
    } else {
        badgeText = '🤝 Remis';
    }

    var myColorLabel = (mySide === 'w') ? 'Weiß' : 'Schwarz';
    var reason = g.result_reason || g.status;

    div.className = 'game-item ' + itemClass;
    div.innerHTML =
    '<div>' +
    '<span class="res-badge ' + badgeClass + '">' + badgeText + '</span>' +
    '<strong>vs. ' + escapeHtml(oppDisplay) + '</strong> <small>(' + myColorLabel + ')</small><br>' +
    '<small>' + escapeHtml(reason) + ' · ' + (g.move_count || 0) + ' Halbzüge</small>' +
    '</div>' +
    '<span>Analyse →</span>';

    div.onclick = function () {
        openGame(g.id);
    };
    return div;
}

function startNewGame(opponentName) {
    if (isBotPlayer(opponentName) && hasActiveBotGame()) {
        alert('Du hast bereits ein aktives Spiel gegen Botgnus. Es kann maximal ein Bot-Spiel gleichzeitig laufen.');
        return;
    }

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
 * 5. SPIELBRETT ÖFFNEN, ZUGHISTORIE AUFBAUEN & DYNAMISCHER SANDKASTEN-TIMER
 * ============================================================================ */
function buildGameMoveHistory(game) {
    var plies = [];
    // Unterstützt sowohl move_history als auch moves_history aus der DB
    var rawHistory = (game.move_history || game.moves_history || '').trim();

    if (rawHistory) {
        var replayChess = new Chess();
        plies.push({ fen: replayChess.fen(), san: 'Start', uci: '' });
        var tokens = rawHistory.split(/\s+/);
        for (var i = 0; i < tokens.length; i++) {
            var uci = tokens[i];
            if (uci.length >= 4) {
                var mv = replayChess.move({
                    from: uci.substring(0, 2),
                                          to: uci.substring(2, 4),
                                          promotion: uci.length > 4 ? uci.charAt(4) : 'q'
                });
                if (mv) {
                    plies.push({ fen: replayChess.fen(), san: mv.san, uci: uci });
                }
            }
        }
    }

    if (plies.length === 0) {
        plies.push({ fen: game.fen, san: 'Aktuell', uci: game.last_move_uci || '' });
    }

    state.gamePlies = plies;
    state.replayIndex = plies.length - 1;
    renderMoveHistoryStrip();
}

function renderMoveHistoryStrip() {
    var strip = document.getElementById('move-list-strip');
    var stepLbl = document.getElementById('lbl-replay-step');
    var plies = state.gamePlies;

    if (!plies || plies.length <= 1) {
        strip.textContent = 'Noch keine Züge im Verlauf gespeichert.';
        stepLbl.textContent = 'Aktuell';
        updateReplayButtons();
        return;
    }

    var html = '';
    for (var i = 1; i < plies.length; i++) {
        if (i % 2 === 1) {
            var moveNo = Math.floor((i + 1) / 2);
            html += '<span class="move-num">' + moveNo + '.</span>';
        }
        var activeCls = (i === state.replayIndex) ? ' active-ply' : '';
        html += '<span class="move-chip' + activeCls + '" data-ply="' + i + '">' + escapeHtml(plies[i].san) + '</span>';
    }

    strip.innerHTML = html;
    if (state.replayIndex === plies.length - 1) {
        stepLbl.textContent = 'Aktuell (Zug ' + (plies.length - 1) + ')';
    } else {
        stepLbl.textContent = 'Rückblick: ' + state.replayIndex + ' / ' + (plies.length - 1);
    }

    var chips = strip.querySelectorAll('.move-chip');
    for (var c = 0; c < chips.length; c++) {
        chips[c].onclick = function () {
            jumpToReplayPly(parseInt(this.getAttribute('data-ply'), 10));
        };
    }

    updateReplayButtons();
}

function updateReplayButtons() {
    var total = state.gamePlies.length;
    var idx = state.replayIndex;
    document.getElementById('btn-rep-start').disabled = (total <= 1 || idx <= 0);
    document.getElementById('btn-rep-prev').disabled = (total <= 1 || idx <= 0);
    document.getElementById('btn-rep-next').disabled = (total <= 1 || idx >= total - 1);
    document.getElementById('btn-rep-end').disabled = (total <= 1 || idx >= total - 1);
}

function jumpToReplayPly(targetIdx) {
    if (!state.gamePlies || targetIdx < 0 || targetIdx >= state.gamePlies.length) return;
    state.replayIndex = targetIdx;
    var targetPly = state.gamePlies[targetIdx];

    if (targetIdx === state.gamePlies.length - 1) {
        state.chess = new Chess(state.baseFen);
    } else {
        state.chess = new Chess(targetPly.fen);
    }
    state.selectedSq = null;
    renderMoveHistoryStrip();
    renderBoard();
}

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
    buildGameMoveHistory(g);

    showView('view-game');

    var currentTurnPlayer = (g.turn === 'w') ? g.white_player : g.black_player;
    if (g.status === 'active' && isBotPlayer(currentTurnPlayer)) {
        state.canMoveToday = false;
        stopSandboxTimer();
        setupGameUI();
        renderBoard();
        triggerBotTurn(g, currentTurnPlayer);
        return;
    }

    state.canMoveToday = canPlayerMoveInGameToday(g);

    if (state.canMoveToday) {
        startSandboxTimer(g);
    } else {
        stopSandboxTimer();
    }

    setupGameUI();
    renderBoard();
}

function getTimerStorageKey(game) {
    return 'fc_sbx_' + game.id + '_' + (game.move_count || 0);
}

function startSandboxTimer(game) {
    stopSandboxTimer();
    var waitTotal = getWaitSeconds();

    if (waitTotal <= 0) {
        state.sandboxSecondsLeft = 0;
        document.getElementById('timer-box').classList.add('hidden');
        setSandboxHelpersEnabled(false);
        updateSubmitButtonState();
        return;
    }

    var storageKey = getTimerStorageKey(game);
    var savedStart = parseInt(localStorage.getItem(storageKey) || '0', 10);
    var now = Date.now();

    if (savedStart > 0 && now >= savedStart) {
        state.sandboxStartTs = savedStart;
    } else {
        state.sandboxStartTs = now;
        try { localStorage.setItem(storageKey, String(now)); } catch (e) {}
    }

    var initialElapsed = Math.floor((now - state.sandboxStartTs) / 1000);
    state.sandboxSecondsLeft = Math.max(0, waitTotal - initialElapsed);

    document.getElementById('timer-box').classList.remove('hidden');
    setSandboxHelpersEnabled(state.sandboxSecondsLeft > 0);
    updateTimerUI();

    if (state.sandboxSecondsLeft <= 0) {
        updateSubmitButtonState();
        return;
    }

    state.sandboxTimerId = setInterval(function () {
        var wSec = getWaitSeconds();
        var elapsed = Math.floor((Date.now() - state.sandboxStartTs) / 1000);
        var left = wSec - elapsed;
        if (left <= 0) {
            state.sandboxSecondsLeft = 0;
            clearInterval(state.sandboxTimerId);
            state.sandboxTimerId = null;
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
    var waitTotal = Math.max(1, getWaitSeconds());
    var pct = Math.min(100, Math.round(((waitTotal - state.sandboxSecondsLeft) / waitTotal) * 100));
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
    var wName = formatDisplayName(g.white_player);
    var bName = formatDisplayName(g.black_player);

    document.getElementById('game-title-bar').textContent = wName + ' vs. ' + bName;

    var topName = (state.mySide === 'w') ? bName + ' (Schwarz)' : wName + ' (Weiß)';
    var botName = (state.mySide === 'w') ? wName + ' (Weiß)' : bName + ' (Schwarz)';
    document.getElementById('lbl-top-player').textContent = topName;
    document.getElementById('lbl-bottom-player').textContent = botName;

    var banner = document.getElementById('turn-banner');
    banner.className = 'turn-banner';

    var actionsCard = document.getElementById('game-actions-card');
    var submitBtn = document.getElementById('btn-submit-move');

    var usedToday = getMyMovesTodayInGame(g);
    var maxMoves = getMaxMovesPerDay();
    var unlim = isUnlimitedForGame(g);

    if (g.status !== 'active') {
        banner.textContent = 'Nachbetrachtung: ' + (g.result_reason || g.status) + ' (Züge unten vor-/zurückblättern)';
        banner.classList.add('blue');
        actionsCard.classList.add('hidden');
        submitBtn.classList.add('hidden');
    } else {
        actionsCard.classList.remove('hidden');
        submitBtn.classList.remove('hidden');

        if (state.canMoveToday) {
            if (unlim) {
                banner.textContent = 'Du bist am Zug! (🔓 Freispiel-Modus ohne Tageslimit)';
            } else if (maxMoves > 1) {
                banner.textContent = 'Du bist am Zug! (Zug ' + (usedToday + 1) + ' von ' + maxMoves + ' heute in dieser Partie)';
            } else {
                banner.textContent = 'Du bist am Zug! Nutze das Brett zum Ausprobieren.';
            }
            banner.classList.add('green');
        } else if (g.turn === state.mySide) {
            banner.textContent = 'Tageslimit in dieser Partie erreicht (' + usedToday + '/' + maxMoves + '). Nächster Zug ab 00:00 Uhr!';
            banner.classList.add('orange');
        } else {
            banner.textContent = 'Gegner ist am Zug. (Du kannst trotzdem Probe-Züge auf dem Brett testen)';
        }
    }

    var btnResignAbort = document.getElementById('btn-resign-abort');
    if (g.move_count <= 1) {
        btnResignAbort.textContent = '✕ Spiel abbrechen (ohne Wertung)';
    } else {
        btnResignAbort.textContent = '🏳️ Aufgeben';
    }

    var drawBanner = document.getElementById('draw-offer-banner');
    if (g.status === 'active' && g.draw_offered_by && g.draw_offered_by !== state.mySide) {
        drawBanner.classList.remove('hidden');
    } else {
        drawBanner.classList.add('hidden');
    }

    updateSubmitButtonState();
}

/* ============================================================================
 * 6. SCHACHBRETT RENDERN & KOMBI-HEATMAP / SCHACH-WARNUNG
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

    var legendEl = document.getElementById('heatmap-legend');
    if (showHeat) legendEl.classList.remove('hidden');
    else legendEl.classList.add('hidden');

    var legalTargets = {};
    if (state.selectedSq && showLegal) {
        var moves = state.chess.moves({ square: state.selectedSq, verbose: true });
        for (var m = 0; m < moves.length; m++) {
            legalTargets[moves[m].to] = moves[m].captured ? 'capture' : 'move';
        }
    }

    var analysis = analyzeBoardControl(state.chess, state.mySide);
    var isKingInCheck = state.chess.in_check();
    var turnColor = state.chess.turn();

    var activeUci = (state.currentGame && state.currentGame.last_move_uci) ? state.currentGame.last_move_uci : '';
    if (state.gamePlies && state.gamePlies[state.replayIndex] && state.gamePlies[state.replayIndex].uci) {
        activeUci = state.gamePlies[state.replayIndex].uci;
    }

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

            if (state.selectedSq === sqName) {
                sqDiv.classList.add('sq-selected');
            } else if (showLast && activeUci) {
                if (sqName === activeUci.substring(0, 2) || sqName === activeUci.substring(2, 4)) {
                    sqDiv.classList.add('sq-last-move');
                }
            }

            var piece = state.chess.get(sqName);

            if (isKingInCheck && piece && piece.type === 'k' && piece.color === turnColor) {
                sqDiv.classList.add('sq-in-check');
            }

            if (showHeat) {
                var myCtrl = analysis.myAttacks[sqName] || 0;
                var oppCtrl = analysis.oppAttacks[sqName] || 0;
                var netCtrl = myCtrl - oppCtrl;

                if (netCtrl !== 0) {
                    var tri = document.createElement('div');
                    var valSpan = document.createElement('span');
                    valSpan.className = 'heat-val';

                    if (netCtrl > 0) {
                        tri.className = 'heat-corner ' + (netCtrl >= 2 ? 'mine-2' : 'mine-1');
                        valSpan.textContent = '+' + netCtrl;
                        if (netCtrl >= 2) sqDiv.classList.add('sq-dom-strong-mine');
                    } else {
                        tri.className = 'heat-corner ' + (netCtrl <= -2 ? 'opp-2' : 'opp-1');
                        valSpan.textContent = String(netCtrl);
                        if (netCtrl <= -2) sqDiv.classList.add('sq-dom-strong-opp');
                    }
                    sqDiv.appendChild(tri);
                    sqDiv.appendChild(valSpan);
                }
            }

            if (showRadar && piece && piece.color === state.mySide && piece.type !== 'k') {
                var attackers = analysis.oppAttacks[sqName] || 0;
                var defenders = analysis.myAttacks[sqName] || 0;
                if (attackers > 0 && defenders === 0) {
                    sqDiv.classList.add('sq-hanging');
                } else if (attackers > 0) {
                    sqDiv.classList.add('sq-attacked');
                }
            }

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

            if (piece) {
                var svgContainer = document.createElement('div');
                svgContainer.className = 'piece-svg';
                svgContainer.innerHTML = PIECE_SVGS[piece.color + piece.type];
                sqDiv.appendChild(svgContainer.firstChild);
            }

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

    updateMaterialDisplay(showMat);
    checkBlunderWarning(showBlunder, analysis);
    renderArrows();
    updateSandboxButtons();
    updateSubmitButtonState();
}

function updateSandboxButtons() {
    if (!state.chess) return;
    var hasMoves = state.chess.history().length > 0;
    var inPastReplay = (state.gamePlies && state.replayIndex < state.gamePlies.length - 1);
    document.getElementById('btn-undo-sandbox').disabled = !hasMoves;
    document.getElementById('btn-reset-sandbox').disabled = (!hasMoves && !inPastReplay);
}

function onSquareClick(sqName) {
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

    var moveObj = state.chess.move({ from: state.selectedSq, to: sqName, promotion: 'q' });
    if (moveObj) {
        state.selectedSq = null;
        renderBoard();
    } else {
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
    var files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

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
            if (chessInstance.get(target)) break;
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

    var lastMove = hist[0];
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
    var counts = {
        w: { q: 0, r: 0, b: 0, n: 0, p: 0 },
        b: { q: 0, r: 0, b: 0, n: 0, p: 0 }
    };

    var files = 'abcdefgh';
    for (var r = 1; r <= 8; r++) {
        for (var f = 0; f < 8; f++) {
            var p = state.chess.get(files.charAt(f) + r);
            if (p) {
                if (p.color === 'w') wScore += PIECE_VALUES[p.type];
                else bScore += PIECE_VALUES[p.type];
                if (counts[p.color][p.type] !== undefined) {
                    counts[p.color][p.type]++;
                }
            }
        }
    }

    var startSet = { q: 1, r: 2, b: 2, n: 2, p: 8 };
    var order = ['q', 'r', 'b', 'n', 'p'];

    var capturedByW = '';
    var capturedByB = '';
    for (var idx = 0; idx < order.length; idx++) {
        var t = order[idx];
        var missingB = Math.max(0, startSet[t] - counts.b[t]);
        var missingW = Math.max(0, startSet[t] - counts.w[t]);
        for (var m1 = 0; m1 < missingB; m1++) capturedByW += CAPTURE_SYMBOLS[t];
        for (var m2 = 0; m2 < missingW; m2++) capturedByB += CAPTURE_SYMBOLS[t];
    }

    var diff = wScore - bScore;
    var myAdv = (state.mySide === 'w') ? diff : -diff;
    var myCaptured = (state.mySide === 'w') ? capturedByW : capturedByB;
    var oppCaptured = (state.mySide === 'w') ? capturedByB : capturedByW;

    var botText = myCaptured;
    var topText = oppCaptured;

    if (myAdv > 0) {
        botText += (botText ? ' ' : '') + '(+' + myAdv + ')';
    } else if (myAdv < 0) {
        topText += (topText ? ' ' : '') + '(+' + Math.abs(myAdv) + ')';
    } else if (!botText && !topText) {
        botText = 'Ausgeglichen (0)';
    }

    botMatEl.textContent = botText;
    topMatEl.textContent = topText;
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
        btn.textContent = '↗ Pfeil: AN';
        btn.classList.add('btn-active-mode');
    } else {
        btn.textContent = '↗ Pfeil: AUS';
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

    var inPastReplay = (state.gamePlies && state.replayIndex < state.gamePlies.length - 1);
    if (inPastReplay) {
        btn.disabled = true;
        btn.textContent = 'Rückblick aktiv (Klicke auf „Aktuell ⏭“ zum Ziehen)';
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
        btn.textContent = hist.length + ' Probe-Züge (Mit „← 1 Zug zurück“ auf 1 reduzieren)';
    }
}

function formatGermanMoveText(playerName, move, statusInfo) {
    var pieceNames = {
        p: 'Bauer',
        n: 'Springer',
        b: 'Läufer',
        r: 'Turm',
        q: 'Dame',
        k: 'König'
    };

    if (move.san === 'O-O' || move.san === 'O-O-O') {
        return playerName + ' hat rochiert';
    }

    var piece = pieceNames[move.piece] || 'Figur';
    var text = playerName + ' hat ' + piece + ' auf ' + move.to + ' gezogen';

    if (move.captured) {
        var capPiece = pieceNames[move.captured] || 'Figur';
        text = playerName + ' hat mit ' + piece + ' auf ' + move.to + ' (' + capPiece + ') geschlagen';
    }

    if (move.promotion) {
        var promoPiece = pieceNames[move.promotion] || 'Dame';
        text += ' (Umwandlung in ' + promoPiece + ')';
    }

    if (statusInfo && statusInfo.status !== 'active' && statusInfo.reason) {
        text += ' – ' + statusInfo.reason;
    } else if (move.san.indexOf('+') !== -1) {
        text += ' (Schach!)';
    }

    return text;
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

        var nextPlayerName = (updatedGame.turn === 'w') ? updatedGame.white_player : updatedGame.black_player;

        if (updatedGame.status === 'active' && isBotPlayer(nextPlayerName)) {
            triggerBotTurn(updatedGame, nextPlayerName);
        } else {
            var moveText = formatGermanMoveText(state.userName, move, statusInfo);
            sendPushToOpponent(nextPlayerName, moveText, updatedGame.id);

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
 * 10. BOTGNUS ENGINE (ERÖFFNUNGSBUCH + TIEFE 1–5 + MOVE ORDERING + PST)
 * ============================================================================ */
function triggerBotTurn(game, botDbPlayerName) {
    var banner = document.getElementById('turn-banner');
    var depth = state.botDepth || 2;
    banner.textContent = '🤖 ' + BOT_DISPLAY_NAME + ' berechnet ' + depth + ' ' + (depth === 1 ? 'Zug' : 'Züge') + ' im Voraus...';

    setTimeout(function () {
        var botChess = new Chess(game.fen);
        var chosenMove = chooseBotMove(botChess, depth);
        if (!chosenMove) return;

        botChess.move(chosenMove);
        var uci = chosenMove.from + chosenMove.to + (chosenMove.promotion ? chosenMove.promotion : '');
        var statusInfo = evaluateGameEnd(botChess);

        callRpc('rpc_make_move', {
            pw: state.password,
            p_game_id: game.id,
            p_player: botDbPlayerName,
            p_new_fen: botChess.fen(),
                p_move_uci: uci,
                p_new_status: statusInfo.status,
                p_reason: statusInfo.reason
        }, function () {
            syncLobby(function () {
                openGame(game.id);
            });
        });
    }, 450);
}

function orderMoves(moves) {
    for (var i = 0; i < moves.length; i++) {
        var m = moves[i];
        var prio = 0;
        if (m.captured) {
            prio += 100 + (PIECE_VALUES[m.captured] * 12) - PIECE_VALUES[m.piece];
        }
        if (m.promotion) {
            prio += 90 + (PIECE_VALUES[m.promotion] * 10);
        }
        var toFile = m.to.charAt(0);
        var toRank = m.to.charAt(1);
        if ((toFile === 'd' || toFile === 'e') && (toRank === '4' || toRank === '5')) {
            prio += 4;
        }
        m._prio = prio;
    }
    moves.sort(function (a, b) { return b._prio - a._prio; });
    return moves;
}

function chooseBotMove(chessInst, depth) {
    var moves = orderMoves(chessInst.moves({ verbose: true }));
    if (moves.length === 0) return null;

    var searchDepth = Math.max(1, Math.min(5, parseInt(depth, 10) || 2));

    if (searchDepth >= 2) {
        var boardPlacement = chessInst.fen().split(' ')[0];
        var bookCandidates = OPENING_BOOK[boardPlacement];
        if (bookCandidates && bookCandidates.length > 0) {
            var chosenUci = bookCandidates[Math.floor(Math.random() * bookCandidates.length)];
            for (var b = 0; b < moves.length; b++) {
                if (moves[b].from + moves[b].to === chosenUci) {
                    return moves[b];
                }
            }
        }
    }

    var botColor = chessInst.turn();
    var nextColor = (botColor === 'w') ? 'b' : 'w';

    var bestVal = -999999;
    var topMove = moves[0];

    for (var m = 0; m < moves.length; m++) {
        var move = moves[m];
        chessInst.move(move);
        var val = -negamax(chessInst, searchDepth - 1, -1000000, 1000000, nextColor, move.to);
        chessInst.undo();

        val += (Math.random() * 0.12);

        if (val > bestVal) {
            bestVal = val;
            topMove = move;
        }
    }
    return topMove;
}

function negamax(chessInst, depth, alpha, beta, colorToMove, lastMovedSq) {
    if (depth === 0 || chessInst.game_over()) {
        return evaluatePosition(chessInst, colorToMove, lastMovedSq);
    }

    var moves = orderMoves(chessInst.moves({ verbose: true }));
    var maxVal = -999999;
    var nextColor = (colorToMove === 'w') ? 'b' : 'w';

    for (var i = 0; i < moves.length; i++) {
        var mv = moves[i];
        chessInst.move(mv);
        var score = -negamax(chessInst, depth - 1, -beta, -alpha, nextColor, mv.to);
        chessInst.undo();

        if (score > maxVal) maxVal = score;
        if (score > alpha) alpha = score;
        if (alpha >= beta) break;
    }
    return maxVal;
}

function evaluatePosition(chessInst, perspectiveColor, lastMovedSq) {
    if (chessInst.in_checkmate()) {
        return (chessInst.turn() === perspectiveColor) ? -90000 : 90000;
    }
    if (chessInst.in_draw() || chessInst.in_stalemate() || chessInst.in_threefold_repetition()) {
        return 0;
    }

    var total = 0;
    var files = 'abcdefgh';

    for (var r = 1; r <= 8; r++) {
        for (var f = 0; f < 8; f++) {
            var sq = files.charAt(f) + r;
            var p = chessInst.get(sq);
            if (!p) continue;

            var baseVal = PIECE_VALUES[p.type] * 10;
            var pstRow = (p.color === 'w') ? (8 - r) : (r - 1);
            var pstBonus = (PST[p.type] && PST[p.type][pstRow]) ? PST[p.type][pstRow][f] : 0;
            var val = baseVal + pstBonus;

            if (p.color === perspectiveColor) total += val;
            else total -= val;
        }
    }

    if (lastMovedSq) {
        var targetPiece = chessInst.get(lastMovedSq);
        if (targetPiece && targetPiece.type !== 'k') {
            var sideToMoveMoves = chessInst.moves({ verbose: true });
            var canBeCaptured = false;
            var lowestAttackerVal = 99;
            for (var k = 0; k < sideToMoveMoves.length; k++) {
                if (sideToMoveMoves[k].to === lastMovedSq) {
                    canBeCaptured = true;
                    var attVal = PIECE_VALUES[sideToMoveMoves[k].piece];
                    if (attVal < lowestAttackerVal) lowestAttackerVal = attVal;
                }
            }
            if (canBeCaptured) {
                var victimVal = PIECE_VALUES[targetPiece.type];
                var penalty = Math.max(2, (victimVal - lowestAttackerVal * 0.5) * 7);
                if (targetPiece.color === perspectiveColor) {
                    total -= penalty;
                } else {
                    total += penalty;
                }
            }
        }
    }

    return total;
}

/* ============================================================================
 * 11. ADMIN-EINSTELLUNGSMENÜ LOGIK
 * ============================================================================ */
function openAdminModal() {
    var savedAdminPw = sessionStorage.getItem('fc_admin_pw') || '';
    document.getElementById('inp-admin-pw').value = savedAdminPw;
    document.getElementById('inp-admin-wait').value = String(getWaitSeconds());
    document.getElementById('inp-admin-max-moves').value = String(getMaxMovesPerDay());
    document.getElementById('chk-admin-unlim-global').checked = !!state.settings.unlimited_moves_global;

    var gameBox = document.getElementById('admin-current-game-box');
    var isGameView = !document.getElementById('view-game').classList.contains('hidden');

    if (isGameView && state.currentGame && state.currentGame.status === 'active') {
        gameBox.classList.remove('hidden');
        var wName = formatDisplayName(state.currentGame.white_player);
        var bName = formatDisplayName(state.currentGame.black_player);
        document.getElementById('lbl-admin-game-title').textContent = 'Aktuelle Partie: ' + wName + ' vs. ' + bName;
        document.getElementById('chk-admin-unlim-game').checked = !!state.currentGame.unlimited_moves;
    } else {
        gameBox.classList.add('hidden');
    }

    var msgEl = document.getElementById('admin-status-msg');
    msgEl.classList.add('hidden');
    msgEl.textContent = '';

    document.getElementById('modal-admin').classList.remove('hidden');
}

function showAdminFeedback(text, isError) {
    var msgEl = document.getElementById('admin-status-msg');
    msgEl.textContent = text;
    msgEl.className = 'admin-msg ' + (isError ? 'err' : 'ok');
    msgEl.classList.remove('hidden');
}

function saveAdminSettings() {
    var adminPw = document.getElementById('inp-admin-pw').value;
    if (!adminPw) {
        showAdminFeedback('Bitte gib das Admin-Passwort ein.', true);
        return;
    }

    var waitSec = parseInt(document.getElementById('inp-admin-wait').value, 10);
    if (isNaN(waitSec) || waitSec < 0) waitSec = 0;

    var maxMoves = parseInt(document.getElementById('inp-admin-max-moves').value, 10);
    if (isNaN(maxMoves) || maxMoves < 1) maxMoves = 1;

    var unlimGlobal = document.getElementById('chk-admin-unlim-global').checked;

    var isGameView = !document.getElementById('view-game').classList.contains('hidden');
    var currentGameId = (isGameView && state.currentGame) ? state.currentGame.id : null;
    var unlimGame = document.getElementById('chk-admin-unlim-game').checked;

    callRpc('rpc_admin_action', {
        pw: state.password,
        p_admin_pw: adminPw,
        p_action: 'save_settings',
        p_wait_seconds: waitSec,
        p_max_moves: maxMoves,
        p_unlim_global: unlimGlobal,
        p_game_id: currentGameId,
        p_game_unlim: unlimGame
    }, function (err) {
        if (err) {
            showAdminFeedback(err, true);
            return;
        }
        try { sessionStorage.setItem('fc_admin_pw', adminPw); } catch (e) {}
        showAdminFeedback('✓ Einstellungen erfolgreich gespeichert!', false);

        syncLobby(function () {
            if (currentGameId) {
                openGame(currentGameId);
            }
        });
    });
}

function resetAdminCounters(onlyCurrentGame) {
    var adminPw = document.getElementById('inp-admin-pw').value;
    if (!adminPw) {
        showAdminFeedback('Bitte gib zuerst das Admin-Passwort ein.', true);
        return;
    }

    var targetGameId = (onlyCurrentGame && state.currentGame) ? state.currentGame.id : null;

    callRpc('rpc_admin_action', {
        pw: state.password,
        p_admin_pw: adminPw,
        p_action: 'reset_counters',
        p_game_id: targetGameId
    }, function (err) {
        if (err) {
            showAdminFeedback(err, true);
            return;
        }
        try { sessionStorage.setItem('fc_admin_pw', adminPw); } catch (e) {}
        showAdminFeedback(
            onlyCurrentGame
            ? '✓ Tages-Counter für diese Partie zurückgesetzt! Es kann sofort wieder gezogen werden.'
            : '✓ Tages-Counter für ALLE aktiven Spiele zurückgesetzt!',
            false
        );

        syncLobby(function () {
            var isGameView = !document.getElementById('view-game').classList.contains('hidden');
            if (isGameView && state.currentGame) {
                openGame(state.currentGame.id);
            }
        });
    });
}

/* ============================================================================
 * 12. EVENT-LISTENER & HILFSFUNKTIONEN
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

    document.getElementById('btn-push-toggle').onclick = enablePushNotifications;

    // Admin-Buttons
    document.getElementById('btn-admin-lobby').onclick = openAdminModal;
    document.getElementById('btn-admin-game').onclick = openAdminModal;
    document.getElementById('btn-close-admin').onclick = function () {
        document.getElementById('modal-admin').classList.add('hidden');
    };
    document.getElementById('btn-admin-save').onclick = saveAdminSettings;
    document.getElementById('btn-admin-reset-game').onclick = function () {
        resetAdminCounters(true);
    };
    document.getElementById('btn-admin-reset-all').onclick = function () {
        resetAdminCounters(false);
    };

    document.getElementById('btn-logout').onclick = function () {
        localStorage.removeItem('fc_name');
        localStorage.removeItem('fc_pw');
        showView('view-login');
    };

    var tabBtns = document.querySelectorAll('.tab-btn');
    for (var t = 0; t < tabBtns.length; t++) {
        tabBtns[t].onclick = function () {
            switchLobbyTab(this.getAttribute('data-tab'));
        };
    }

    document.getElementById('btn-goto-highscore').onclick = function () {
        switchLobbyTab('tab-highscore');
    };

    var botSlider = document.getElementById('inp-bot-depth');
    botSlider.oninput = function () {
        state.botDepth = parseInt(this.value, 10) || 2;
        localStorage.setItem('fc_bot_depth', String(state.botDepth));
        updateBotSliderLabel();
    };
    botSlider.onchange = botSlider.oninput;

    document.getElementById('btn-start-bot').onclick = function () {
        if (hasActiveBotGame()) {
            alert('Es läuft bereits ein Spiel gegen Botgnus.');
            return;
        }
        var dbBotName = resolveBotDbName();
        startNewGame(dbBotName);
    };

    var histFilterBtns = document.querySelectorAll('.hist-filter-btn');
    for (var hf = 0; hf < histFilterBtns.length; hf++) {
        histFilterBtns[hf].onclick = function () {
            for (var k = 0; k < histFilterBtns.length; k++) {
                histFilterBtns[k].classList.remove('active');
            }
            this.classList.add('active');
            state.historyFilter = this.getAttribute('data-filter');
            renderLobby();
        };
    }

    document.getElementById('btn-back-lobby').onclick = function () {
        stopSandboxTimer();
        syncLobby(function () {
            showView('view-lobby');
        });
    };

    document.getElementById('btn-undo-sandbox').onclick = function () {
        if (!state.chess) return;
        state.chess.undo();
        state.selectedSq = null;
        renderBoard();
    };

    document.getElementById('btn-reset-sandbox').onclick = function () {
        if (!state.currentGame) return;
        state.replayIndex = state.gamePlies.length - 1;
        state.chess = new Chess(state.baseFen);
        state.selectedSq = null;
        renderMoveHistoryStrip();
        renderBoard();
    };

    document.getElementById('btn-rep-start').onclick = function () {
        jumpToReplayPly(0);
    };
    document.getElementById('btn-rep-prev').onclick = function () {
        jumpToReplayPly(state.replayIndex - 1);
    };
    document.getElementById('btn-rep-next').onclick = function () {
        jumpToReplayPly(state.replayIndex + 1);
    };
    document.getElementById('btn-rep-end').onclick = function () {
        jumpToReplayPly(state.gamePlies.length - 1);
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

    var helperIds = ['chk-legal', 'chk-lastmove', 'chk-material', 'chk-heatmap', 'chk-radar', 'chk-blunder'];
    for (var i = 0; i < helperIds.length; i++) {
        document.getElementById(helperIds[i]).onchange = function () {
            renderBoard();
        };
    }

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

    document.getElementById('btn-resign-abort').onclick = function () {
        if (!state.currentGame || state.currentGame.status !== 'active') return;
        var isAbort = (state.currentGame.move_count <= 1);
        var msg = isAbort
        ? 'Möchtest du die Partie wirklich vorzeitig abbrechen (ohne Elo-Änderung)?'
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

    document.getElementById('btn-rules-modal').onclick = function () {
        document.getElementById('modal-rules').classList.remove('hidden');
    };
    document.getElementById('btn-close-rules').onclick = function () {
        document.getElementById('modal-rules').classList.add('hidden');
    };
});

/* ============================================================================
 * 13. AUTOMATISCHES HOMESCREEN-APP-ICON (FÜR iOS & ANDROID GENERIEREN)
 * ============================================================================ */
(function generateAppIcon() {
    try {
        var canvas = document.createElement('canvas');
        canvas.width = 192;
        canvas.height = 192;
        var ctx = canvas.getContext('2d');

        ctx.fillStyle = '#1e242b';
        ctx.fillRect(0, 0, 192, 192);

        ctx.fillStyle = '#f0d9b5';
        ctx.fillRect(20, 20, 76, 76);
        ctx.fillRect(96, 96, 76, 76);
        ctx.fillStyle = '#b58863';
        ctx.fillRect(96, 20, 76, 76);
        ctx.fillRect(20, 96, 76, 76);

        ctx.strokeStyle = '#f39c12';
        ctx.lineWidth = 6;
        ctx.strokeRect(20, 20, 152, 152);

        ctx.fillStyle = '#1e242b';
        ctx.font = 'bold 115px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('♞', 96, 102);

        var dataUrl = canvas.toDataURL('image/png');

        var appleIcon = document.createElement('link');
        appleIcon.rel = 'apple-touch-icon';
        appleIcon.href = dataUrl;
        document.head.appendChild(appleIcon);

        var favIcon = document.createElement('link');
        favIcon.rel = 'icon';
        favIcon.type = 'image/png';
        favIcon.href = dataUrl;
        document.head.appendChild(favIcon);
    } catch (e) {}
})();

/* ============================================================================
 * 14. WEB-PUSH REGISTRIERUNG & VERSAND (ES5-KOMPATIBEL)
 * ============================================================================ */
function urlBase64ToUint8Array(base64String) {
    var padding = '='.repeat((4 - base64String.length % 4) % 4);
    var base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    var rawData = window.atob(base64);
    var outputArray = new Uint8Array(rawData.length);
    for (var i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

function enablePushNotifications() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        alert('Dein Browser unterstützt leider keine Web-Push-Benachrichtigungen. (Tipp auf iPhone: Erst über „Teilen -> Zum Home-Bildschirm“ hinzufügen!)');
        return;
    }

    var btn = document.getElementById('btn-push-toggle');
    btn.textContent = '⏳...';

    navigator.serviceWorker.register('./sw.js').then(function (registration) {
        return Notification.requestPermission().then(function (permission) {
            if (permission !== 'granted') {
                throw new Error('Benachrichtigungen wurden nicht erlaubt.');
            }
            return registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });
        });
    }).then(function (subscription) {
        var subJson = subscription.toJSON();
        callRpc('rpc_save_push_sub', {
            pw: state.password,
            p_player: state.userName,
            p_endpoint: subJson.endpoint,
            p_p256dh: subJson.keys.p256dh,
            p_auth: subJson.keys.auth
        }, function (err) {
            if (err) {
                alert('Fehler beim Speichern: ' + err);
                btn.textContent = '🔔';
                return;
            }
            btn.textContent = '🔔';
            btn.classList.add('btn-active-mode');
            localStorage.setItem('fc_push_enabled', '1');
            alert('Push-Benachrichtigungen für ' + state.userName + ' sind jetzt auf diesem Gerät aktiv!');
        });
    }).catch(function (err) {
        btn.textContent = '🔔';
        alert(err.message || 'Push konnte nicht aktiviert werden.');
    });
}

function sendPushToOpponent(targetPlayerName, messageBody, gameId) {
    if (!targetPlayerName || isBotPlayer(targetPlayerName)) return;

    var xhr = new XMLHttpRequest();
    xhr.open('POST', SUPABASE_URL + '/functions/v1/send-push', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', 'Bearer ' + SUPABASE_KEY);
    xhr.send(JSON.stringify({
        targetPlayer: targetPlayerName,
        title: '♟️ Familien-Schach',
        body: messageBody,
        gameId: gameId
    }));
}
