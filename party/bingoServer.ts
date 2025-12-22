import type * as Party from 'partykit/server';
import type {
  BingoGameState,
  BingoPlayer,
  ClientMessage,
  ServerMessage,
  Pattern,
} from '../shared/types';
import {
  createInitialState,
  createPlayer,
  addPlayer,
  removePlayer,
  updatePlayerConnection,
  selectCards,
  regenerateCards,
  markCell,
  toggleAutoMark,
  callNextNumber,
  validateBingoClaim,
  addWinner,
  startGame,
  pauseGame,
  resumeGame,
  resetGame,
  startTimeout,
  endTimeout,
  updateSettings,
  updatePattern,
} from './gameEngine';

export default class BingoServer implements Party.Server {
  state: BingoGameState | null = null;
  connections: Map<string, Party.Connection> = new Map();
  autoCallInterval: ReturnType<typeof setInterval> | null = null;
  timeoutTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(readonly room: Party.Room) {}

  // Initialize state on first connection
  private ensureState(): BingoGameState {
    if (!this.state) {
      // Use the first connection as host
      this.state = createInitialState(this.room.id, '');
    }
    return this.state;
  }

  // Broadcast message to all connections
  private broadcast(message: ServerMessage, exclude?: string) {
    const data = JSON.stringify(message);
    for (const [id, conn] of this.connections) {
      if (id !== exclude) {
        conn.send(data);
      }
    }
  }

  // Send message to a specific connection
  private sendTo(connectionId: string, message: ServerMessage) {
    const conn = this.connections.get(connectionId);
    if (conn) {
      conn.send(JSON.stringify(message));
    }
  }

  // Start auto-call timer
  private startAutoCall() {
    this.stopAutoCall();

    if (!this.state || !this.state.settings.autoCall) return;
    if (this.state.phase !== 'playing') return;

    this.autoCallInterval = setInterval(() => {
      if (!this.state || this.state.phase !== 'playing') {
        this.stopAutoCall();
        return;
      }

      this.state = callNextNumber(this.state);

      if (this.state.callHistory.length > 0) {
        const lastCall = this.state.callHistory[this.state.callHistory.length - 1];
        this.broadcast({
          type: 'numberCalled',
          call: lastCall,
          state: this.state,
        });
      }

      // Stop if no more numbers
      if (this.state.remainingNumbers.length === 0) {
        this.stopAutoCall();
      }
    }, this.state.settings.callInterval);
  }

  // Stop auto-call timer
  private stopAutoCall() {
    if (this.autoCallInterval) {
      clearInterval(this.autoCallInterval);
      this.autoCallInterval = null;
    }
  }

  // Start timeout timer
  private startTimeoutTimer(durationSeconds: number) {
    this.stopTimeoutTimer();

    this.timeoutTimer = setTimeout(() => {
      if (this.state && this.state.phase === 'timeout') {
        this.state = endTimeout(this.state);
        this.broadcast({ type: 'timeoutEnded' });
        this.broadcast({ type: 'gameState', state: this.state });

        if (this.state.settings.autoCall) {
          this.startAutoCall();
        }
      }
    }, durationSeconds * 1000);
  }

  // Stop timeout timer
  private stopTimeoutTimer() {
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    }
  }

  // Handle new connection
  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    const state = this.ensureState();
    this.connections.set(conn.id, conn);

    // Determine if this is the host
    const isHost = Object.keys(state.players).length === 0 || !state.hostId;

    if (isHost && !state.hostId) {
      this.state = { ...state, hostId: conn.id };
    }

    // Send init message (player will join with name later)
    this.sendTo(conn.id, {
      type: 'init',
      playerId: conn.id,
      isHost: isHost || state.hostId === conn.id,
      state: this.state!,
    });
  }

  // Handle disconnect
  onClose(conn: Party.Connection) {
    this.connections.delete(conn.id);

    if (this.state && this.state.players[conn.id]) {
      this.state = updatePlayerConnection(this.state, conn.id, false);
      this.broadcast({
        type: 'playerLeft',
        playerId: conn.id,
      });
    }
  }

  // Handle messages
  onMessage(message: string, sender: Party.Connection) {
    if (!this.state) return;

    let data: ClientMessage;
    try {
      data = JSON.parse(message);
    } catch {
      this.sendTo(sender.id, { type: 'error', message: 'Invalid message format' });
      return;
    }

    switch (data.type) {
      case 'joinRoom':
        this.handleJoinRoom(sender.id, data.playerName);
        break;

      case 'selectCards':
        this.handleSelectCards(sender.id, data.cardIds);
        break;

      case 'regenerateCards':
        this.handleRegenerateCards(sender.id);
        break;

      case 'markCell':
        this.handleMarkCell(sender.id, data.cardId, data.row, data.col);
        break;

      case 'claimBingo':
        this.handleClaimBingo(sender.id, data.cardId, data.markedGrid);
        break;

      case 'toggleAutoMark':
        this.handleToggleAutoMark(sender.id, data.enabled);
        break;

      case 'playerReady':
        this.handlePlayerReady(sender.id);
        break;

      case 'hostStartGame':
        this.handleHostStartGame(sender.id);
        break;

      case 'hostCallNext':
        this.handleHostCallNext(sender.id);
        break;

      case 'hostPause':
        this.handleHostPause(sender.id);
        break;

      case 'hostResume':
        this.handleHostResume(sender.id);
        break;

      case 'hostReset':
        this.handleHostReset(sender.id);
        break;

      case 'hostSetPattern':
        this.handleHostSetPattern(sender.id, data.pattern);
        break;

      case 'hostSetSpeed':
        this.handleHostSetSpeed(sender.id, data.intervalMs);
        break;

      case 'hostToggleAutoCall':
        this.handleHostToggleAutoCall(sender.id, data.enabled);
        break;

      case 'hostCreateTimeout':
        this.handleHostCreateTimeout(sender.id, data.durationSeconds);
        break;

      case 'hostEndTimeout':
        this.handleHostEndTimeout(sender.id);
        break;

      case 'hostKickPlayer':
        this.handleHostKickPlayer(sender.id, data.playerId);
        break;

      default:
        this.sendTo(sender.id, { type: 'error', message: 'Unknown message type' });
    }
  }

  // Check if sender is host
  private isHost(senderId: string): boolean {
    return this.state?.hostId === senderId;
  }

  // Handle join room
  private handleJoinRoom(senderId: string, playerName: string) {
    if (!this.state) return;

    // Check if player already exists (reconnect)
    if (this.state.players[senderId]) {
      this.state = updatePlayerConnection(this.state, senderId, true);
      this.broadcast({ type: 'gameState', state: this.state });
      return;
    }

    const isHost = !this.state.hostId || this.state.hostId === senderId;
    const player = createPlayer(senderId, playerName, isHost);

    if (isHost) {
      this.state = { ...this.state, hostId: senderId };
    }

    this.state = addPlayer(this.state, player);

    // Send card pool to the new player
    this.sendTo(senderId, { type: 'cardPool', cards: player.cards });

    // Broadcast player joined
    this.broadcast({ type: 'playerJoined', player }, senderId);

    // Send full state to the new player
    this.sendTo(senderId, { type: 'gameState', state: this.state });
  }

  // Handle card selection
  private handleSelectCards(senderId: string, cardIds: string[]) {
    if (!this.state) return;

    this.state = selectCards(this.state, senderId, cardIds);

    const player = this.state.players[senderId];
    if (player) {
      this.broadcast({ type: 'playerUpdated', player });
    }
  }

  // Handle regenerate cards
  private handleRegenerateCards(senderId: string) {
    if (!this.state) return;

    // Only allow in lobby or timeout
    if (this.state.phase !== 'lobby' && this.state.phase !== 'timeout') {
      this.sendTo(senderId, { type: 'error', message: 'Cannot regenerate cards now' });
      return;
    }

    this.state = regenerateCards(this.state, senderId);

    const player = this.state.players[senderId];
    if (player) {
      this.sendTo(senderId, { type: 'cardPool', cards: player.cards });
      this.broadcast({ type: 'playerUpdated', player });
    }
  }

  // Handle mark cell
  private handleMarkCell(senderId: string, cardId: string, row: number, col: number) {
    if (!this.state) return;

    if (this.state.phase !== 'playing') {
      return; // Silently ignore if not playing
    }

    this.state = markCell(this.state, senderId, cardId, row, col);

    const player = this.state.players[senderId];
    if (player) {
      this.broadcast({ type: 'playerUpdated', player });
    }
  }

  // Handle bingo claim
  private handleClaimBingo(senderId: string, cardId: string, markedGrid: boolean[][]) {
    if (!this.state) return;

    if (this.state.phase !== 'playing') {
      this.sendTo(senderId, { type: 'error', message: 'Game not in progress' });
      return;
    }

    const validation = validateBingoClaim(this.state, senderId, cardId, markedGrid);

    if (!validation.valid) {
      this.broadcast({
        type: 'bingoInvalid',
        playerId: senderId,
        reason: validation.reason || 'Invalid bingo',
      });
      return;
    }

    this.state = addWinner(this.state, senderId, cardId, markedGrid);

    const winner = this.state.winners[this.state.winners.length - 1];
    this.broadcast({ type: 'bingoValidated', winner });

    // If game ended, stop timers
    if (this.state.phase === 'finished') {
      this.stopAutoCall();
    }

    this.broadcast({ type: 'gameState', state: this.state });
  }

  // Handle toggle auto mark
  private handleToggleAutoMark(senderId: string, enabled: boolean) {
    if (!this.state) return;

    this.state = toggleAutoMark(this.state, senderId, enabled);

    const player = this.state.players[senderId];
    if (player) {
      this.broadcast({ type: 'playerUpdated', player });
    }
  }

  // Handle player ready
  private handlePlayerReady(senderId: string) {
    if (!this.state) return;

    const player = this.state.players[senderId];
    if (player && player.selectedCardIds.length > 0) {
      this.state = {
        ...this.state,
        players: {
          ...this.state.players,
          [senderId]: {
            ...player,
            readyToPlay: true,
          },
        },
      };

      this.broadcast({ type: 'playerUpdated', player: this.state.players[senderId] });
    }
  }

  // Host: Start game
  private handleHostStartGame(senderId: string) {
    if (!this.isHost(senderId)) {
      this.sendTo(senderId, { type: 'error', message: 'Not authorized' });
      return;
    }

    if (!this.state || this.state.phase !== 'lobby') {
      this.sendTo(senderId, { type: 'error', message: 'Game already started' });
      return;
    }

    // Check if any players have selected cards
    const playersWithCards = Object.values(this.state.players).filter(
      p => p.selectedCardIds.length > 0
    );

    if (playersWithCards.length === 0) {
      this.sendTo(senderId, { type: 'error', message: 'No players ready' });
      return;
    }

    this.state = startGame(this.state);
    this.broadcast({ type: 'gameStarted', state: this.state });

    if (this.state.settings.autoCall) {
      this.startAutoCall();
    }
  }

  // Host: Call next number
  private handleHostCallNext(senderId: string) {
    if (!this.isHost(senderId)) {
      this.sendTo(senderId, { type: 'error', message: 'Not authorized' });
      return;
    }

    if (!this.state || this.state.phase !== 'playing') {
      return;
    }

    if (this.state.remainingNumbers.length === 0) {
      this.sendTo(senderId, { type: 'error', message: 'No more numbers' });
      return;
    }

    this.state = callNextNumber(this.state);

    const lastCall = this.state.callHistory[this.state.callHistory.length - 1];
    this.broadcast({ type: 'numberCalled', call: lastCall, state: this.state });
  }

  // Host: Pause game
  private handleHostPause(senderId: string) {
    if (!this.isHost(senderId)) {
      this.sendTo(senderId, { type: 'error', message: 'Not authorized' });
      return;
    }

    if (!this.state || this.state.phase !== 'playing') {
      return;
    }

    this.stopAutoCall();
    this.state = pauseGame(this.state);
    this.broadcast({ type: 'gamePaused' });
    this.broadcast({ type: 'gameState', state: this.state });
  }

  // Host: Resume game
  private handleHostResume(senderId: string) {
    if (!this.isHost(senderId)) {
      this.sendTo(senderId, { type: 'error', message: 'Not authorized' });
      return;
    }

    if (!this.state || this.state.phase !== 'paused') {
      return;
    }

    this.state = resumeGame(this.state);
    this.broadcast({ type: 'gameResumed', state: this.state });

    if (this.state.settings.autoCall) {
      this.startAutoCall();
    }
  }

  // Host: Reset game
  private handleHostReset(senderId: string) {
    if (!this.isHost(senderId)) {
      this.sendTo(senderId, { type: 'error', message: 'Not authorized' });
      return;
    }

    if (!this.state) return;

    this.stopAutoCall();
    this.stopTimeoutTimer();

    this.state = resetGame(this.state);

    // Send new card pools to all players
    for (const [playerId, player] of Object.entries(this.state.players)) {
      this.sendTo(playerId, { type: 'cardPool', cards: player.cards });
    }

    this.broadcast({ type: 'gameReset', state: this.state });
  }

  // Host: Set pattern
  private handleHostSetPattern(senderId: string, pattern: Pattern) {
    if (!this.isHost(senderId)) {
      this.sendTo(senderId, { type: 'error', message: 'Not authorized' });
      return;
    }

    if (!this.state) return;

    this.state = updatePattern(this.state, pattern);
    this.broadcast({ type: 'gameState', state: this.state });
  }

  // Host: Set speed
  private handleHostSetSpeed(senderId: string, intervalMs: number) {
    if (!this.isHost(senderId)) {
      this.sendTo(senderId, { type: 'error', message: 'Not authorized' });
      return;
    }

    if (!this.state) return;

    // Clamp to valid range
    const clampedInterval = Math.max(2000, Math.min(10000, intervalMs));

    this.state = updateSettings(this.state, { callInterval: clampedInterval });
    this.broadcast({ type: 'gameState', state: this.state });

    // Restart auto-call with new interval
    if (this.state.settings.autoCall && this.state.phase === 'playing') {
      this.startAutoCall();
    }
  }

  // Host: Toggle auto call
  private handleHostToggleAutoCall(senderId: string, enabled: boolean) {
    if (!this.isHost(senderId)) {
      this.sendTo(senderId, { type: 'error', message: 'Not authorized' });
      return;
    }

    if (!this.state) return;

    this.state = updateSettings(this.state, { autoCall: enabled });
    this.broadcast({ type: 'gameState', state: this.state });

    if (enabled && this.state.phase === 'playing') {
      this.startAutoCall();
    } else {
      this.stopAutoCall();
    }
  }

  // Host: Create timeout
  private handleHostCreateTimeout(senderId: string, durationSeconds: number) {
    if (!this.isHost(senderId)) {
      this.sendTo(senderId, { type: 'error', message: 'Not authorized' });
      return;
    }

    if (!this.state || this.state.phase !== 'playing') {
      return;
    }

    this.stopAutoCall();
    this.state = startTimeout(this.state, durationSeconds);

    this.broadcast({
      type: 'timeoutStarted',
      endTime: this.state.timeoutEndTime!,
    });
    this.broadcast({ type: 'gameState', state: this.state });

    this.startTimeoutTimer(durationSeconds);
  }

  // Host: End timeout early
  private handleHostEndTimeout(senderId: string) {
    if (!this.isHost(senderId)) {
      this.sendTo(senderId, { type: 'error', message: 'Not authorized' });
      return;
    }

    if (!this.state || this.state.phase !== 'timeout') {
      return;
    }

    this.stopTimeoutTimer();
    this.state = endTimeout(this.state);

    this.broadcast({ type: 'timeoutEnded' });
    this.broadcast({ type: 'gameState', state: this.state });

    if (this.state.settings.autoCall) {
      this.startAutoCall();
    }
  }

  // Host: Kick player
  private handleHostKickPlayer(senderId: string, playerId: string) {
    if (!this.isHost(senderId)) {
      this.sendTo(senderId, { type: 'error', message: 'Not authorized' });
      return;
    }

    if (!this.state) return;

    // Can't kick yourself
    if (playerId === senderId) {
      this.sendTo(senderId, { type: 'error', message: 'Cannot kick yourself' });
      return;
    }

    // Send kicked message to player
    this.sendTo(playerId, { type: 'kicked' });

    // Close their connection
    const conn = this.connections.get(playerId);
    if (conn) {
      conn.close();
    }

    // Remove from state
    this.state = removePlayer(this.state, playerId);
    this.connections.delete(playerId);

    this.broadcast({ type: 'playerLeft', playerId });
    this.broadcast({ type: 'gameState', state: this.state });
  }
}
