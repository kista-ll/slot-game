export class AudioController {
  private current: HTMLAudioElement | null = null;

  play(src: string) {
    this.stop();
    const audio = new Audio(src);
    audio.volume = 1.0;
    audio.play().catch(() => {});
    this.current = audio;
  }

  stop() {
    if (this.current) {
      this.current.pause();
      this.current.currentTime = 0;
      this.current = null;
    }
  }
}
