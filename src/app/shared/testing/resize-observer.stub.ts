/**
 * jsdom ships no `ResizeObserver`, so any spec that mounts a component relying on one needs it
 * installed before that component's constructor runs. Shared across features -- originally lived
 * under gm-screen's masonry grid, promoted here once EntityCard needed the same stub and shared
 * code must not import from `features/`.
 */

export interface StubbedResizeObserver {
  readonly observed: Set<Element>;
  disconnected: boolean;
  /** Invokes this instance's callback as if the observed elements had resized. */
  fire(): void;
}

export interface ResizeObserverStubHandle {
  readonly instances: readonly StubbedResizeObserver[];
  /** Fires every instance that has not been disconnected. */
  triggerAll(): void;
  restore(): void;
}

export function installResizeObserverStub(): ResizeObserverStubHandle {
  const instances: StubbedResizeObserver[] = [];
  const global = globalThis as unknown as Record<string, unknown>;
  const had = 'ResizeObserver' in global;
  const previous = global['ResizeObserver'];

  class ResizeObserverStub implements StubbedResizeObserver {
    readonly observed = new Set<Element>();
    disconnected = false;

    constructor(private readonly callback: ResizeObserverCallback) {
      instances.push(this);
    }

    observe(target: Element): void {
      this.observed.add(target);
    }

    unobserve(target: Element): void {
      this.observed.delete(target);
    }

    disconnect(): void {
      this.disconnected = true;
      this.observed.clear();
    }

    fire(): void {
      this.callback([], this as unknown as ResizeObserver);
    }
  }

  global['ResizeObserver'] = ResizeObserverStub;

  return {
    instances,
    triggerAll(): void {
      for (const instance of instances) {
        if (!instance.disconnected) instance.fire();
      }
    },
    restore(): void {
      if (had) global['ResizeObserver'] = previous;
      else delete global['ResizeObserver'];
      instances.length = 0;
    },
  };
}
