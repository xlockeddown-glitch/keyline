/**
 * 0.0.99: a value that only shows once it has stopped changing for `ms`. The pocket credit pip uses it:
 * a street pickup settles optimistically on the device, then the server's pocket lands (and can differ:
 * a refused pickup, a market ×2 the server didn't count, credits the server never had), and the pip used to
 * flick 1/3 → none → 1/3. Now it changes once, after the round trip has settled.
 */
export class Calm<T> {
  private timer: ReturnType<typeof setTimeout> | null = null;
  shown: T;
  private ms: number;
  private onShow: (v: T) => void;
  private same: (a: T, b: T) => boolean;
  constructor(first: T, ms: number, onShow: (v: T) => void, same: (a: T, b: T) => boolean = (a, b) => JSON.stringify(a) === JSON.stringify(b)) {
    this.shown = first;
    this.ms = ms;
    this.onShow = onShow;
    this.same = same;
  }
  push(v: T) {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    if (this.same(v, this.shown)) return;
    this.timer = setTimeout(() => {
      this.timer = null;
      this.shown = v;
      this.onShow(v);
    }, this.ms);
  }
  stop() {
    if (this.timer) clearTimeout(this.timer);
  }
}

/** How long the pip waits for the server's pocket before showing a credit change. */
export const CREDIT_CALM_MS = 900;
