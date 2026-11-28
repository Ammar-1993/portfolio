'use strict';

const COMMIT_AUTHOR = {
  name: 'Ammar-1993',
  email: 'ammaralnggar@gmail.com',
};

const GITHUB_API_BASE = 'https://api.github.com';

class GitHubError extends Error {
  constructor(status, code, message, details = null) {
    super(message);
    this.name = 'GitHubError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function getConfig() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new GitHubError(500, 'CONFIG_ERROR', 'إعدادات الخادم غير مكتملة (GITHUB_TOKEN مفقود)');
  }
  return {
    token,
    owner: process.env.GITHUB_OWNER || 'Ammar-1993',
    repo: process.env.GITHUB_REPO || 'portfolio',
    branch: process.env.GITHUB_BRANCH || 'main',
  };
}

async function githubRequest(apiPath, { method = 'GET', body, token, operation = 'request' } = {}) {
  const res = await fetch(`${GITHUB_API_BASE}${apiPath}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'portfolio-admin-vercel',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (_) {
      data = { message: text };
    }
  }

  if (!res.ok) {
    const msg = (data && data.message) || `GitHub API error (${res.status})`;
    if (
      res.status === 401 ||
      (res.status === 403 && /bad credentials|token|expired|resource not accessible/i.test(msg))
    ) {
      throw new GitHubError(
        401,
        'GITHUB_TOKEN_EXPIRED',
        'صلاحية رمز GitHub (Token) انتهت أو غير صالحة، يرجى تجديده من GitHub ثم تحديثه في Vercel.',
        data
      );
    }

    if (operation === 'updateRef' && (res.status === 409 || res.status === 422)) {
      throw new GitHubError(409, 'REF_CONFLICT', 'تعارض أثناء تحديث الفرع، يرجى إعادة المحاولة أو تحديث الصفحة.', data);
    }

    throw new GitHubError(res.status, 'GITHUB_API_ERROR', msg, data);
  }

  return data;
}

async function getBranchHead() {
  const { token, owner, repo, branch } = getConfig();
  const encodedBranch = branch.split('/').map(encodeURIComponent).join('/');
  const refData = await githubRequest(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/ref/heads/${encodedBranch}`,
    { token }
  );
  const commitSha = refData && refData.object && refData.object.sha;
  if (!commitSha) {
    throw new GitHubError(500, 'GITHUB_API_ERROR', `تعذر قراءة آخر Commit للفرع ${branch}`);
  }
  const commitData = await githubRequest(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/commits/${encodeURIComponent(commitSha)}`,
    { token }
  );
  return {
    commitSha,
    treeSha: commitData.tree.sha,
    branch,
  };
}

async function getFile(filePath, ref) {
  const { token, owner, repo, branch } = getConfig();
  const targetRef = ref || branch;
  const encodedPath = filePath.split('/').map(encodeURIComponent).join('/');
  const data = await githubRequest(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodedPath}?ref=${encodeURIComponent(targetRef)}`,
    { token }
  );
  const content = Buffer.from(String(data.content || '').replace(/\s+/g, ''), 'base64').toString('utf8');
  return {
    path: data.path,
    sha: data.sha,
    content,
  };
}

async function createBlob(content, encoding = 'utf-8') {
  const { token, owner, repo } = getConfig();
  const data = await githubRequest(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/blobs`,
    {
      method: 'POST',
      token,
      body: { content, encoding },
    }
  );
  return { sha: data.sha };
}

async function commitAtomicChanges({ baseTreeSha, parentCommitSha, entries, message }) {
  const { token, owner, repo, branch } = getConfig();
  const repoPath = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;

  const treeData = await githubRequest(`${repoPath}/git/trees`, {
    method: 'POST',
    token,
    body: {
      base_tree: baseTreeSha,
      tree: entries,
    },
  });

  const nowIso = new Date().toISOString();
  const commitData = await githubRequest(`${repoPath}/git/commits`, {
    method: 'POST',
    token,
    body: {
      message,
      tree: treeData.sha,
      parents: [parentCommitSha],
      author: { ...COMMIT_AUTHOR, date: nowIso },
      committer: { ...COMMIT_AUTHOR, date: nowIso },
    },
  });

  const encodedBranch = branch.split('/').map(encodeURIComponent).join('/');
  await githubRequest(`${repoPath}/git/refs/heads/${encodedBranch}`, {
    method: 'PATCH',
    token,
    operation: 'updateRef',
    body: {
      sha: commitData.sha,
      force: false,
    },
  });

  return {
    commitSha: commitData.sha,
    commitUrl: `https://github.com/${owner}/${repo}/commit/${commitData.sha}`,
    branch,
  };
}

module.exports = {
  COMMIT_AUTHOR,
  GitHubError,
  getConfig,
  getBranchHead,
  getFile,
  createBlob,
  commitAtomicChanges,
};
