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
};
