import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

/**
 * Capturing a session, without knowing anything about how the app logs in.
 *
 * Every attempt to automate this generically fails on the second app. Login
 * pages live at different urls, want different fields, and are frequently not
 * forms at all: an OAuth hop to a provider, a magic link in an inbox, SSO
 * through a corporate IdP, a TOTP prompt, a "check your phone" tap. A config
 * schema that covered them would be a browser automation language, and redpen
 * would then own every app's login flow forever.
 *
 * What every one of those produces is identical: cookies and localStorage that
 * a browser context can be handed. So redpen automates none of the logging in
 * and all of the remembering. It opens a real browser, gets out of the way, and
 * writes the state down when you say you are through.
 *
 * The file is a live credential. It is written under `.redpen/`, and the
 * login command puts that directory in .gitignore for exactly this reason.
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

/**
 * The same cookie jar, captured without a person in the room.
 *
 * `captureLogin` above is the honest general answer and it cannot run in CI,
 * which is where `redpen check` lives, so the gate could never cover a route
 * behind a session. This is the narrow answer: one shape of login, a form with
 * a username field, a password field and a submit, filled from the environment.
 *
 * It deliberately covers nothing else. OAuth hops, magic links, SSO redirects
 * and second factors are still `redpen login`'s headed flow, and this throws
 * rather than pretending. The narrowness is the point: every generic version
 * of this becomes a browser automation language redpen then owns forever.
 *
 * `expect` is not a convenience. A failed login still sets cookies (a CSRF
 * token, an anonymous session id), so the empty-jar check that guards the
 * headed flow passes happily on a rejected password, and the saved file would
 * then scan every authenticated route as a login page. The only thing that
 * distinguishes a real session from a refused one is something on the page
 * that appears when you are through, so naming it is required.
 */
export interface HeadlessLogin {
  /** The login page. */
  url: string;
  user: string;
  password: string;
  userSelector: string;
  passwordSelector: string;
  /** null presses Enter in the password field, which is what most forms want. */
  submitSelector: string | null;
  /** A selector that only exists once logged in. */
  expectSelector: string | null;
  /** A substring the url must contain once logged in. */
  expectUrl: string | null;
  timeoutMs: number;
}

interface MinimalPage {
  goto(url: string, o?: Record<string, unknown>): Promise<unknown>;
  url(): string;
  title(): Promise<string>;
  fill(selector: string, value: string, o?: Record<string, unknown>): Promise<void>;
  click(selector: string, o?: Record<string, unknown>): Promise<void>;
  press(selector: string, key: string, o?: Record<string, unknown>): Promise<void>;
  waitForSelector(selector: string, o?: Record<string, unknown>): Promise<unknown>;
  waitForURL(url: unknown, o?: Record<string, unknown>): Promise<void>;
}

interface MinimalContext {
  newPage(): Promise<MinimalPage>;
  storageState(opts: { path: string }): Promise<unknown>;
  close(): Promise<void>;
}

interface MinimalBrowser {
  newContext(opts?: Record<string, unknown>): Promise<MinimalContext>;
  close(): Promise<void>;
}

export async function captureLoginHeadless(
  loadPlaywright: () => Promise<{ chromium: { launch(opts: Record<string, unknown>): Promise<MinimalBrowser> } }>,
  login: HeadlessLogin,
  out: string,
): Promise<LoginResult> {
  if (!login.expectSelector && !login.expectUrl) {
    throw new Error(
      'a headless login needs something to check for. A rejected password still sets cookies, ' +
        'so without --expect or --expect-url this would save a refused session and every ' +
        'authenticated scan would quietly read the login page.',
    );
  }

  const pw = await loadPlaywright();
  const browser = await pw.chromium.launch({ headless: true });
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(login.url, { waitUntil: 'domcontentloaded', timeout: login.timeoutMs });

    // Nothing below ever puts a credential in a message. Playwright's own
    // errors name the selector, not the value, and the failure path reports
    // the url and the title only. A login form that echoes what you typed
    // would otherwise put the account into a CI log.
    await page.fill(login.userSelector, login.user, { timeout: login.timeoutMs });
    await page.fill(login.passwordSelector, login.password, { timeout: login.timeoutMs });

    if (login.submitSelector) {
      await page.click(login.submitSelector, { timeout: login.timeoutMs });
    } else {
      await page.press(login.passwordSelector, 'Enter');
    }

    try {
      if (login.expectSelector) {
        await page.waitForSelector(login.expectSelector, { timeout: login.timeoutMs });
      }
      if (login.expectUrl) {
        const wanted = login.expectUrl;
        await page.waitForURL((u: unknown) => String(u).includes(wanted), { timeout: login.timeoutMs });
      }
    } catch {
      const where = page.url();
      let title = '';
      try {
        title = await page.title();
      } catch {
        // A page that cannot report its own title is still worth failing on.
      }
      throw new Error(
        `the login did not complete: ${
          login.expectSelector ? `no element matched ${login.expectSelector}` : `the url never contained ${login.expectUrl}`
        } within ${login.timeoutMs}ms. The browser was left at ${where}${title ? ` (${title})` : ''}. ` +
          'Nothing was saved. Either the credentials were refused, or this app needs a step ' +
          'a form fill cannot do — in which case use the headed `redpen login`.',
      );
    }

    mkdirSync(dirname(out), { recursive: true });
    await context.storageState({ path: out });
    const landedOn = page.url();
    await context.close();

    const { readFileSync } = await import('node:fs');
    const state = JSON.parse(readFileSync(out, 'utf8')) as { cookies?: unknown[]; origins?: unknown[] };
    const cookies = (state.cookies ?? []).length;
    const origins = (state.origins ?? []).length;
    if (!cookies && !origins) {
      throw new Error(
        `nothing to save: the browser held no cookies and no stored origins at ${landedOn}, ` +
          'even though the login appeared to succeed. This app keeps its session somewhere a ' +
          'browser profile does not carry, and redpen cannot scan behind it.',
      );
    }
    return { path: out, landedOn, cookies, origins };
  } finally {
    await browser.close();
  }
}
