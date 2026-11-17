import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import pc from 'picocolors';
import { loadPlaywright } from '../channels/render.js';
import { captureLogin, captureLoginHeadless } from '../channels/login.js';
import { loadConfig, saveConfig, stateRoot } from '../config.js';
import { fail, type Args } from './args.js';

/**
 * Capture a session by opening a browser and waiting.
 *
 * redpen automates none of the logging in. Every app's flow is different
 * (OAuth, SSO, a magic link, a second factor), and a config schema covering
 * them would be a browser automation language redpen then owns forever. What
 * every flow produces is the same cookie jar, so that is the only part
 * automated.
 */
export async function cmdLogin(root: string, args: Args): Promise<void> {
  const url = args.urls[0];
  if (!url) {
    fail('redpen login needs the url to log in at, e.g. `redpen login http://localhost:3000/login`');
  }

  const pw = await loadPlaywright(root);
  if (!pw) {
    fail(
      'playwright is not installed here or in the project being scanned — ' +
        '`npm i -D playwright && npx playwright install chromium`',
    );
  }

  const out = join(stateRoot(root), '.redpen', 'auth.json');

  const result = args.headless
    ? await headlessLogin(pw, url, out, args)
    : await captureLogin(async () => pw as never, url, out, {
        say: (m) => process.stderr.write(pc.dim(`  ${m}\n`)),
        waitForOperator: () =>
          new Promise<void>((done) => {
            process.stderr.write(pc.bold('\n  Press Enter here once you are logged in. '));
            process.stdin.resume();
            process.stdin.once('data', () => {
              process.stdin.pause();
              done();
            });
          }),
      });

  process.stdout.write(
    `\n  session saved to ${pc.bold(relative(root, result.path) || result.path)}\n` +
      pc.dim(`  ${result.cookies} cookie(s), ${result.origins} stored origin(s), captured at ${result.landedOn}\n`),
  );
  // The command that writes a credential is the command that protects it, so
  // the ignore entry is added here rather than left to `redpen init`.
  const ignored = ensureGitignored(root, '.redpen/');
  process.stderr.write(
    pc.yellow('\n  This file is a live credential, and it expires when the session does.\n') +
      pc.yellow(
        ignored === 'added'
          ? '  Added .redpen/ to .gitignore so it cannot be committed.\n'
          : ignored === 'present'
            ? '  .gitignore already covers .redpen/.\n'
            : ignored === 'unwritable'
              ? '  Could not write .gitignore — add .redpen/ to it yourself before committing.\n'
              : '  This is not a git repository, so nothing was ignored — keep the file out of any archive you share.\n',
      ),
  );

  const config = loadConfig(root);
  if (!config.storageState) {
    saveConfig(root, { ...config, storageState: '.redpen/auth.json' });
    process.stderr.write(pc.dim('\n  .redpen/config.json now points at it; scans will use it automatically.\n'));
  }
}

/**
 * The flags and environment a headless login needs, checked before a browser opens.
 *
 * Every one of these is refused here rather than deep in Playwright, because
 * the failure a CI run gets from a missing selector is a timeout screenshot
 * nobody will look at, and the failure it gets from here is a sentence.
 */
async function headlessLogin(
  pw: unknown,
  url: string,
  out: string,
  args: Args,
): Promise<{ path: string; landedOn: string; cookies: number; origins: number }> {
  const user = process.env.REDPEN_LOGIN_USER;
  const password = process.env.REDPEN_LOGIN_PASSWORD;
  if (!user || !password) {
    fail(
      'redpen login --headless reads the account from REDPEN_LOGIN_USER and ' +
        'REDPEN_LOGIN_PASSWORD, and one of them is not set. There is no flag for either: ' +
        'a credential passed as an argument ends up in the process table and the CI log.',
    );
  }
  if (!args.userSelector || !args.passwordSelector) {
    fail(
      'redpen login --headless needs --user-selector and --password-selector, e.g. ' +
        '`--user-selector "#email" --password-selector "#password"`. redpen does not guess ' +
        'at field names; guessing wrong types an account into whatever field matched first.',
    );
  }
  if (!args.expectSelector && !args.expectUrl) {
    fail(
      'redpen login --headless needs --expect <selector> or --expect-url <substring> — ' +
        'something that is only there once you are through. A refused password still sets ' +
        'cookies, so without this redpen would save a logged-out session and every ' +
        'authenticated scan after it would silently read the login page.',
    );
  }

  process.stderr.write(pc.dim(`  logging in at ${url} as ${maskAccount(user)}\n`));

  return captureLoginHeadless(async () => pw as never, {
    url,
    user,
    password,
    userSelector: args.userSelector,
    passwordSelector: args.passwordSelector,
    submitSelector: args.submitSelector,
    expectSelector: args.expectSelector,
    expectUrl: args.expectUrl,
    timeoutMs: args.timeoutMs && args.timeoutMs > 0 ? args.timeoutMs : 30_000,
  }, out);
}

/**
 * Enough of the account to recognise, not enough to reuse.
 *
 * The progress line exists so a CI log says which account a failed login was
 * for. Printing the whole address defeats the point of never accepting it as
 * a flag.
 */
export function maskAccount(user: string): string {
  const at = user.indexOf('@');
  if (at > 0) return `${user.slice(0, 1)}***${user.slice(at)}`;
  return user.length <= 2 ? '***' : `${user.slice(0, 1)}***`;
}

/**
 * Put `.redpen/` in .gitignore, if there is one and it is not covered already.
 *
 * Appends rather than rewrites, and never touches a file it cannot parse: an
 * ignore file is the user's, and a tool that reformats one to add a line has
 * done more than it was asked.
 */
export function ensureGitignored(
  root: string,
  entry: string,
): 'added' | 'present' | 'no-repo' | 'unwritable' {
  const gitDir = join(stateRoot(root), '.git');
  const file = join(stateRoot(root), '.gitignore');
  if (!existsSync(gitDir)) return 'no-repo';
  let body = '';
  try {
    body = readFileSync(file, 'utf8');
  } catch {
    body = '';
  }
  const covered = body
    .split('\n')
    .map((l) => l.trim())
    .some((l) => l === entry || l === entry.replace(/\/$/, '') || l === `/${entry}`);
  if (covered) return 'present';
  try {
    writeFileSync(file, (body && !body.endsWith('\n') ? body + '\n' : body) + entry + '\n', 'utf8');
    return 'added';
  } catch {
    return 'unwritable';
  }
}
