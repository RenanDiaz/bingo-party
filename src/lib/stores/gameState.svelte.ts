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
  function connect(roomId: string) {
    if (!browser) return;

    const host = import.meta.env.VITE_PARTYKIT_HOST;

    // Check if PartyKit host is configured for production
    if (!host) {
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      if (!isLocalhost) {
        error = 'Game server not configured. Please set VITE_PARTYKIT_HOST.';
        return;
      }
    }

    const partyHost = host || 'localhost:1999';
    const protocol = partyHost.includes('localhost') ? 'ws' : 'wss';
    const url = `${protocol}://${partyHost}/parties/main/${roomId}`;

    // Set connection timeout (10 seconds)
    connectionTimeout = setTimeout(() => {
      if (!connected) {
        error = 'Connection timeout. Please check your internet connection.';
        if (socket) {
          socket.close();
          socket = null;
        }
      }
    }, 10000);

    try {
      socket = new WebSocket(url);
    } catch (e) {
      error = 'Failed to connect to game server.';
      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
        connectionTimeout = null;
      }
      return;
    }

    socket.onopen = () => {
      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
        connectionTimeout = null;
      }
      connected = true;
      error = null;
    };

    socket.onclose = () => {
      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
        connectionTimeout = null;
      }
      connected = false;
    };

    socket.onerror = () => {
      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
        connectionTimeout = null;
      }
      error = 'Connection failed. Game server may be unavailable.';
      connected = false;
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

  // Disconnect from server
  function disconnect() {
    if (connectionTimeout) {
      clearTimeout(connectionTimeout);
      connectionTimeout = null;
    }
    if (socket) {
      socket.close();
      socket = null;
    }
    connected = false;
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
          // Sync our own state from server
          if (message.player.id === myPlayerId) {
            markedCells = { ...message.player.markedCells };
            selectedCardIds = [...message.player.selectedCardIds];
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
