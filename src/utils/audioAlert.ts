// Web Audio API siren synthesizer & Web Speech TTS voice announcement

class AudioAlertSystem {
  private audioCtx: AudioContext | null = null;
  private oscillator1: OscillatorNode | null = null;
  private oscillator2: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private isSirenPlaying = false;
  private isMuted = false;

  private initAudio() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && this.isSirenPlaying) {
      this.stopSiren();
    }
    if (muted && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public getIsSirenPlaying(): boolean {
    return this.isSirenPlaying;
  }

  // Play standard civil defense / flood evacuation siren warble
  public startSiren() {
    if (this.isMuted) return;
    try {
      this.initAudio();
      if (!this.audioCtx) return;

      if (this.isSirenPlaying) return;

      this.gainNode = this.audioCtx.createGain();
      this.gainNode.gain.setValueAtTime(0.12, this.audioCtx.currentTime);
      this.gainNode.connect(this.audioCtx.destination);

      this.oscillator1 = this.audioCtx.createOscillator();
      this.oscillator1.type = 'sawtooth';
      this.oscillator1.frequency.setValueAtTime(480, this.audioCtx.currentTime);

      // Low frequency oscillator to modulate the warble
      const lfo = this.audioCtx.createOscillator();
      lfo.frequency.setValueAtTime(0.5, this.audioCtx.currentTime); // 0.5 Hz warble
      const lfoGain = this.audioCtx.createGain();
      lfoGain.gain.setValueAtTime(280, this.audioCtx.currentTime);

      lfo.connect(this.oscillator1.frequency);
      this.oscillator1.connect(this.gainNode);

      this.oscillator1.start();
      lfo.start();
      this.isSirenPlaying = true;
    } catch (e) {
      console.warn('AudioContext not allowed or failed:', e);
    }
  }

  public stopSiren() {
    try {
      if (this.oscillator1) {
        this.oscillator1.stop();
        this.oscillator1.disconnect();
        this.oscillator1 = null;
      }
      if (this.gainNode) {
        this.gainNode.disconnect();
        this.gainNode = null;
      }
      this.isSirenPlaying = false;
    } catch (e) {
      console.warn('Error stopping siren:', e);
    }
  }

  // Automated Voice Announcement using standard browser SpeechSynthesis
  public playVoiceAnnouncement(text: string, onEnd?: () => void) {
    if (this.isMuted) return;
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.05;
    utterance.volume = 1.0;

    // Pick an authoritative English voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('David')));
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    if (onEnd) {
      utterance.onend = onEnd;
    }

    window.speechSynthesis.speak(utterance);
  }

  public stopVoiceAnnouncement() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

export const audioAlertSystem = new AudioAlertSystem();
