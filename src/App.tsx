import { useCallback, useEffect, useRef, useState } from 'react';
import { BackgroundCanvas, fxPool } from './components/BackgroundCanvas';
import { GameBoardView } from './components/GameBoardView';
import { HomeScreen } from './components/HomeScreen';
import { SharedSvgDefs } from './components/Icons';
import { LevelMap } from './components/LevelMap';
import { Modals } from './components/Modals';
import { Pages } from './components/Pages';
import { SplashScreen } from './components/SplashScreen';
import { TutorialModal } from './components/TutorialModal';
import {
  ACHIEVEMENTS,
  DAILY_REWARDS,
  DEFAULT_COLORS,
  GRID_SIZE,
  LIFE_REGEN_MS,
  MAX_LIVES,
  THEMES,
} from './data/constants';
import {
  AchievementDef,
  GameMode,
  LeaderboardKey,
  LevelDef,
  LevelProgress,
  LivesState,
  PageId,
  Piece,
  SaveState,
  SettingsState,
  ThemeId,
} from './types/game';
import { audioEngine, vibratePattern } from './utils/audio';
import { shouldTickGameplayClock } from './utils/gameHelpers';
import {
  canPlacePiece,
  createRandomPiece,
  isGoalMet,
  makeLevel,
} from './utils/levelLogic';
import {
  clearAllSavedData,
  formatMs,
  getDailyRewardState,
  getTodayKey,
  hasSeenTutorial,
  loadClassicBest,
  loadLives,
  loadProgress,
  loadSaveState,
  markTutorialSeen,
  saveClassicBest,
  saveGameState,
  saveLives,
  saveProgress,
} from './utils/storage';

export function App() {
  const [cb, setCb] = useState<SaveState>(() => loadSaveState());
  const [prog, setProg] = useState<LevelProgress>(() => loadProgress());
  const [livesState, setLivesState] = useState<LivesState>(() => loadLives());
  const [classicBest, setClassicBest] = useState<number>(() =>
    loadClassicBest()
  );

  // Navigation & overlays
  const [screen, setScreen] = useState<'home' | 'map' | 'game'>('home');
  const [activePage, setActivePage] = useState<PageId | null>(null);
  const [lbTab, setLbTab] = useState<LeaderboardKey>('classic');
  const [showTimerSelect, setShowTimerSelect] = useState(false);
  const [showDaily, setShowDaily] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [paused, setPaused] = useState(false);
  const [previewLevelNum, setPreviewLevelNum] = useState<number | null>(null);
  const [confirmState, setConfirmState] = useState({
    open: false,
    title: 'Confirm',
    message: '',
    okLabel: 'Confirm',
    onConfirm: () => {},
  });

  // Gameplay state
  const [mode, setMode] = useState<GameMode>('classic');
  const [timerDur, setTimerDur] = useState<number>(90);
  const [timeLeft, setTimeLeft] = useState<number>(90);
  const [timerPlaying, setTimerPlaying] = useState<boolean>(false);
  const [lv, setLv] = useState<LevelDef | null>(null);
  const [moves, setMoves] = useState<number>(0);
  const [board, setBoard] = useState<number[]>(() => Array(64).fill(-1));
  const [boardItems, setBoardItems] = useState<number[]>(() =>
    Array(64).fill(0)
  );
  const [pieces, setPieces] = useState<(Piece | null)[]>([null, null, null]);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [busy, setBusy] = useState<boolean>(true);
  const [revived, setRevived] = useState<boolean>(false);
  const [inGame, setInGame] = useState<boolean>(false);
  const [lbRank, setLbRank] = useState<number>(0);

  // Board FX state
  const [toastInfo, setToastInfo] = useState({ text: '', key: 0 });
  const [popCells, setPopCells] = useState<Set<number>>(new Set());
  const [crashCells, setCrashCells] = useState<Map<number, number>>(new Map());
  const [deadCells, setDeadCells] = useState<Set<number>>(new Set());
  const [boardShakeKey, setBoardShakeKey] = useState<number>(0);
  const [rings, setRings] = useState<
    { id: number; x: number; y: number; k: number }[]
  >([]);
  const [flyingItems, setFlyingItems] = useState<
    {
      id: number;
      itemIdx: number;
      x: number;
      y: number;
      dx: number;
      dy: number;
    }[]
  >([]);

  // Floating global toasts (gems & achievements)
  const [gemToasts, setGemToasts] = useState<{ id: number; text: string }[]>(
    []
  );
  const [achToasts, setAchToasts] = useState<
    { id: number; ach: AchievementDef; delayIdx: number }[]
  >([]);

  // End-of-game modals
  const [winState, setWinState] = useState({
    open: false,
    stars: 0,
    score: 0,
    movesLeft: 0,
    lbRank: 0,
  });
  const [failState, setFailState] = useState({
    open: false,
    score: 0,
    revived: false,
  });
  const [showHeartBreak, setShowHeartBreak] = useState(false);
  const [heartBreakRunId, setHeartBreakRunId] = useState(0);
  const [overState, setOverState] = useState<{
    open: boolean;
    mode: 'start' | 'over';
    title: string;
    scoreLabel: string;
    score: number;
    best: number;
    lbRank: number;
  }>({
    open: false,
    mode: 'start',
    title: 'Ready?',
    scoreLabel: 'Your final score',
    score: 0,
    best: 0,
    lbRank: 0,
  });

  // Clock tick for lives regeneration display
  const [nowTick, setNowTick] = useState(() => Date.now());

  // Refs for stable access in timeouts/intervals
  const boardRef = useRef<HTMLDivElement | null>(null);
  const goalRef = useRef<HTMLDivElement | null>(null);
  const cbRef = useRef(cb);
  cbRef.current = cb;
  const progRef = useRef(prog);
  progRef.current = prog;
  const livesRef = useRef(livesState);
  livesRef.current = livesState;
  const classicBestRef = useRef(classicBest);
  classicBestRef.current = classicBest;
  const gameRef = useRef({
    board,
    boardItems,
    pieces,
    score,
    streak,
    mode,
    lv,
    moves,
    timeLeft,
    timerDur,
    timerPlaying,
    revived,
    inGame,
    busy,
    paused,
  });
  gameRef.current = {
    board,
    boardItems,
    pieces,
    score,
    streak,
    mode,
    lv,
    moves,
    timeLeft,
    timerDur,
    timerPlaying,
    revived,
    inGame,
    busy,
    paused,
  };
  const timersRef = useRef<number[]>([]);

  const scheduleTimeout = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timersRef.current.push(id);
    return id;
  }, []);

  const clearScheduledTimeouts = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  }, []);

  // Show interactive tutorial once for brand-new players after splash completes
  const handleSplashComplete = useCallback(() => {
    if (
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('skipTut') === '1'
    ) {
      return;
    }
    if (!hasSeenTutorial()) {
      setShowTutorial(true);
    }
  }, []);

  const closeTutorial = useCallback(() => {
    markTutorialSeen();
    setShowTutorial(false);
    if (!paused) {
      audioEngine.resume();
    }
  }, [paused]);

  // Apply theme & audio settings whenever cb changes
  useEffect(() => {
    document.documentElement.dataset.theme = cb.theme;
    document.documentElement.classList.toggle('rm', !!cb.set.rm);
    fxPool.reducedMotion = !!cb.set.rm;

    const themeDef = THEMES.find((t) => t.id === cb.theme);
    fxPool.palette = themeDef ? [...themeDef.colors] : [...DEFAULT_COLORS];

    audioEngine.applySettings(cb.set);
  }, [cb.theme, cb.set]);

  // Body class for level mode HUD layout
  useEffect(() => {
    document.body.classList.toggle(
      'lvm',
      screen === 'game' && mode === 'level' && !!lv
    );
  }, [screen, mode, lv]);

  // Persist cb changes
  useEffect(() => {
    saveGameState(cb);
  }, [cb]);

  // Periodic save & time-played counter
  useEffect(() => {
    const tId = window.setInterval(() => {
      const shouldTick = shouldTickGameplayClock({
        screen,
        mode,
        inGame,
        paused,
        tutorialOpen: showTutorial,
        overOpen: overState.open,
        failOpen: failState.open,
        winOpen: winState.open,
        documentHidden: document.hidden,
      });
      if (shouldTick) {
        setCb((prev) => ({
          ...prev,
          st: { ...prev.st, time: prev.st.time + 1 },
        }));
      }
    }, 1000);
    const sId = window.setInterval(() => {
      saveGameState(cbRef.current);
    }, 15000);
    const onVis = () => {
      if (document.hidden) {
        saveGameState(cbRef.current);
        audioEngine.pause();
      } else if (!gameRef.current.paused) {
        audioEngine.resume();
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.clearInterval(tId);
      window.clearInterval(sId);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [
    screen,
    mode,
    inGame,
    paused,
    showTutorial,
    failState.open,
    winState.open,
    overState.open,
  ]);

  // Lives regeneration ticker
  const tickLives = useCallback(() => {
    const cur = livesRef.current;
    const now = Date.now();
    if (cur.n < MAX_LIVES) {
      setNowTick(now);
      const start = cur.t || now;
      const gained = Math.floor((now - start) / LIFE_REGEN_MS);
      if (gained > 0) {
        const nextN = Math.min(MAX_LIVES, cur.n + gained);
        const nextT = nextN >= MAX_LIVES ? 0 : start + gained * LIFE_REGEN_MS;
        const updated = { n: nextN, t: nextT };
        livesRef.current = updated;
        setLivesState(updated);
        saveLives(updated);
      } else if (!cur.t) {
        const updated = { n: cur.n, t: now };
        livesRef.current = updated;
        setLivesState(updated);
        saveLives(updated);
      }
    } else if (cur.t !== 0) {
      const updated = { n: MAX_LIVES, t: 0 };
      livesRef.current = updated;
      setLivesState(updated);
      saveLives(updated);
    }
  }, []);

  useEffect(() => {
    tickLives();
    const id = window.setInterval(tickLives, 1000);
    return () => window.clearInterval(id);
  }, [tickLives]);

  const consumeLife = useCallback(() => {
    const cur = livesRef.current;
    const nextT = cur.n >= MAX_LIVES ? Date.now() : cur.t || Date.now();
    const updated = { n: Math.max(0, cur.n - 1), t: nextT };
    livesRef.current = updated;
    setLivesState(updated);
    saveLives(updated);
  }, []);

  const showGemToast = useCallback((text: string) => {
    const id = Date.now() + Math.random();
    setGemToasts((prev) => [...prev, { id, text }]);
    window.setTimeout(() => {
      setGemToasts((prev) => prev.filter((t) => t.id !== id));
    }, 1500);
  }, []);

  const showBoardToast = useCallback((text: string) => {
    setToastInfo((prev) => ({ text, key: prev.key + 1 }));
  }, []);

  const checkAchievements = useCallback(
    (nextCb: SaveState, nextProg: LevelProgress): SaveState => {
      const unlockedNow: AchievementDef[] = [];
      const updatedAch = { ...nextCb.ach };
      let addedGems = 0;

      ACHIEVEMENTS.forEach((a) => {
        if (!updatedAch[a.id] && a.getProgress(nextCb, nextProg) >= a.target) {
          updatedAch[a.id] = Date.now();
          addedGems += 5;
          unlockedNow.push(a);
        }
      });

      if (unlockedNow.length > 0) {
        vibratePattern([20, 40, 20], nextCb.set);
        unlockedNow.forEach((ach, idx) => {
          const id = Date.now() + Math.random() + idx;
          setAchToasts((prev) => [...prev, { id, ach, delayIdx: idx }]);
          window.setTimeout(() => {
            setAchToasts((prev) => prev.filter((t) => t.id !== id));
          }, 2800 * (idx + 1) + 400);
        });
        return {
          ...nextCb,
          gems: nextCb.gems + addedGems,
          ach: updatedAch,
        };
      }
      return nextCb;
    },
    []
  );

  const addLeaderboardEntry = useCallback(
    (
      prevCb: SaveState,
      k: LeaderboardKey,
      sc: number,
      extra?: { lv?: number; st?: number }
    ): { nextCb: SaveState; rank: number } => {
      if (!(sc > 0)) return { nextCb: prevCb, rank: 0 };
      const arr = [...(prevCb.lb[k] || [])];
      const entry = { n: prevCb.name, s: sc, d: Date.now(), ...extra };
      arr.push(entry);
      arr.sort((p, q) => q.s - p.s || p.d - q.d);
      const idx = arr.indexOf(entry);
      if (arr.length > 10) arr.length = 10;
      const rank = idx >= 0 && idx < 10 ? idx + 1 : 0;
      setLbTab(k);
      return {
        nextCb: {
          ...prevCb,
          lb: { ...prevCb.lb, [k]: arr },
          lastLb: { k, d: entry.d },
        },
        rank,
      };
    },
    []
  );

  const modeBest = useCallback(
    (m: GameMode, dur: number): number => {
      const k: LeaderboardKey =
        m === 'timer' ? (`t${dur}` as LeaderboardKey) : m === 'classic' ? 'classic' : 'level';
      return Math.max(cbRef.current.lb[k]?.[0]?.s || 0, 0) || classicBestRef.current;
    },
    []
  );

  const handleInteract = useCallback(() => {
    audioEngine.init();
    audioEngine.sfx('ui');
  }, []);

  const showHomeMenu = useCallback(() => {
    clearScheduledTimeouts();
    setPaused(false);
    audioEngine.resume();
    setScreen('home');
    setActivePage(null);
    setOverState((prev) => ({ ...prev, open: false }));
    setWinState((prev) => ({ ...prev, open: false }));
    setFailState((prev) => ({ ...prev, open: false }));
    setPreviewLevelNum(null);
    setTimerPlaying(false);
    setBusy(true);
    setInGame(false);
    setMode('classic');
  }, [clearScheduledTimeouts]);

  const openMap = useCallback(() => {
    clearScheduledTimeouts();
    setPaused(false);
    audioEngine.resume();
    setMode('level');
    setScreen('map');
    setOverState((prev) => ({ ...prev, open: false }));
    setWinState((prev) => ({ ...prev, open: false }));
    setFailState((prev) => ({ ...prev, open: false }));
    setPreviewLevelNum(null);
    setTimerPlaying(false);
    setBusy(true);
    setInGame(false);
  }, [clearScheduledTimeouts]);

  const startNewGame = useCallback(
    (targetMode: GameMode, targetLevelNum?: number, targetDuration?: number) => {
      clearScheduledTimeouts();
      setPaused(false);
      audioEngine.init();
      audioEngine.resume();
      tickLives();
      setLbRank(0);

      if (livesRef.current.n < 1) {
        setScreen('game');
        setOverState({
          open: true,
          mode: 'over',
          title: 'Game over',
          scoreLabel: 'Your final score',
          score: gameRef.current.score,
          best: modeBest(targetMode, targetDuration ?? gameRef.current.timerDur),
          lbRank: 0,
        });
        return;
      }

      const freshBoard = Array(64).fill(-1);
      const freshItems = Array(64).fill(0);
      let nextLv: LevelDef | null = null;
      let nextMoves = 0;
      const dur = targetDuration ?? gameRef.current.timerDur;

      if (targetMode === 'level') {
        const lNum = targetLevelNum ?? progRef.current.u;
        nextLv = makeLevel(lNum);
        nextMoves = nextLv.moves;
        for (let k = 0; k < nextLv.pre; k++) {
          freshBoard[(Math.random() * 64) | 0] = (Math.random() * 6) | 0;
        }
        if (nextLv.type === 'item') {
          let placed = 0;
          let tries = 0;
          while (placed < Math.min(nextLv.t, 2) && tries++ < 80) {
            const idx = (Math.random() * 64) | 0;
            if (freshBoard[idx] >= 0 && !freshItems[idx]) {
              freshItems[idx] = nextLv.ik + 1;
              placed++;
            }
          }
        }
      }

      const initialPieces = [
        createRandomPiece(targetMode, nextLv, 0),
        createRandomPiece(targetMode, nextLv, 0),
        createRandomPiece(targetMode, nextLv, 0),
      ];

      setMode(targetMode);
      setLv(nextLv);
      setMoves(nextMoves);
      if (targetMode === 'timer') {
        setTimerDur(dur);
        setTimeLeft(dur);
        setTimerPlaying(true);
      } else {
        setTimerPlaying(false);
      }

      setBoard(freshBoard);
      setBoardItems(freshItems);
      setPieces(initialPieces);
      setScore(0);
      setStreak(0);
      setBusy(false);
      setRevived(false);
      setInGame(true);
      setPopCells(new Set());
      setCrashCells(new Map());
      setDeadCells(new Set());
      setRings([]);
      setFlyingItems([]);
      setToastInfo({ text: '', key: 0 });

      setOverState((prev) => ({ ...prev, open: false }));
      setWinState((prev) => ({ ...prev, open: false }));
      setFailState((prev) => ({ ...prev, open: false }));
      setPreviewLevelNum(null);
      setShowTimerSelect(false);
      setScreen('game');
    },
    [clearScheduledTimeouts, modeBest, tickLives]
  );

  // End timer mode when time runs out
  const endTimerMode = useCallback(() => {
    setTimerPlaying(false);
    setBusy(true);
    setInGame(false);
    setPaused(false);
    const sc = gameRef.current.score;
    const dur = gameRef.current.timerDur;
    const key = `t${dur}` as LeaderboardKey;

    if (sc > classicBestRef.current) {
      classicBestRef.current = sc;
      setClassicBest(sc);
      saveClassicBest(sc);
    }

    let rank = 0;
    setCb((prev) => {
      const updated: SaveState = {
        ...prev,
        st: {
          ...prev.st,
          games: prev.st.games + 1,
          sum: prev.st.sum + sc,
          best: Math.max(prev.st.best, sc),
        },
      };
      const lbRes = addLeaderboardEntry(updated, key, sc);
      rank = lbRes.rank;
      return checkAchievements(lbRes.nextCb, progRef.current);
    });

    setLbRank(rank);
    audioEngine.sfx('over');
    setOverState({
      open: true,
      mode: 'over',
      title: 'Time\u2019s up',
      scoreLabel: 'Score',
      score: sc,
      best: Math.max(modeBest('timer', dur), sc),
      lbRank: rank,
    });
  }, [addLeaderboardEntry, checkAchievements, modeBest]);

  // Timer countdown loop
  useEffect(() => {
    const canRunTimer = shouldTickGameplayClock({
      screen,
      mode,
      inGame,
      paused,
      tutorialOpen: showTutorial,
      overOpen: overState.open,
      failOpen: failState.open,
      winOpen: winState.open,
      documentHidden: false,
      timerPlaying,
      forTimerCountdown: true,
    });
    if (!canRunTimer) return;

    const id = window.setInterval(() => {
      if (document.hidden) return;
      setTimeLeft((prev) => {
        const next = prev - 0.1;
        if (next <= 0) {
          window.clearInterval(id);
          window.setTimeout(() => endTimerMode(), 0);
          return 0;
        }
        return next;
      });
    }, 100);
    return () => window.clearInterval(id);
  }, [
    screen,
    mode,
    inGame,
    paused,
    showTutorial,
    timerPlaying,
    overState.open,
    failState.open,
    winState.open,
    endTimerMode,
  ]);

  const spawnBurstAtCell = useCallback((idx: number, colorIdx: number) => {
    const bEl = boardRef.current;
    if (!bEl) return;
    const cs = bEl.clientWidth / GRID_SIZE;
    const rect = bEl.getBoundingClientRect();
    const x = rect.left + ((idx % GRID_SIZE) + 0.5) * cs;
    const y = rect.top + (Math.floor(idx / GRID_SIZE) + 0.5) * cs;
    fxPool.spawnBurst(x, y, colorIdx);
  }, []);

  const triggerFillUpAndFail = useCallback(
    (finalScore: number) => {
      setBusy(true);
      const curBoard = gameRef.current.board;

      for (let r = GRID_SIZE - 1; r >= 0; r--) {
        const delay = (GRID_SIZE - 1 - r) * 85;
        scheduleTimeout(() => {
          setDeadCells((prev) => {
            const next = new Set(prev);
            for (let c = 0; c < GRID_SIZE; c++) {
              const i = r * GRID_SIZE + c;
              if (curBoard[i] < 0) next.add(i);
            }
            return next;
          });
          if (audioEngine.isReadyAndUnmuted) {
            audioEngine.tone(
              220 + (GRID_SIZE - 1 - r) * 48,
              audioEngine.currentTime,
              0.09,
              'triangle',
              0.08
            );
          }
          vibratePattern(6, cbRef.current.set);
        }, delay);
      }

      scheduleTimeout(() => {
        setFailState({
          open: true,
          score: finalScore,
          revived: gameRef.current.revived,
        });
      }, GRID_SIZE * 85 + 500);
    },
    [scheduleTimeout]
  );

  const reviveBoard = useCallback(
    (currentBoard: number[], currentItems: number[], isLevelMode: boolean) => {
      setBusy(true);
      setDeadCells(new Set());
      if (isLevelMode && gameRef.current.moves <= 0) {
        setMoves((m) => m + 5);
      }

      const rowCount = (r: number) => {
        let count = 0;
        for (let c = 0; c < GRID_SIZE; c++) {
          if (currentBoard[r * GRID_SIZE + c] >= 0) count++;
        }
        return count;
      };

      const rows = [...Array(GRID_SIZE).keys()]
        .sort((a, b) => rowCount(b) - rowCount(a))
        .slice(0, 3);
      const clearIdx: number[] = [];
      rows.forEach((r) => {
        for (let c = 0; c < GRID_SIZE; c++) {
          const i = r * GRID_SIZE + c;
          if (currentBoard[i] >= 0) clearIdx.push(i);
        }
      });

      const crashMap = new Map<number, number>();
      clearIdx.forEach((i) => {
        crashMap.set(i, 0);
        spawnBurstAtCell(i, currentBoard[i]);
      });
      setCrashCells(crashMap);

      if (audioEngine.isReadyAndUnmuted) {
        audioEngine.boom();
      }

      scheduleTimeout(() => {
        const nextBoard = [...currentBoard];
        const nextItems = [...currentItems];
        clearIdx.forEach((i) => {
          nextBoard[i] = -1;
          nextItems[i] = 0;
        });

        let tries = 0;
        let nextPcs: Piece[];
        do {
          nextPcs = [
            createRandomPiece(gameRef.current.mode, gameRef.current.lv, gameRef.current.score),
            createRandomPiece(gameRef.current.mode, gameRef.current.lv, gameRef.current.score),
            createRandomPiece(gameRef.current.mode, gameRef.current.lv, gameRef.current.score),
          ];
        } while (!nextPcs.some((p) => canPlacePiece(nextBoard, p)) && ++tries < 30);

        setCrashCells(new Map());
        setBoard(nextBoard);
        setBoardItems(nextItems);
        setPieces(nextPcs);
        setBusy(false);
      }, 450);
    },
    [scheduleTimeout, spawnBurstAtCell]
  );

  const handleWinLevel = useCallback(
    (wonLv: LevelDef, movesLeft: number, finalScore: number) => {
      setBusy(true);
      setTimerPlaying(false);
      setInGame(false);
      setPaused(false);

      const ratio = movesLeft / wonLv.maxMoves;
      const stars = ratio >= 0.5 ? 3 : ratio >= 0.25 ? 2 : 1;

      const curProg = progRef.current;
      const prevStars = curProg.s[wonLv.n] || 0;
      const nextProg: LevelProgress = {
        u: wonLv.n === curProg.u ? curProg.u + 1 : curProg.u,
        s: { ...curProg.s, [wonLv.n]: Math.max(prevStars, stars) },
      };
      progRef.current = nextProg;
      setProg(nextProg);
      saveProgress(nextProg);

      if (finalScore > classicBestRef.current) {
        classicBestRef.current = finalScore;
        setClassicBest(finalScore);
        saveClassicBest(finalScore);
      }

      let rank = 0;
      setCb((prev) => {
        let nextCb: SaveState = {
          ...prev,
          gems: prev.gems + (stars === 3 && prevStars < 3 ? 2 : 0),
          st: {
            ...prev.st,
            games: prev.st.games + 1,
            sum: prev.st.sum + finalScore,
            best: Math.max(prev.st.best, finalScore),
            perfect: prev.st.perfect + (stars === 3 ? 1 : 0),
          },
        };
        if (stars === 3 && prevStars < 3) {
          showGemToast('+2 gems');
        }
        const lbRes = addLeaderboardEntry(nextCb, 'level', finalScore, {
          lv: wonLv.n,
          st: stars,
        });
        rank = lbRes.rank;
        nextCb = checkAchievements(lbRes.nextCb, nextProg);
        return nextCb;
      });

      setLbRank(rank);
      audioEngine.sfx('reward');
      if (audioEngine.isReadyAndUnmuted) {
        audioEngine.boom();
      }
      fxPool.spawnConfetti();

      scheduleTimeout(() => {
        setWinState({
          open: true,
          stars,
          score: finalScore,
          movesLeft,
          lbRank: rank,
        });
      }, 700);
    },
    [addLeaderboardEntry, checkAchievements, scheduleTimeout, showGemToast]
  );

  const handleInvalidDrop = useCallback(() => {
    audioEngine.sfx('invalid');
    vibratePattern([10, 30, 10], cbRef.current.set);
    setBoardShakeKey((k) => k + 1);
    showBoardToast("Can't place there");
  }, [showBoardToast]);

  const handlePlacePiece = useCallback(
    (slotIdx: number, [r0, c0]: [number, number]) => {
      const gState = gameRef.current;
      const piece = gState.pieces[slotIdx];
      if (!piece || gState.busy || gState.paused) return;

      setBusy(true);
      const nextBoard = [...gState.board];
      const nextItems = [...gState.boardItems];
      const popIdx = new Set<number>();

      piece.c.forEach(([a, b]) => {
        const idx = (r0 + a) * GRID_SIZE + c0 + b;
        nextBoard[idx] = piece.k;
        popIdx.add(idx);
      });

      if (piece.it && piece.ii !== undefined) {
        const [ir, ic] = piece.c[piece.ii];
        nextItems[(r0 + ir) * GRID_SIZE + c0 + ic] = piece.it;
      }

      let nextScore = gState.score + piece.c.length;
      const nextPieces = [...gState.pieces];
      nextPieces[slotIdx] = null;

      // Detect full rows and columns
      const clearedSet = new Set<number>();
      let lines = 0;
      for (let r = 0; r < GRID_SIZE; r++) {
        let full = true;
        for (let c = 0; c < GRID_SIZE; c++) {
          if (nextBoard[r * GRID_SIZE + c] < 0) {
            full = false;
            break;
          }
        }
        if (full) {
          lines++;
          for (let c = 0; c < GRID_SIZE; c++) clearedSet.add(r * GRID_SIZE + c);
        }
      }
      for (let c = 0; c < GRID_SIZE; c++) {
        let full = true;
        for (let r = 0; r < GRID_SIZE; r++) {
          if (nextBoard[r * GRID_SIZE + c] < 0) {
            full = false;
            break;
          }
        }
        if (full) {
          lines++;
          for (let r = 0; r < GRID_SIZE; r++) clearedSet.add(r * GRID_SIZE + c);
        }
      }

      // Collect cleared items before erasing
      const collectedItems: Record<number, number> = {};
      clearedSet.forEach((i) => {
        if (nextItems[i]) {
          collectedItems[nextItems[i]] = (collectedItems[nextItems[i]] || 0) + 1;
        }
      });

      setPopCells(popIdx);
      setPieces(nextPieces);

      const finishMove = (
        finalBoard: number[],
        finalItems: number[],
        finalScore: number,
        nextStreak: number
      ) => {
        const collectedCount = Object.values(collectedItems).reduce(
          (a, b) => a + b,
          0
        );
        setCb((prev) => {
          const updated: SaveState = {
            ...prev,
            st: {
              ...prev.st,
              lines: prev.st.lines + lines,
              streak: Math.max(prev.st.streak, nextStreak),
              items: prev.st.items + collectedCount,
            },
          };
          return lines > 0 ? checkAchievements(updated, progRef.current) : updated;
        });

        if (gState.mode === 'level' && gState.lv) {
          const nextMoves = gState.moves - 1;
          const updatedLv: LevelDef = {
            ...gState.lv,
            moves: nextMoves,
            cl: gState.lv.cl + lines,
            cc:
              gState.lv.type === 'color' && piece.k === gState.lv.col
                ? gState.lv.cc + piece.c.length
                : gState.lv.type === 'item'
                ? gState.lv.cc + (collectedItems[gState.lv.ik + 1] || 0)
                : gState.lv.cc,
            bs: Math.max(gState.lv.bs, nextStreak),
          };
          setMoves(nextMoves);
          setLv(updatedLv);

          if (isGoalMet(updatedLv, finalScore)) {
            handleWinLevel(updatedLv, nextMoves, finalScore);
            return;
          }
          if (nextMoves <= 0) {
            audioEngine.sfx('over');
            setFailState({
              open: true,
              score: finalScore,
              revived: gState.revived,
            });
            return;
          }
        }

        if (gState.mode === 'timer' && lines > 0) {
          setTimeLeft((t) => t + 2 * lines);
        }

        let resolvedPieces = nextPieces;
        if (resolvedPieces.every((p) => !p)) {
          const activeLv = gState.mode === 'level' ? gState.lv : null;
          resolvedPieces = [
            createRandomPiece(gState.mode, activeLv, finalScore),
            createRandomPiece(gState.mode, activeLv, finalScore),
            createRandomPiece(gState.mode, activeLv, finalScore),
          ];
          setPieces(resolvedPieces);
        }

        if (finalScore > classicBestRef.current) {
          classicBestRef.current = finalScore;
          setClassicBest(finalScore);
          saveClassicBest(finalScore);
        }

        setBusy(false);

        if (!resolvedPieces.some((p) => p && canPlacePiece(finalBoard, p))) {
          if (gState.mode === 'timer') {
            setTimeLeft((t) => Math.max(0, t - 5));
            showBoardToast('No moves · -5s');
            reviveBoard(finalBoard, finalItems, false);
            return;
          }
          audioEngine.sfx('over');
          triggerFillUpAndFail(finalScore);
        }
      };

      if (lines > 0) {
        clearedSet.forEach((i) => {
          nextBoard[i] = piece.k;
        });
        const nextStreak = gState.streak + 1;
        nextScore += lines * lines * 10 + (nextStreak - 1) * 10;

        setBoard(nextBoard);
        setBoardItems(nextItems);
        setScore(nextScore);
        setStreak(nextStreak);

        audioEngine.sfx('crash', nextStreak);
        if (audioEngine.isReadyAndUnmuted) {
          audioEngine.boom();
        }
        showBoardToast(
          `${lines > 1 ? `${lines} lines` : 'Crash'}${
            nextStreak > 1 ? ` x${nextStreak}` : ''
          }`
        );

        scheduleTimeout(() => {
          const bEl = boardRef.current;
          if (bEl && clearedSet.size > 0) {
            const cs = bEl.clientWidth / GRID_SIZE;
            let sx = 0;
            let sy = 0;
            clearedSet.forEach((i) => {
              sx += (i % GRID_SIZE) + 0.5;
              sy += Math.floor(i / GRID_SIZE) + 0.5;
            });
            const ringId = Date.now() + Math.random();
            setRings((prev) => [
              ...prev,
              {
                id: ringId,
                x: (sx / clearedSet.size) * cs,
                y: (sy / clearedSet.size) * cs,
                k: 10 + lines * 4,
              },
            ]);
            scheduleTimeout(() => {
              setRings((prev) => prev.filter((r) => r.id !== ringId));
            }, 700);
            setBoardShakeKey((k) => k + 1);
          }

          if (bEl) {
            const bRect = bEl.getBoundingClientRect();
            const cs = bRect.width / GRID_SIZE;
            const targetEl =
              (goalRef.current?.querySelector('.gi2') as HTMLElement | null) ||
              goalRef.current;
            const gRect = targetEl?.getBoundingClientRect() || bRect;
            let k = 0;
            clearedSet.forEach((i) => {
              if (!nextItems[i]) return;
              const x = bRect.left + ((i % GRID_SIZE) + 0.5) * cs - 20;
              const y = bRect.top + (Math.floor(i / GRID_SIZE) + 0.5) * cs - 20;
              const dx = gRect.left + gRect.width / 2 - 20 - x;
              const dy = gRect.top + gRect.height / 2 - 20 - y;
              const flyId = Date.now() + Math.random() + k;
              const itemIdx = nextItems[i] - 1;
              const delay = k * 90;
              scheduleTimeout(() => {
                setFlyingItems((prev) => [
                  ...prev,
                  { id: flyId, itemIdx, x, y, dx, dy },
                ]);
                if (audioEngine.isReadyAndUnmuted) {
                  audioEngine.tone(
                    880 + delay,
                    audioEngine.currentTime + 0.05,
                    0.14,
                    'sine',
                    0.13
                  );
                }
                scheduleTimeout(() => {
                  setFlyingItems((prev) => prev.filter((f) => f.id !== flyId));
                }, 760);
              }, delay);
              k++;
            });
          }

          const cMap = new Map<number, number>();
          clearedSet.forEach((i) => {
            const dl = ((i % GRID_SIZE) + Math.floor(i / GRID_SIZE)) * 15;
            cMap.set(i, dl);
            scheduleTimeout(() => spawnBurstAtCell(i, nextBoard[i]), dl);
          });
          setCrashCells(cMap);
        }, 60);

        vibratePattern(30, cbRef.current.set);

        scheduleTimeout(() => {
          const clearedBoard = [...nextBoard];
          const clearedItems = [...nextItems];
          clearedSet.forEach((i) => {
            clearedBoard[i] = -1;
            clearedItems[i] = 0;
          });
          setCrashCells(new Map());
          setPopCells(new Set());
          setBoard(clearedBoard);
          setBoardItems(clearedItems);
          finishMove(clearedBoard, clearedItems, nextScore, nextStreak);
        }, 620);
      } else {
        setBoard(nextBoard);
        setBoardItems(nextItems);
        setScore(nextScore);
        setStreak(0);
        audioEngine.sfx('place');
        vibratePattern(8, cbRef.current.set);
        finishMove(nextBoard, nextItems, nextScore, 0);
      }
    },
    [
      checkAchievements,
      handleWinLevel,
      reviveBoard,
      scheduleTimeout,
      showBoardToast,
      spawnBurstAtCell,
      triggerFillUpAndFail,
    ]
  );

  const handleContinueWithGems = useCallback((): boolean => {
    if (cbRef.current.gems < 10) {
      showGemToast('Need 10 gems');
      return false;
    }
    setCb((prev) => ({ ...prev, gems: prev.gems - 10 }));
    setFailState((prev) => ({ ...prev, open: false }));
    setRevived(true);
    reviveBoard(
      gameRef.current.board,
      gameRef.current.boardItems,
      gameRef.current.mode === 'level'
    );
    return true;
  }, [reviveBoard, showGemToast]);

  const handleGiveUp = useCallback(() => {
    setFailState((prev) => ({ ...prev, open: false }));
    setHeartBreakRunId((id) => id + 1);
    setShowHeartBreak(true);
    audioEngine.playBreakSequence();
    vibratePattern([40, 60, 80], cbRef.current.set);

    scheduleTimeout(() => {
      const hEl = document.querySelector('#brk .bh') as HTMLElement | null;
      if (hEl) {
        const rect = hEl.getBoundingClientRect();
        fxPool.spawnHeartShatter(
          rect.left + rect.width / 2,
          rect.top + rect.height * 0.5
        );
      }
      vibratePattern(60, cbRef.current.set);
    }, 800);

    scheduleTimeout(() => {
      consumeLife();
      const sc = gameRef.current.score;
      const curMode = gameRef.current.mode;
      let rank = 0;

      setCb((prev) => {
        let nextCb: SaveState = {
          ...prev,
          st: {
            ...prev.st,
            games: prev.st.games + 1,
            sum: prev.st.sum + sc,
            best: Math.max(prev.st.best, sc),
          },
        };
        if (curMode === 'classic') {
          const lbRes = addLeaderboardEntry(nextCb, 'classic', sc);
          rank = lbRes.rank;
          nextCb = lbRes.nextCb;
        }
        return checkAchievements(nextCb, progRef.current);
      });

      setInGame(false);
      setShowHeartBreak(false);
      setLbRank(rank);

      if (curMode === 'level') {
        openMap();
      } else {
        setOverState({
          open: true,
          mode: 'over',
          title: 'Game over',
          scoreLabel: 'Your final score',
          score: sc,
          best: modeBest(curMode, gameRef.current.timerDur),
          lbRank: rank,
        });
      }
    }, 2400);
  }, [
    addLeaderboardEntry,
    checkAchievements,
    modeBest,
    openMap,
    scheduleTimeout,
    consumeLife,
  ]);

  const openPause = useCallback(() => {
    setPaused(true);
    audioEngine.pause();
  }, []);

  const resumeGame = useCallback(() => {
    setPaused(false);
    audioEngine.resume();
  }, []);

  // Escape & P keys mirror pause/back behavior
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isPauseKey =
        (e.key === 'p' || e.key === 'P') &&
        document.activeElement?.tagName !== 'INPUT';

      if (e.key !== 'Escape' && !isPauseKey) return;

      if (showTutorial) {
        if (e.key === 'Escape') closeTutorial();
        return;
      }

      if (isPauseKey) {
        if (
          screen === 'game' &&
          inGame &&
          !failState.open &&
          !winState.open &&
          !overState.open &&
          !showHeartBreak
        ) {
          if (paused) resumeGame();
          else openPause();
        }
        return;
      }

      if (confirmState.open) {
        setConfirmState((s) => ({ ...s, open: false }));
      } else if (paused) {
        resumeGame();
      } else if (showProfile) {
        setShowProfile(false);
      } else if (showDaily) {
        setShowDaily(false);
      } else if (showTimerSelect) {
        setShowTimerSelect(false);
      } else if (activePage) {
        setActivePage(null);
      } else if (previewLevelNum !== null) {
        setPreviewLevelNum(null);
      } else if (showHeartBreak || failState.open) {
        // do nothing during heart break or fail choice
      } else if (winState.open) {
        openMap();
      } else if (overState.open) {
        showHomeMenu();
      } else if (screen === 'map') {
        showHomeMenu();
      } else if (screen === 'game') {
        openPause();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    showTutorial,
    closeTutorial,
    paused,
    openPause,
    resumeGame,
    confirmState.open,
    showProfile,
    showDaily,
    showTimerSelect,
    activePage,
    previewLevelNum,
    showHeartBreak,
    failState.open,
    winState.open,
    overState.open,
    screen,
    inGame,
    openMap,
    showHomeMenu,
  ]);

  const handleClaimDaily = () => {
    const state = getDailyRewardState(cb.daily);
    if (!state.canClaim) return;
    const reward = DAILY_REWARDS[state.idx];
    audioEngine.sfx('reward');
    fxPool.spawnConfetti();
    showGemToast(`+${reward} gems`);

    setCb((prev) => {
      const nextStreak = state.idx === 0 ? 1 : prev.daily.streak + 1;
      const nextCb: SaveState = {
        ...prev,
        gems: prev.gems + reward,
        daily: { last: getTodayKey(), streak: nextStreak },
        st: { ...prev.st, claims: prev.st.claims + 1 },
      };
      return checkAchievements(nextCb, progRef.current);
    });
  };

  const handleSelectTheme = (themeId: ThemeId) => {
    const theme = THEMES.find((t) => t.id === themeId);
    if (!theme) return;
    if (!cb.unl.includes(themeId)) {
      if (cb.gems < theme.cost) {
        audioEngine.sfx('invalid');
        showGemToast('Not enough gems');
        return;
      }
      audioEngine.sfx('reward');
      setCb((prev) => ({
        ...prev,
        gems: prev.gems - theme.cost,
        unl: [...prev.unl, themeId],
        theme: themeId,
      }));
    } else {
      setCb((prev) => ({ ...prev, theme: themeId }));
    }
  };

  const handleUpdateSetting = (key: keyof SettingsState, val: number) => {
    setCb((prev) => {
      const nextSet = { ...prev.set, [key]: val };
      if (key === 'hap' && val) {
        vibratePattern(30, nextSet);
      }
      return { ...prev, set: nextSet };
    });
  };

  const nextLifeText =
    livesState.n < MAX_LIVES && livesState.t
      ? formatMs(LIFE_REGEN_MS - (nowTick - livesState.t))
      : '';

  const isMuted = !(cb.set.sfx || cb.set.mus);

  return (
    <>
      <SharedSvgDefs />
      <BackgroundCanvas />

      <GameBoardView
        board={board}
        boardItems={boardItems}
        pieces={pieces}
        score={score}
        best={classicBest}
        streak={streak}
        lives={livesState.n}
        nextLifeText={nextLifeText}
        mode={mode}
        lv={lv}
        moves={moves}
        timeLeft={timeLeft}
        busy={busy}
        paused={paused || showTutorial}
        muted={isMuted}
        toastInfo={toastInfo}
        popCells={popCells}
        crashCells={crashCells}
        deadCells={deadCells}
        boardShakeKey={boardShakeKey}
        rings={rings}
        flyingItems={flyingItems}
        boardRef={boardRef}
        goalRef={goalRef}
        onToggleMute={() => {
          const nextOn = isMuted ? 1 : 0;
          setCb((prev) => ({
            ...prev,
            set: { ...prev.set, sfx: nextOn, mus: nextOn },
          }));
        }}
        onPause={openPause}
        onOpenTutorial={() => setShowTutorial(true)}
        onPlacePiece={handlePlacePiece}
        onInvalidDrop={handleInvalidDrop}
        onAudioInit={() => audioEngine.init()}
      />

      <HomeScreen
        visible={screen === 'home'}
        cb={cb}
        prog={prog}
        lives={livesState.n}
        nextLifeText={nextLifeText}
        classicBest={classicBest}
        onOpenProfile={() => setShowProfile(true)}
        onOpenSettings={() => setActivePage('pgSet')}
        onOpenTutorial={() => setShowTutorial(true)}
        onPlayCurrent={() => {
          openMap();
          setPreviewLevelNum(prog.u);
        }}
        onOpenMap={openMap}
        onOpenTimerSelect={() => setShowTimerSelect(true)}
        onStartClassic={() => startNewGame('classic')}
        onOpenDaily={() => setShowDaily(true)}
        onOpenPage={(p) => setActivePage(p)}
        onInteract={handleInteract}
      />

      <LevelMap
        visible={screen === 'map'}
        prog={prog}
        lives={livesState.n}
        onBack={showHomeMenu}
        onSelectLevel={(n) => setPreviewLevelNum(n)}
        onInteract={handleInteract}
      />

      <Pages
        activePage={activePage}
        cb={cb}
        prog={prog}
        lbTab={lbTab}
        onChangeLbTab={setLbTab}
        onClose={() => setActivePage(null)}
        onUpdateSetting={handleUpdateSetting}
        onReplayTutorial={() => {
          setActivePage(null);
          setShowTutorial(true);
        }}
        onRequestReset={() =>
          setConfirmState({
            open: true,
            title: 'Reset all data?',
            message:
              'This permanently deletes your progress, stats, rewards, themes and settings.',
            okLabel: 'Reset All',
            onConfirm: () => {
              clearAllSavedData();
              window.location.reload();
            },
          })
        }
        onSelectTheme={handleSelectTheme}
        onInteract={handleInteract}
      />

      <Modals
        showPause={paused}
        pauseContext={{
          mode,
          score,
          levelNum: lv?.n,
          timeLeft,
        }}
        onResumeGame={resumeGame}
        onRestartRun={() =>
          startNewGame(mode, lv?.n, mode === 'timer' ? timerDur : undefined)
        }
        onOpenTutorialFromPause={() => setShowTutorial(true)}
        onToggleMusicFromPause={() =>
          handleUpdateSetting('mus', cb.set.mus ? 0 : 1)
        }
        onToggleSfxFromPause={() =>
          handleUpdateSetting('sfx', cb.set.sfx ? 0 : 1)
        }
        onQuitFromPause={() => {
          setPaused(false);
          if (mode === 'level') openMap();
          else showHomeMenu();
        }}
        showTimerSelect={showTimerSelect}
        cb={cb}
        onSelectTimer={(dur) => startNewGame('timer', undefined, dur)}
        onCancelTimer={() => setShowTimerSelect(false)}
        showDaily={showDaily}
        onClaimDaily={handleClaimDaily}
        onCloseDaily={() => setShowDaily(false)}
        showProfile={showProfile}
        onSaveProfile={(name, av) => {
          setCb((prev) => ({ ...prev, name, av }));
          setShowProfile(false);
        }}
        onCloseProfile={() => setShowProfile(false)}
        confirmState={confirmState}
        onCloseConfirm={() =>
          setConfirmState((prev) => ({ ...prev, open: false }))
        }
        previewLevelNum={previewLevelNum}
        prog={prog}
        onPlayLevel={(n) => startNewGame('level', n)}
        onCloseLevelPreview={() => setPreviewLevelNum(null)}
        winState={winState}
        onNextLevel={() => startNewGame('level', (lv?.n || prog.u) + 1)}
        onWinToMap={openMap}
        failState={failState}
        onContinueWithGems={handleContinueWithGems}
        onGiveUp={handleGiveUp}
        showHeartBreak={showHeartBreak}
        heartBreakRunId={heartBreakRunId}
        overState={{
          ...overState,
          lbRank: overState.lbRank || lbRank,
          lives: livesState.n,
          nextLifeText,
        }}
        onOverPlay={() =>
          startNewGame(mode, lv?.n, mode === 'timer' ? timerDur : undefined)
        }
        onOverMenu={showHomeMenu}
        onInteract={handleInteract}
      />

      <TutorialModal
        open={showTutorial}
        onClose={closeTutorial}
        onInteract={handleInteract}
      />

      {/* Floating Achievement & Gem Toasts */}
      {achToasts.map((t) => (
        <div
          key={t.id}
          className="atoast"
          style={{ animationDelay: `${t.delayIdx * 2.8}s` }}
        >
          <span className="ai on">
            <svg viewBox="0 0 24 24">
              <path d={t.ach.iconPath} />
            </svg>
          </span>
          <div>
            <small>Achievement unlocked</small>
            <b>{t.ach.title}</b>
          </div>
          <span className="gc">
            <svg viewBox="0 0 24 24">
              <path
                d="M12 2.5l8 7.2L12 21.5 4 9.7z"
                fill="url(#gmF)"
                stroke="rgba(255,255,255,.7)"
                strokeWidth="1"
              />
            </svg>
            +5
          </span>
        </div>
      ))}

      {gemToasts.map((t) => (
        <div key={t.id} className="gtoast">
          {t.text}
        </div>
      ))}

      <SplashScreen onComplete={handleSplashComplete} />
    </>
  );
}

export default App;
