export class ScrollingLyrics {
  private readonly viewport = document.createElement("div");
  private readonly track = document.createElement("div");
  private readonly canvas: HTMLCanvasElement;
  private readonly getPulse: () => number;
  private readonly history: { canvas: HTMLCanvasElement; bottom: number }[] = [];
  private frame: number | undefined;
  private active = false;
  private hasCue = false;
  private top = 0;
  private distance = 0;
  private targetOrigin = 0;
  private startPulse = 0;
  private pixelsPerPulse = 0;
  private offset = 0;
  private lastFrame = 0;
  private completedLines = 0;
  private paused = false;
  private endPulse = 0;
  private maximumOffset = 0;

  constructor(canvas: HTMLCanvasElement, getPulse: () => number) {
    this.canvas = canvas;
    this.getPulse = getPulse;
    this.viewport.className = "lyrics-viewport";
    this.track.className = "lyrics-track";
    canvas.before(this.viewport);
    this.viewport.append(this.track);
    this.track.append(canvas);
  }

  retainCue(): void {
    if (!this.active || !this.hasCue) return;
    const snapshot = document.createElement("canvas");
    snapshot.width = this.canvas.width;
    snapshot.height = this.canvas.height;
    snapshot.getContext("2d")?.drawImage(this.canvas, 0, 0);
    snapshot.setAttribute("aria-hidden", "true");
    snapshot.style.top = `${this.top}px`;
    snapshot.style.height = this.canvas.style.height;
    this.track.prepend(snapshot);
    this.history.push({ canvas: snapshot, bottom: this.top + this.distance });
    this.top += this.distance;
    this.hasCue = false;
  }

  startCue(startPulse: number, durationPulses: number, width: number, height: number): void {
    if (!this.active) {
      this.active = true;
      this.viewport.classList.add("is-scrolling");
      this.viewport.style.aspectRatio = `${width} / 600`;
      this.track.style.width = `${width}px`;
      this.track.style.transformOrigin = "top left";
      this.top = 40;
      this.lastFrame = performance.now();
      this.draw(this.lastFrame);
    }
    this.paused = false;
    this.targetOrigin = this.offset;
    this.startPulse = startPulse;
    this.endPulse = startPulse + durationPulses;
    this.distance = height + 40;
    this.maximumOffset = Math.max(this.offset, this.top + height - 560);
    this.updateSpeed();
    this.canvas.style.top = `${this.top}px`;
    this.canvas.style.height = `${height}px`;
    this.canvas.style.visibility = "visible";
    this.hasCue = true;
  }

  completeLine(): void {
    if (!this.active || !this.hasCue) return;
    this.completedLines += 1;
    if (this.completedLines === 2) {
      this.targetOrigin = this.offset;
      this.startPulse = this.getPulse();
      this.updateSpeed();
    }
  }

  private updateSpeed(): void {
    this.pixelsPerPulse = this.paused || this.completedLines < 2 ? 0 :
      Math.max(0, this.maximumOffset - this.targetOrigin) / Math.max(1, this.endPulse - this.startPulse);
  }

  silence(): void {
    this.paused = true;
    this.pixelsPerPulse = 0;
    this.targetOrigin = this.offset;
    this.startPulse = this.getPulse();
  }

  reset(): void {
    if (this.frame !== undefined) cancelAnimationFrame(this.frame);
    this.frame = undefined;
    this.history.forEach(({ canvas }) => { canvas.remove(); });
    this.history.length = 0;
    this.active = false;
    this.hasCue = false;
    this.top = 0;
    this.distance = 0;
    this.targetOrigin = 0;
    this.startPulse = 0;
    this.pixelsPerPulse = 0;
    this.offset = 0;
    this.completedLines = 0;
    this.paused = false;
    this.endPulse = 0;
    this.maximumOffset = 0;
    this.viewport.classList.remove("is-scrolling");
    this.track.removeAttribute("style");
    this.canvas.style.removeProperty("top");
    this.canvas.style.removeProperty("height");
    this.canvas.style.removeProperty("visibility");
  }

  private draw(timestamp: number): void {
    const target = Math.min(this.maximumOffset, this.targetOrigin + Math.max(0, this.getPulse() - this.startPulse) * this.pixelsPerPulse);
    const elapsed = Math.max(0, timestamp - this.lastFrame);
    this.lastFrame = timestamp;
    this.offset += (target - this.offset) * (1 - Math.exp(-elapsed / 100));
    const scale = this.viewport.clientWidth / Number.parseFloat(this.track.style.width);
    this.track.style.transform = `scale(${scale}) translateY(${-this.offset}px)`;
    while (this.history.length > 0 && this.history[0].bottom < this.offset - 600) {
      this.history.shift()?.canvas.remove();
    }
    this.frame = requestAnimationFrame((nextTimestamp) => { this.draw(nextTimestamp); });
  }
}
