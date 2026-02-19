/**
 * Centralized timer registry that prevents leaks by tracking all active
 * timers with named keys. Supports both setTimeout and setInterval, and
 * provides clearAll() for clean teardown.
 */
export class TimerRegistry {
  private timers = new Map<
    string,
    { ref: ReturnType<typeof setTimeout>; type: "timeout" | "interval" }
  >();

  setTimeout(name: string, fn: () => void, ms: number): void {
    this.clear(name);
    const ref = setTimeout(() => {
      this.timers.delete(name);
      fn();
    }, ms);
    this.timers.set(name, { ref, type: "timeout" });
  }

  setInterval(name: string, fn: () => void, ms: number): void {
    this.clear(name);
    const ref = setInterval(fn, ms);
    this.timers.set(name, { ref, type: "interval" });
  }

  clear(name: string): void {
    const entry = this.timers.get(name);
    if (!entry) return;
    if (entry.type === "timeout") {
      clearTimeout(entry.ref);
    } else {
      clearInterval(entry.ref);
    }
    this.timers.delete(name);
  }

  has(name: string): boolean {
    return this.timers.has(name);
  }

  clearAll(): void {
    for (const [, entry] of this.timers) {
      if (entry.type === "timeout") {
        clearTimeout(entry.ref);
      } else {
        clearInterval(entry.ref);
      }
    }
    this.timers.clear();
  }
}
