import { useCallback, useEffect, useRef, useState } from 'react';

/** Honours both the OS setting and the in-app override written to the root element. */
export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const [override, setOverride] = useState(
    () => typeof document !== 'undefined' && document.documentElement.dataset.motion === 'reduced',
  );

  useEffect(() => {
    const observer = new MutationObserver(() =>
      setOverride(document.documentElement.dataset.motion === 'reduced'),
    );
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-motion'] });
    return () => observer.disconnect();
  }, []);

  return reduced || override;
}

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(query).matches,
  );

  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    setMatches(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

/** Counts a value up on mount. Jumps straight to the target when motion is reduced. */
export function useCountUp(target: number, duration = 1100, decimals = 0) {
  const reduced = usePrefersReducedMotion();
  const [value, setValue] = useState(reduced ? target : 0);
  const frame = useRef(0);

  useEffect(() => {
    // A hidden tab throttles requestAnimationFrame, which used to leave every
    // figure sitting at zero until the tab was focused. Snap instead.
    if (reduced || document.visibilityState === 'hidden') {
      setValue(target);
      return;
    }
    const start = performance.now();
    const from = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(from + (target - from) * eased);
      if (t < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [target, duration, reduced]);

  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/** Delays a value until the element has been on screen once. Used to time chart reveals. */
export function useInView<T extends Element>(options?: IntersectionObserverInit) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || inView) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) setInView(true);
    }, options ?? { rootMargin: '-40px' });
    observer.observe(node);
    return () => observer.disconnect();
  }, [inView, options]);

  return [ref, inView] as const;
}

export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(key);
      return raw === null ? initial : (JSON.parse(raw) as T);
    } catch {
      return initial;
    }
  });

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
        try {
          window.localStorage.setItem(key, JSON.stringify(resolved));
        } catch {
          /* private mode, quota, or blocked site data — the UI still works */
        }
        return resolved;
      });
    },
    [key],
  );

  return [value, set] as const;
}

/** Simulates the latency of a real data fetch so skeletons are exercised, once per key. */
export function useDeferredReady(key: string, delay = 480) {
  const [ready, setReady] = useState(() => seen.has(key));

  useEffect(() => {
    if (seen.has(key)) {
      setReady(true);
      return;
    }
    const id = window.setTimeout(() => {
      seen.add(key);
      setReady(true);
    }, delay);
    return () => window.clearTimeout(id);
  }, [key, delay]);

  return ready;
}

const seen = new Set<string>();

export function useDocumentMeta(title: string, description?: string) {
  useEffect(() => {
    document.title = title;
    if (!description) return;
    let tag = document.querySelector('meta[name="description"]');
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute('name', 'description');
      document.head.appendChild(tag);
    }
    tag.setAttribute('content', description);
  }, [title, description]);
}

export function useEscapeKey(onEscape: () => void, active = true) {
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onEscape();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onEscape, active]);
}
