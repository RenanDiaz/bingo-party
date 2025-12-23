import { browser } from '$app/environment';
import type {
  BingoGameState,
  BingoCard,
  BingoPlayer,
  Pattern,
  ServerMessage,
  ClientMessage,
  NumberCall,
  Winner,
} from '../../../shared/types';
import { checkPatternMatch, getWinningCells } from '../utils/patternDetector';
import { createEmptyMarkedGrid } from '../utils/cardGenerator';
import { playNumberCalledSound, playBingoSound } from '../utils/audio';

// Create a reactive game store
export function createGameStore() {
  // Core state
  let gameState = $state<BingoGameState | null>(null);
  let myPlayerId = $state<string>('');
  let isHost = $state<boolean>(false);
  let connected = $state<boolean>(false);
  let error = $state<string | null>(null);
  let kicked = $state<boolean>(false);

  // Card state
  let cardPool = $state<BingoCard[]>([]);
  let selectedCardIds = $state<string[]>([]);
  let markedCells = $state<Record<string, boolean[][]>>({});

  // WebSocket connection
  let socket: WebSocket | null = null;
  let connectionTimeout: ReturnType<typeof setTimeout> | null = null;
  let currentRoomId: string | null = null;
  let currentPlayerName: string | null = null;
  let isReconnecting = $state<boolean>(false);
  let retryCount = 0;
  let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  let intentionalDisconnect = false;

  const MAX_RETRIES = 5;
  const BASE_RETRY_DELAY = 1000; // 1 second

  // Derived state
  const myPlayer = $derived(
    gameState?.players[myPlayerId] ?? null
  );

  const myCards = $derived(
    cardPool.filter(c => selectedCardIds.includes(c.id))
  );

  const currentPattern = $derived(
    gameState?.currentPattern ?? null
  );

  const canClaimBingo = $derived.by(() => {
    if (!currentPattern || !gameState || gameState.phase !== 'playing') {
      return { can: false, cardId: null as string | null };
    }

    for (const cardId of selectedCardIds) {
      const marked = markedCells[cardId];
      if (marked && checkPatternMatch(marked, currentPattern)) {
        return { can: true, cardId };
      }
    }

    return { can: false, cardId: null as string | null };
  });

  const winningCells = $derived.by(() => {
    const result: Record<string, boolean[][]> = {};

    if (!currentPattern) return result;

    for (const cardId of selectedCardIds) {
      const marked = markedCells[cardId];
      if (marked && checkPatternMatch(marked, currentPattern)) {
        result[cardId] = getWinningCells(marked, currentPattern);
      }
    }

    return result;
  });

  const allPlayers = $derived(
    gameState ? Object.values(gameState.players) : []
  );

  const onlinePlayers = $derived(
    allPlayers.filter(p => p.connected)
  );

  const readyPlayers = $derived(
    allPlayers.filter(p => p.readyToPlay)
  );

  // Connect to PartyKit server
  function connect(roomId: string, isRetry: boolean = false) {
    if (!browser) return;

    // Store room ID for reconnection
    if (!isRetry) {
      currentRoomId = roomId;
      intentionalDisconnect = false;
      retryCount = 0;
    }

    const host = import.meta.env.VITE_PARTYKIT_HOST;

    // Check if PartyKit host is configured for production
    if (!host) {
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      if (!isLocalhost) {
        error = 'Game server not configured. Please set VITE_PARTYKIT_HOST.';
        isReconnecting = false;
        return;
      }
    }

    const partyHost = host || 'localhost:1999';
    const protocol = partyHost.includes('localhost') ? 'ws' : 'wss';
    const url = `${protocol}://${partyHost}/parties/main/${roomId}`;

    // Set connection timeout (10 seconds)
    connectionTimeout = setTimeout(() => {
      if (!connected) {
        if (socket) {
          socket.close();
          socket = null;
        }
        // Trigger reconnection attempt
        handleConnectionFailure('Connection timeout. Please check your internet connection.');
      }
    }, 10000);

    try {
      socket = new WebSocket(url);
    } catch (e) {
      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
        connectionTimeout = null;
      }
      handleConnectionFailure('Failed to connect to game server.');
      return;
    }

    socket.onopen = () => {
      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
        connectionTimeout = null;
      }

      const wasReconnecting = isReconnecting;
      connected = true;
      error = null;
      isReconnecting = false;
      retryCount = 0;

      // Auto-rejoin room after reconnection
      if (wasReconnecting && currentPlayerName) {
        send({ type: 'joinRoom', playerName: currentPlayerName });
      }
    };

    socket.onclose = () => {
      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
        connectionTimeout = null;
      }
      connected = false;

      // Attempt reconnection if not intentionally disconnected
      if (!intentionalDisconnect && currentRoomId) {
        attemptReconnection();
      }
    };

    socket.onerror = () => {
      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
        connectionTimeout = null;
      }
      connected = false;
      // Note: onerror is usually followed by onclose, so reconnection will be handled there
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as ServerMessage;
        handleServerMessage(message);
      } catch (e) {
        console.error('Failed to parse message:', e);
      }
    };
  }

  // Handle connection failure
  function handleConnectionFailure(errorMessage: string) {
    if (intentionalDisconnect) {
      error = null;
      isReconnecting = false;
      return;
    }

    if (retryCount < MAX_RETRIES && currentRoomId) {
      attemptReconnection();
    } else {
      error = errorMessage;
      isReconnecting = false;
    }
  }

  // Attempt to reconnect with exponential backoff
  function attemptReconnection() {
    if (intentionalDisconnect || !currentRoomId || retryCount >= MAX_RETRIES) {
      if (retryCount >= MAX_RETRIES) {
        error = 'Connection failed. Game server may be unavailable.';
        isReconnecting = false;
      }
      return;
    }

    isReconnecting = true;
    retryCount++;

    // Exponential backoff: 1s, 2s, 4s, 8s, 16s
    const delay = Math.min(BASE_RETRY_DELAY * Math.pow(2, retryCount - 1), 16000);

    reconnectTimeout = setTimeout(() => {
      if (currentRoomId && !intentionalDisconnect) {
        connect(currentRoomId, true);
      }
    }, delay);
  }

  // Disconnect from server
  function disconnect() {
    intentionalDisconnect = true;

    if (connectionTimeout) {
      clearTimeout(connectionTimeout);
      connectionTimeout = null;
    }
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
    if (socket) {
      socket.close();
      socket = null;
    }
    connected = false;
    isReconnecting = false;
    currentRoomId = null;
    currentPlayerName = null;
    retryCount = 0;
    gameState = null;
    myPlayerId = '';
    isHost = false;
  }

  // Send message to server
  function send(message: ClientMessage) {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  }

  // Handle incoming server messages
  function handleServerMessage(message: ServerMessage) {
    switch (message.type) {
      case 'init':
        myPlayerId = message.playerId;
        isHost = message.isHost;
        gameState = message.state;
        break;

      case 'cardPool':
        cardPool = message.cards;
        selectedCardIds = [];
        markedCells = {};
        break;

      case 'gameState':
        gameState = message.state;
        // Sync local marked cells with server state
        if (gameState.players[myPlayerId]) {
          markedCells = { ...gameState.players[myPlayerId].markedCells };
        }
        break;

      case 'numberCalled':
        gameState = message.state;
        // Auto-update local marked cells if autoMark is enabled
        if (myPlayer?.autoMark) {
          autoMarkLocalNumber(message.call.number);
        }
        // Play sound for number call
        playNumberCalledSound();
        break;

      case 'playerJoined':
        if (gameState) {
          gameState = {
            ...gameState,
            players: {
              ...gameState.players,
              [message.player.id]: message.player,
            },
          };
        }
        break;

      case 'playerLeft':
        if (gameState) {
          const { [message.playerId]: _, ...remaining } = gameState.players;
          gameState = { ...gameState, players: remaining };
        }
        break;

      case 'playerUpdated':
        if (gameState) {
          gameState = {
            ...gameState,
            players: {
              ...gameState.players,
              [message.player.id]: message.player,
            },
          };
          // Sync our own marked cells
          if (message.player.id === myPlayerId) {
            markedCells = { ...message.player.markedCells };
          }
        }
        break;

      case 'bingoValidated':
        if (gameState) {
          gameState = {
            ...gameState,
            winners: [...gameState.winners, message.winner],
          };
          // Play celebratory sound for bingo
          playBingoSound();
        }
        break;

      case 'bingoInvalid':
        if (message.playerId === myPlayerId) {
          error = message.reason;
          setTimeout(() => {
            error = null;
          }, 3000);
        }
        break;

      case 'gameStarted':
        gameState = message.state;
        break;

      case 'gamePaused':
        if (gameState) {
          gameState = { ...gameState, phase: 'paused' };
        }
        break;

      case 'gameResumed':
        gameState = message.state;
        break;

      case 'gameReset':
        gameState = message.state;
        selectedCardIds = [];
        markedCells = {};
        break;

      case 'timeoutStarted':
        if (gameState) {
          gameState = {
            ...gameState,
            phase: 'timeout',
            timeoutEndTime: message.endTime,
          };
        }
        break;

      case 'timeoutEnded':
        if (gameState) {
          gameState = { ...gameState, phase: 'playing', timeoutEndTime: null };
        }
        break;

      case 'kicked':
        kicked = true;
        disconnect();
        break;

      case 'error':
        error = message.message;
        setTimeout(() => {
          error = null;
        }, 3000);
        break;
    }
  }

  // Auto-mark a number locally
  function autoMarkLocalNumber(number: number) {
    for (const cardId of selectedCardIds) {
      const card = cardPool.find(c => c.id === cardId);
      if (!card) continue;

      const marked = markedCells[cardId] || createEmptyMarkedGrid();
      const newMarked = marked.map((row, ri) =>
        row.map((cell, ci) => {
          if (card.grid[ri][ci] === number) return true;
          return cell;
        })
      );

      markedCells = { ...markedCells, [cardId]: newMarked };
    }
  }

  // Player actions
  function joinRoom(playerName: string) {
    currentPlayerName = playerName;
    send({ type: 'joinRoom', playerName });
  }

  function selectCards(cardIds: string[]) {
    selectedCardIds = cardIds;
    // Initialize marked cells for selected cards
    const newMarkedCells: Record<string, boolean[][]> = {};
    for (const cardId of cardIds) {
      newMarkedCells[cardId] = createEmptyMarkedGrid();
    }
    markedCells = newMarkedCells;
    send({ type: 'selectCards', cardIds });
  }

  function regenerateCards(preserveSelected: boolean = false) {
    send({ type: 'regenerateCards', preserveSelected });
  }

  function markCell(cardId: string, row: number, col: number) {
    // Update locally first for responsiveness
    const marked = markedCells[cardId];
    if (marked) {
      const newMarked = marked.map((r, ri) =>
        r.map((c, ci) => (ri === row && ci === col ? !c : c))
      );
      markedCells = { ...markedCells, [cardId]: newMarked };
    }
    send({ type: 'markCell', cardId, row, col });
  }

  function claimBingo(cardId: string) {
    const marked = markedCells[cardId];
    if (marked) {
      send({ type: 'claimBingo', cardId, markedGrid: marked });
    }
  }

  function toggleAutoMark(enabled: boolean) {
    send({ type: 'toggleAutoMark', enabled });
  }

  function toggleHighlightCalledNumbers(enabled: boolean) {
    send({ type: 'toggleHighlightCalledNumbers', enabled });
  }

  function setReady() {
    send({ type: 'playerReady' });
  }

  // Host actions
  function startGame() {
    send({ type: 'hostStartGame' });
  }

  function callNext() {
    send({ type: 'hostCallNext' });
  }

  function pauseGame() {
    send({ type: 'hostPause' });
  }

  function resumeGame() {
    send({ type: 'hostResume' });
  }

  function resetGame() {
    send({ type: 'hostReset' });
  }

  function setPattern(pattern: Pattern) {
    send({ type: 'hostSetPattern', pattern });
  }

  function setSpeed(intervalMs: number) {
    send({ type: 'hostSetSpeed', intervalMs });
  }

  function toggleAutoCall(enabled: boolean) {
    send({ type: 'hostToggleAutoCall', enabled });
  }

  function toggleAllowHighlight(enabled: boolean) {
    send({ type: 'hostToggleAllowHighlight', enabled });
  }

  function createTimeout(durationSeconds: number) {
    send({ type: 'hostCreateTimeout', durationSeconds });
  }

  function endTimeout() {
    send({ type: 'hostEndTimeout' });
  }

  function kickPlayer(playerId: string) {
    send({ type: 'hostKickPlayer', playerId });
  }

  return {
    // State (getters)
    get gameState() { return gameState; },
    get myPlayerId() { return myPlayerId; },
    get isHost() { return isHost; },
    get connected() { return connected; },
    get isReconnecting() { return isReconnecting; },
    get error() { return error; },
    get kicked() { return kicked; },
    get cardPool() { return cardPool; },
    get selectedCardIds() { return selectedCardIds; },
    get markedCells() { return markedCells; },
    get myPlayer() { return myPlayer; },
    get myCards() { return myCards; },
    get currentPattern() { return currentPattern; },
    get canClaimBingo() { return canClaimBingo; },
    get winningCells() { return winningCells; },
    get allPlayers() { return allPlayers; },
    get onlinePlayers() { return onlinePlayers; },
    get readyPlayers() { return readyPlayers; },

    // Connection
    connect,
    disconnect,

    // Player actions
    joinRoom,
    selectCards,
    regenerateCards,
    markCell,
    claimBingo,
    toggleAutoMark,
    toggleHighlightCalledNumbers,
    setReady,

    // Host actions
    startGame,
    callNext,
    pauseGame,
    resumeGame,
    resetGame,
    setPattern,
    setSpeed,
    toggleAutoCall,
    toggleAllowHighlight,
    createTimeout,
    endTimeout,
    kickPlayer,
  };
}

// Singleton store instance
let gameStore: ReturnType<typeof createGameStore> | null = null;

export function getGameStore() {
  if (!gameStore) {
    gameStore = createGameStore();
  }
  return gameStore;
}
