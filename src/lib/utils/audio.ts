// Audio utility for playing sounds
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

// Play a pleasant chime sound when a number is called
export function playNumberCalledSound(): void {
  try {
    const ctx = getAudioContext();

    // Resume audio context if it's suspended (browser autoplay policy)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;

    // Create oscillator for the chime
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Configure the tone - a pleasant bell-like sound
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, now); // A5 note
    oscillator.frequency.exponentialRampToValueAtTime(1760, now + 0.05); // Quick slide up
    oscillator.frequency.exponentialRampToValueAtTime(880, now + 0.1); // Back down

    // Configure envelope - quick attack, medium decay
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01); // Quick attack
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5); // Decay

    // Play the sound
    oscillator.start(now);
    oscillator.stop(now + 0.5);

    // Cleanup
    oscillator.onended = () => {
      oscillator.disconnect();
      gainNode.disconnect();
    };
  } catch (error) {
    // Silently fail if audio is not supported
    console.warn('Audio playback failed:', error);
  }
}

// Play a special sound for BINGO! claim
export function playBingoSound(): void {
  try {
    const ctx = getAudioContext();

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;

    // Play a short melody for BINGO!
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

    notes.forEach((freq, index) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, now + index * 0.15);

      gainNode.gain.setValueAtTime(0, now + index * 0.15);
      gainNode.gain.linearRampToValueAtTime(0.25, now + index * 0.15 + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + index * 0.15 + 0.3);

      oscillator.start(now + index * 0.15);
      oscillator.stop(now + index * 0.15 + 0.3);

      oscillator.onended = () => {
        oscillator.disconnect();
        gainNode.disconnect();
      };
    });
  } catch (error) {
    console.warn('Audio playback failed:', error);
  }
}

// Play an alert sound when the pattern changes
export function playPatternChangedSound(): void {
  try {
    const ctx = getAudioContext();

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;

    // Play two-tone alert sound (attention-grabbing but not alarming)
    const notes = [587.33, 880]; // D5, A5 - ascending attention sound

    notes.forEach((freq, index) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = 'triangle'; // Softer than sine, more noticeable
      oscillator.frequency.setValueAtTime(freq, now + index * 0.12);

      gainNode.gain.setValueAtTime(0, now + index * 0.12);
      gainNode.gain.linearRampToValueAtTime(0.35, now + index * 0.12 + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + index * 0.12 + 0.25);

      oscillator.start(now + index * 0.12);
      oscillator.stop(now + index * 0.12 + 0.25);

      oscillator.onended = () => {
        oscillator.disconnect();
        gainNode.disconnect();
      };
    });
  } catch (error) {
    console.warn('Audio playback failed:', error);
  }
}
