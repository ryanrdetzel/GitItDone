const API_BASE = '/api';

export interface WorktreeInfo {
  path: string;
  branch: string;
  commit: string;
  bare?: boolean;
  detached?: boolean;
  prunable?: string;
}

export interface RepoInfo {
  currentBranch: string;
  branches: string[];
  worktrees: WorktreeInfo[];
  repoPath: string;
}

export interface BranchInfo {
  current: string;
  all: string[];
  branches: Record<string, any>;
}

export interface FileStatus {
  path: string;
  status: 'modified' | 'created' | 'deleted' | 'renamed';
  from?: string;
}

export interface RepoStatus {
  files: FileStatus[];
  staged: string[];
  isClean: boolean;
}

export interface Commit {
  hash: string;
  shortHash: string;
  message: string;
  author: string;
  date: string;
  refs: string;
}

export interface CommitLog {
  commits: Commit[];
}

export interface DiffHunk {
  header: string;
  lines: string[];
  startLine: number;
  endLine: number;
}

export interface FileDiff {
  filePath: string;
  diff: string;
  hunks: DiffHunk[];
}

export const api = {
  async getRepoInfo(repoPath: string): Promise<RepoInfo> {
    const response = await fetch(`${API_BASE}/repo/info`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repoPath }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get repository info');
    }

    return response.json();
  },

  async getBranches(repoPath: string): Promise<BranchInfo> {
    const response = await fetch(`${API_BASE}/repo/branches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repoPath }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get branches');
    }

    return response.json();
  },

  async getWorktrees(repoPath: string): Promise<{ worktrees: WorktreeInfo[] }> {
    const response = await fetch(`${API_BASE}/worktree/list`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repoPath }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to list worktrees');
    }

    return response.json();
  },

  async createWorktree(
    repoPath: string,
    path: string,
    branch: string,
    createBranch: boolean = false
  ): Promise<{ success: boolean; message: string; path: string; branch: string }> {
    const response = await fetch(`${API_BASE}/worktree/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repoPath, path, branch, createBranch }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create worktree');
    }

    return response.json();
  },

  async removeWorktree(
    repoPath: string,
    path: string,
    force: boolean = false
  ): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE}/worktree/remove`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repoPath, path, force }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to remove worktree');
    }

    return response.json();
  },

  async checkoutBranch(
    repoPath: string,
    branch: string
  ): Promise<{ success: boolean; message: string; branch: string }> {
    const response = await fetch(`${API_BASE}/repo/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repoPath, branch }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to checkout branch');
    }

    return response.json();
  },

  async getStatus(repoPath: string): Promise<RepoStatus> {
    const response = await fetch(`${API_BASE}/repo/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repoPath }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get repository status');
    }

    return response.json();
  },

  async getLog(repoPath: string, maxCount: number = 50): Promise<CommitLog> {
    const response = await fetch(`${API_BASE}/repo/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repoPath, maxCount }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get commit log');
    }

    return response.json();
  },

  async getDiff(
    repoPath: string,
    filePath: string,
    staged: boolean = false
  ): Promise<FileDiff> {
    const response = await fetch(`${API_BASE}/repo/diff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repoPath, filePath, staged }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get file diff');
    }

    return response.json();
  },

  async stageChanges(
    repoPath: string,
    filePath: string,
    hunk?: string
  ): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE}/repo/stage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repoPath, filePath, hunk }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to stage changes');
    }

    return response.json();
  },

  async createFixup(
    repoPath: string,
    targetCommit: string
  ): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE}/repo/fixup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repoPath, targetCommit }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create fixup commit');
    }

    return response.json();
  },

  async rebase(
    repoPath: string,
    targetCommit: string
  ): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE}/repo/rebase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repoPath, targetCommit }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to rebase');
    }

    return response.json();
  },
};
