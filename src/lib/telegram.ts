/**
 * Thin wrapper around the official Telegram Web App SDK (telegram-web-app.js).
 * Everything degrades gracefully in a normal browser (development mode).
 */

interface TgBackButton {
  show(): void;
  hide(): void;
  onClick(cb: () => void): void;
  offClick(cb: () => void): void;
}
interface TgHaptic {
  impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void;
  notificationOccurred(type: 'error' | 'success' | 'warning'): void;
  selectionChanged(): void;
}
interface TgWebApp {
  initData: string;
  initDataUnsafe: { user?: { id: number; first_name?: string; language_code?: string }; start_param?: string };
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  isVersionAtLeast(v: string): boolean;
  ready(): void;
  expand(): void;
  close(): void;
  disableVerticalSwipes?(): void;
  setHeaderColor(color: string): void;
  setBackgroundColor(color: string): void;
  setBottomBarColor?(color: string): void;
  showConfirm?(message: string, cb: (ok: boolean) => void): void;
  BackButton: TgBackButton;
  SettingsButton?: TgBackButton;
  HapticFeedback: TgHaptic;
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TgWebApp };
  }
}

const tg: TgWebApp | undefined = typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined;

/** True only when actually launched by Telegram (initData is present). */
export const inTelegram = Boolean(tg && tg.initData);

const atLeast = (v: string) => Boolean(inTelegram && tg?.isVersionAtLeast?.(v));

export const telegram = {
  initData: inTelegram ? tg!.initData : '',
  /** Display-only. The server validates initData before trusting any identity. */
  unsafeUser: inTelegram ? tg!.initDataUnsafe.user : undefined,
  startParam: inTelegram ? tg!.initDataUnsafe.start_param : undefined,
  platform: inTelegram ? tg!.platform : 'browser',

  init() {
    if (!inTelegram) return;
    tg!.ready();
    tg!.expand();
    // Dragging the graph vertically must not close the app.
    if (atLeast('7.7')) tg!.disableVerticalSwipes?.();
  },

  setColors(header: string, background: string) {
    if (!atLeast('6.1')) return;
    try {
      tg!.setHeaderColor(header);
      tg!.setBackgroundColor(background);
      if (atLeast('7.10')) tg!.setBottomBarColor?.(background);
    } catch {
      /* older clients reject hex header colours */
    }
  },

  backButton(visible: boolean, handler: () => void): () => void {
    if (!atLeast('6.1')) return () => undefined;
    if (visible) {
      tg!.BackButton.onClick(handler);
      tg!.BackButton.show();
    } else {
      tg!.BackButton.hide();
    }
    return () => tg!.BackButton.offClick(handler);
  },

  /** "Settings" in Telegram's own ⋮ menu, so lesson screens need no gear icon. Returns false where unsupported. */
  settingsButton(handler: () => void): (() => void) | null {
    if (!atLeast('7.0') || !tg!.SettingsButton) return null;
    tg!.SettingsButton.onClick(handler);
    tg!.SettingsButton.show();
    return () => tg!.SettingsButton!.offClick(handler);
  },

  haptic(kind: 'success' | 'error' | 'warning' | 'light' | 'select') {
    if (!atLeast('6.1')) return;
    try {
      if (kind === 'light') tg!.HapticFeedback.impactOccurred('light');
      else if (kind === 'select') tg!.HapticFeedback.selectionChanged();
      else tg!.HapticFeedback.notificationOccurred(kind);
    } catch {
      /* ignore */
    }
  },

  confirm(message: string): Promise<boolean> {
    if (atLeast('6.2') && tg!.showConfirm) return new Promise((resolve) => tg!.showConfirm!(message, resolve));
    return Promise.resolve(window.confirm(message));
  },
};
