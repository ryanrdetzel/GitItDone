import express from 'express';
import cors from 'cors';
import { simpleGit, SimpleGit, CleanOptions } from 'simple-git';
import path from 'path';
import fs from 'fs/promises';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

interface WorktreeInfo {
  path: string;
  branch: string;
  commit: string;
  bare?: boolean;
  detached?: boolean;
  prunable?: string;
}

// Parse worktree list output
function parseWorktrees(output: string): WorktreeInfo[] {
  const worktrees: WorktreeInfo[] = [];
  const lines = output.split('\n');
  let currentWorktree: Partial<WorktreeInfo> = {};

  for (const line of lines) {
    if (!line.trim()) {
      if (currentWorktree.path) {
        worktrees.push(currentWorktree as WorktreeInfo);
        currentWorktree = {};
      }
      continue;
    }

    const [key, ...valueParts] = line.split(' ');
    const value = valueParts.join(' ');

    switch (key) {
      case 'worktree':
        currentWorktree.path = value;
        break;
      case 'HEAD':
        currentWorktree.commit = value;
        break;
      case 'branch':
        currentWorktree.branch = value.replace('refs/heads/', '');
        break;
      case 'bare':
        currentWorktree.bare = true;
        break;
      case 'detached':
        currentWorktree.detached = true;
        break;
      case 'prunable':
        currentWorktree.prunable = value;
        break;
    }
  }

  if (currentWorktree.path) {
    worktrees.push(currentWorktree as WorktreeInfo);
  }

  return worktrees;
}

// Get repository info
app.post('/api/repo/info', async (req, res) => {
  try {
    const { repoPath } = req.body;

    if (!repoPath) {
      return res.status(400).json({ error: 'Repository path is required' });
    }

    const git: SimpleGit = simpleGit(repoPath);

    // Check if it's a valid git repository
    const isRepo = await git.checkIsRepo();
    if (!isRepo) {
      return res.status(400).json({ error: 'Not a valid git repository' });
    }

    // Get current branch
    const branch = await git.branchLocal();

    // Get all branches
    const branches = await git.branch();

    // Get worktrees
    const worktreeOutput = await git.raw(['worktree', 'list', '--porcelain']);
    const worktrees = parseWorktrees(worktreeOutput);

    res.json({
      currentBranch: branch.current,
      branches: branches.all,
      worktrees,
      repoPath,
    });
  } catch (error) {
    console.error('Error getting repo info:', error);
    res.status(500).json({
      error: 'Failed to get repository information',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get branches
app.post('/api/repo/branches', async (req, res) => {
  try {
    const { repoPath } = req.body;

    if (!repoPath) {
      return res.status(400).json({ error: 'Repository path is required' });
    }

    const git: SimpleGit = simpleGit(repoPath);
    const branches = await git.branch();

    res.json({
      current: branches.current,
      all: branches.all,
      branches: branches.branches,
    });
  } catch (error) {
    console.error('Error getting branches:', error);
    res.status(500).json({
      error: 'Failed to get branches',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get worktrees
app.post('/api/worktree/list', async (req, res) => {
  try {
    const { repoPath } = req.body;

    if (!repoPath) {
      return res.status(400).json({ error: 'Repository path is required' });
    }

    const git: SimpleGit = simpleGit(repoPath);
    const worktreeOutput = await git.raw(['worktree', 'list', '--porcelain']);
    const worktrees = parseWorktrees(worktreeOutput);

    res.json({ worktrees });
  } catch (error) {
    console.error('Error listing worktrees:', error);
    res.status(500).json({
      error: 'Failed to list worktrees',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create worktree
app.post('/api/worktree/add', async (req, res) => {
  try {
    const { repoPath, path: worktreePath, branch, createBranch } = req.body;

    if (!repoPath || !worktreePath || !branch) {
      return res.status(400).json({
        error: 'Repository path, worktree path, and branch are required'
      });
    }

    const git: SimpleGit = simpleGit(repoPath);

    const args = ['worktree', 'add'];
    if (createBranch) {
      args.push('-b', branch);
    }
    args.push(worktreePath);
    if (!createBranch) {
      args.push(branch);
    }

    await git.raw(args);

    res.json({
      success: true,
      message: `Worktree created at ${worktreePath}`,
      path: worktreePath,
      branch,
    });
  } catch (error) {
    console.error('Error creating worktree:', error);
    res.status(500).json({
      error: 'Failed to create worktree',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Remove worktree
app.post('/api/worktree/remove', async (req, res) => {
  try {
    const { repoPath, path: worktreePath, force } = req.body;

    if (!repoPath || !worktreePath) {
      return res.status(400).json({
        error: 'Repository path and worktree path are required'
      });
    }

    const git: SimpleGit = simpleGit(repoPath);

    const args = ['worktree', 'remove'];
    if (force) {
      args.push('--force');
    }
    args.push(worktreePath);

    await git.raw(args);

    res.json({
      success: true,
      message: `Worktree removed from ${worktreePath}`
    });
  } catch (error) {
    console.error('Error removing worktree:', error);
    res.status(500).json({
      error: 'Failed to remove worktree',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Checkout branch
app.post('/api/repo/checkout', async (req, res) => {
  try {
    const { repoPath, branch } = req.body;

    if (!repoPath || !branch) {
      return res.status(400).json({
        error: 'Repository path and branch are required'
      });
    }

    const git: SimpleGit = simpleGit(repoPath);
    await git.checkout(branch);

    res.json({
      success: true,
      message: `Checked out to ${branch}`,
      branch,
    });
  } catch (error) {
    console.error('Error checking out branch:', error);
    res.status(500).json({
      error: 'Failed to checkout branch',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.listen(PORT, () => {
  console.log(`Git Worktree Manager API running on http://localhost:${PORT}`);
});
