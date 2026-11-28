import { useSyncExternalStore } from 'react';

/**
 * Bridge to the native ad layer (Flutter shell: AdMob + Unity Ads via mediation).
 *
 *  JS -> native : CuboraBridge.postMessage('ad:query' | 'ad:rewarded:<id>' | 'ad:interstitial')
 *  native -> JS : window.__cuboraAdState(rewardedReady, interstitialReady)
 *                 window.__cuboraAdResult(id, 'rewarded' | 'closed' | 'failed')
 *
 * Outside the native shell (browser / dev server) there is no channel: every ad is
 * "not ready", so ad buttons stay hidden and the game works exactly as before.
 */

export type AdOutcome = 'rewarded' | 'closed' | 'failed';

export interface AdState {
  readonly rewarded: boolean;
  readonly interstitial: boolean;
}

interface NativeChannel {
  postMessage(message: string): void;
}

type AdWindow = Window & {
  CuboraBridge?: NativeChannel;
  __cuboraAdState?: (rewarded: boolean, interstitial: boolean) => void;
  __cuboraAdResult?: (id: string, outcome: string) => void;
};

const REWARD_TIMEOUT_MS = 10 * 60 * 1000;

export const AD_GEMS_REWARD = 5;
export const AD_GEMS_DAILY_CAP = 5;
const AD_GEMS_STORAGE_KEY = 'cubora.adGems';

const NO_ADS: AdState = { rewarded: false, interstitial: false };
let state: AdState = NO_ADS;
const listeners = new Set<() => void>();
const pending = new Map<string, (outcome: AdOutcome) => void>();
let seq = 0;

function channel(): NativeChannel | null {
  const c = (window as AdWindow).CuboraBridge;
  return c && typeof c.postMessage === 'function' ? c : null;
}

function setState(next: AdState): void {
  if (next.rewarded === state.rewarded && next.interstitial === state.interstitial) return;
  state = next;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): AdState {
  return state;
}

/** Live availability of ad formats (always "not ready" outside the native shell). */
export function useAdState(): AdState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

function toOutcome(value: string): AdOutcome {
  return value === 'rewarded' || value === 'closed' ? value : 'failed';
}

/** Installs the native -> JS callbacks and asks the shell for the current state. */
export function installAdsBridge(): () => void {
  const win = window as AdWindow;
  win.__cuboraAdState = (rewarded, interstitial) => {
    setState({ rewarded: rewarded === true, interstitial: interstitial === true });
  };
  win.__cuboraAdResult = (id, outcome) => {
    const resolve = pending.get(id);
    if (!resolve) return;
    pending.delete(id);
    resolve(toOutcome(outcome));
  };
  channel()?.postMessage('ad:query');
  return () => {
    delete win.__cuboraAdState;
    delete win.__cuboraAdResult;
  };
}

/** Shows a rewarded ad. Resolves `'rewarded'` only if the user earned the reward. */
export function requestRewardedAd(): Promise<AdOutcome> {
  const native = channel();
  if (!native || !state.rewarded || pending.size > 0) return Promise.resolve('failed');
  seq += 1;
  const id = `r${seq}`;
  return new Promise<AdOutcome>((resolve) => {
    const timer = window.setTimeout(() => {
      if (pending.delete(id)) resolve('failed');
    }, REWARD_TIMEOUT_MS);
    pending.set(id, (outcome) => {
      window.clearTimeout(timer);
      resolve(outcome);
    });
    native.postMessage(`ad:rewarded:${id}`);
  });
}

/** Game-over opportunity; the native side decides (frequency cap) whether to show anything. */
export function notifyGameOverForInterstitial(): void {
  if (!state.interstitial) return;
  channel()?.postMessage('ad:interstitial');
}

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function readAdGemsUsed(): number {
  try {
    const raw = window.localStorage.getItem(AD_GEMS_STORAGE_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as { day?: string; used?: number };
    return parsed.day === todayKey() && typeof parsed.used === 'number' ? parsed.used : 0;
  } catch {
    return 0;
  }
}

/** How many "watch an ad for gems" rewards are still available today. */
export function adGemsLeftToday(): number {
  return Math.max(0, AD_GEMS_DAILY_CAP - readAdGemsUsed());
}

/** Records one earned "ad for gems" reward against today's cap. */
export function consumeAdGemsToday(): void {
  try {
    window.localStorage.setItem(
      AD_GEMS_STORAGE_KEY,
      JSON.stringify({ day: todayKey(), used: readAdGemsUsed() + 1 })
    );
  } catch {
    // Storage unavailable: the cap just won't persist across launches.
  }
}
