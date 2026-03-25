/**
 * Git-as-database: after every scrape, commit data/jobs.json +
 * data/products.json and push to GitHub.
 *
 * Required env var:
 *   GITHUB_TOKEN  — a personal access token (or fine-grained token) with
 *                   Contents: Read & Write on rudranshdgi-ui/web-scrapping
 *
 * Optional:
 *   GITHUB_REPO   — override the remote URL
 *                   default: https://github.com/rudranshdgi-ui/web-scrapping.git
 *   GIT_BRANCH    — branch to push to
 *                   default: claude/nextjs-product-scraper-YhANN
 */
import { execSync } from "child_process";

const REPO_URL =
  process.env.GITHUB_REPO ??
  "https://github.com/rudranshdgi-ui/web-scrapping.git";

const BRANCH =
  process.env.GIT_BRANCH ?? "claude/nextjs-product-scraper-YhANN";

const CWD = process.cwd();

// Debounce: batch multiple rapid writes into one commit
let timer: ReturnType<typeof setTimeout> | null = null;
let pendingMessage = "";

export function scheduleCommit(message: string) {
  // Accumulate messages until the timer fires
  pendingMessage = pendingMessage ? `${pendingMessage}; ${message}` : message;

  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    const msg = pendingMessage;
    pendingMessage = "";
    pushData(msg).catch((err) =>
      console.error("[git-store] push failed:", err)
    );
  }, 800); // wait 800 ms to batch concurrent scrapes
}

async function pushData(message: string) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.warn("[git-store] GITHUB_TOKEN not set — skipping git push");
    return;
  }

  // Build authenticated remote URL
  const url = new URL(REPO_URL);
  url.username = token;
  url.password = "";
  const authUrl = url.toString();

  try {
    run(`git config user.email "scraper-bot@pdp.local"`);
    run(`git config user.name "PDP Scraper Bot"`);

    // Stage only the data files so we never accidentally commit other things
    run(`git add data/jobs.json data/products.json`);

    // Commit (--allow-empty is NOT used — if nothing changed, skip)
    const hasStagedChanges = safeRun(
      `git diff --cached --quiet`
    );
    if (hasStagedChanges === 0) {
      // exit 0 means no changes staged — nothing to commit
      return;
    }

    run(`git commit -m "${message.replace(/"/g, "'")}"`);
    run(`git push "${authUrl}" HEAD:${BRANCH}`);
    console.log(`[git-store] pushed "${message}" → ${BRANCH}`);
  } catch (err) {
    // Non-fatal: local data is still intact even if push fails
    console.error("[git-store] error during push:", err);
  }
}

/** Run a shell command, throw on non-zero exit. */
function run(cmd: string) {
  execSync(cmd, { cwd: CWD, stdio: "pipe" });
}

/**
 * Run a command and return the exit code without throwing.
 * Returns 0 on success, non-zero on failure.
 */
function safeRun(cmd: string): number {
  try {
    execSync(cmd, { cwd: CWD, stdio: "pipe" });
    return 0;
  } catch (e: unknown) {
    return (e as { status?: number }).status ?? 1;
  }
}
