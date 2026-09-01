import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

/**
 * Capturing a session, without knowing anything about how the app logs in.
 *
 * Every attempt to automate this generically fails on the second app. Login
 * pages live at different urls, want different fields, and are frequently not
 * forms at all — an OAuth hop to a provider, a magic link in an inbox, SSO
 * through a corporate IdP, a TOTP prompt, a "check your phone" tap. A config
 * schema that covered them would be a browser automation language, and redpen
 * would then own every app's login flow forever.
 *
 * What every one of those produces is identical: cookies and localStorage that
 * a browser context can be handed. So redpen automates none of the logging in
 * and all of the remembering. It opens a real browser, gets out of the way, and
 * writes the state down when you say you are through.
 *
 * The file is a live credential. It is written under `.redpen/`, and
 * `redpen init` puts that directory in .gitignore for exactly this reason.
 */

export interface LoginResult {
  path: string;
  /** Where the browser was when the state was taken, so the caller can say so. */
  landedOn: string;
  cookies: number;
  origins: number;
}

interface Prompt {
  /** Resolves when the operator says they are logged in. */
  waitForOperator(): Promise<void>;
  say(message: string): void;
}

export async function captureLogin(
  loadPlaywright: () => Promise<{
    chromium: {
      launch(opts: Record<string, unknown>): Promise<{
        newContext(opts?: Record<string, unknown>): Promise<{
          newPage(): Promise<{ goto(url: string, o?: Record<string, unknown>): Promise<unknown>; url(): string }>;
          storageState(opts: { path: string }): Promise<unknown>;
          close(): Promise<void>;
        }>;
        close(): Promise<void>;
      }>;
    };
  }>,
  url: string,
  out: string,
  prompt: Prompt,
): Promise<LoginResult> {
  const pw = await loadPlaywright();
  // Headed, always. The whole point is that a person completes a flow redpen
  // cannot see; a headless browser would be a black box with a password in it.
  const browser = await pw.chromium.launch({ headless: false });
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });

    prompt.say(
      'A browser window is open. Log in however this app works — password, SSO, ' +
        'a code, whatever it takes. redpen is not watching the form and never sees ' +
        'your credentials; it only keeps the session that comes out the other side.',
    );
    await prompt.waitForOperator();

    mkdirSync(dirname(out), { recursive: true });
    await context.storageState({ path: out });
    const landedOn = page.url();
    await context.close();

    // Read back what was actually captured. "Saved" with an empty cookie jar is
    // the failure this command exists to prevent: it would be discovered later,
    // as a scan of a login page reported as a dashboard.
    const { readFileSync } = await import('node:fs');
    const state = JSON.parse(readFileSync(out, 'utf8'));
    const cookies = (state.cookies ?? []).length;
    const origins = (state.origins ?? []).length;
    if (!cookies && !origins) {
      throw new Error(
        `nothing to save: the browser held no cookies and no stored origins at ${landedOn}. ` +
          'If the login did complete, this app may keep its session somewhere a browser ' +
          'profile does not carry, and redpen cannot scan behind it.',
      );
    }
    return { path: out, landedOn, cookies, origins };
  } finally {
    await browser.close();
  }
}
