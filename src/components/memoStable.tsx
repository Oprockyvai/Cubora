import React, { useRef } from 'react';

type PropBag = Record<string, unknown>;
type Callable = (...args: unknown[]) => unknown;

/**
 * Wraps a component so it only re-renders when its *data* props change.
 *
 * App owns a lot of state (a per-second clock tick, life timer, ...) and passes inline
 * arrow functions to every screen. Without this, each tick re-rendered the whole tree,
 * including the huge Level Map SVG, causing periodic frame drops.
 *
 * - Function props are replaced by identity-stable proxies that always call the latest
 *   function, so memoization never causes stale closures.
 * - `isHidden` (optional) lets an off-screen screen skip renders until it is shown again.
 */
export function memoStable<P extends object>(
  Component: React.ComponentType<P>,
  isHidden?: (props: P) => boolean
): React.FC<P> {
  const Inner = React.memo(Component, (prev, next) => {
    if (isHidden && isHidden(prev as unknown as P) && isHidden(next as unknown as P)) return true;
    const a = prev as unknown as PropBag;
    const b = next as unknown as PropBag;
    const keys = Object.keys(a);
    if (keys.length !== Object.keys(b).length) return false;
    for (const key of keys) {
      if (!Object.is(a[key], b[key])) return false;
    }
    return true;
  });

  const Wrapper: React.FC<P> = (props) => {
    const latest = useRef<PropBag>(props as unknown as PropBag);
    latest.current = props as unknown as PropBag;
    const proxies = useRef<Record<string, Callable>>({});

    const stable: PropBag = {};
    for (const key of Object.keys(props)) {
      const value = (props as unknown as PropBag)[key];
      if (typeof value === 'function') {
        if (!proxies.current[key]) {
          proxies.current[key] = (...args: unknown[]) =>
            (latest.current[key] as Callable)(...args);
        }
        stable[key] = proxies.current[key];
      } else {
        stable[key] = value;
      }
    }
    return React.createElement(Inner as unknown as React.ComponentType<PropBag>, stable);
  };
  Wrapper.displayName = `memoStable(${Component.displayName || Component.name || 'Component'})`;
  return Wrapper;
}
