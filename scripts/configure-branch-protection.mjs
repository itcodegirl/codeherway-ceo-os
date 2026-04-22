import process from 'node:process';

const DEFAULT_BRANCH = 'main';
const DEFAULT_REQUIRED_CHECK = 'Unit + E2E';
const GITHUB_API_VERSION = '2022-11-28';

function getArgValue(args, name, fallback = '') {
  const index = args.indexOf(name);
  if (index === -1) {
    return fallback;
  }

  return args[index + 1] ?? fallback;
}

function getRepoInfo(repoSlug) {
  const [owner, repo] = String(repoSlug).split('/');
  if (!owner || !repo) {
    return null;
  }

  return { owner, repo };
}

async function configureBranchProtection({
  token,
  owner,
  repo,
  branch,
  requiredCheck,
  dryRun,
}) {
  const payload = {
    required_status_checks: {
      strict: true,
      contexts: [requiredCheck],
    },
    enforce_admins: false,
    required_pull_request_reviews: {
      dismiss_stale_reviews: true,
      require_code_owner_reviews: false,
      required_approving_review_count: 1,
      require_last_push_approval: false,
    },
    restrictions: null,
    required_linear_history: true,
    allow_force_pushes: false,
    allow_deletions: false,
    block_creations: false,
    required_conversation_resolution: true,
    lock_branch: false,
    allow_fork_syncing: true,
  };

  const endpoint = `https://api.github.com/repos/${owner}/${repo}/branches/${encodeURIComponent(branch)}/protection`;

  if (dryRun) {
    console.log(`[branch-protection] DRY RUN: would PUT ${endpoint}`);
    console.log(`[branch-protection] Required status check: "${requiredCheck}"`);
    console.log(`[branch-protection] Payload: ${JSON.stringify(payload, null, 2)}`);
    return;
  }

  const response = await fetch(endpoint, {
    method: 'PUT',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': GITHUB_API_VERSION,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub API request failed (${response.status}): ${body}`);
  }

  console.log(
    `[branch-protection] Applied to ${owner}/${repo}@${branch} with required check "${requiredCheck}".`,
  );
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const branch = getArgValue(args, '--branch', process.env.BRANCH || DEFAULT_BRANCH);
  const requiredCheck = getArgValue(
    args,
    '--required-check',
    process.env.REQUIRED_CHECK || DEFAULT_REQUIRED_CHECK,
  );
  const repoSlug = getArgValue(args, '--repo', process.env.GITHUB_REPOSITORY || '');
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';

  const repoInfo = getRepoInfo(repoSlug);
  if (!repoInfo) {
    throw new Error(
      'Missing or invalid repository slug. Set GITHUB_REPOSITORY (owner/repo) or pass --repo owner/repo.',
    );
  }

  if (!dryRun && !token) {
    throw new Error(
      'Missing GITHUB_TOKEN (or GH_TOKEN). Provide a token with repository administration permissions.',
    );
  }

  await configureBranchProtection({
    token,
    owner: repoInfo.owner,
    repo: repoInfo.repo,
    branch,
    requiredCheck,
    dryRun,
  });
}

main().catch((error) => {
  console.error(`[branch-protection] ${error.message}`);
  process.exitCode = 1;
});
