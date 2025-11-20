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

// Get repository status (changed files)
app.post('/api/repo/status', async (req, res) => {
  try {
    const { repoPath } = req.body;

    if (!repoPath) {
      return res.status(400).json({ error: 'Repository path is required' });
    }

    const git: SimpleGit = simpleGit(repoPath);
    const status = await git.status();

    res.json({
      files: [
        ...status.modified.map(f => ({ path: f, status: 'modified' })),
        ...status.created.map(f => ({ path: f, status: 'created' })),
        ...status.deleted.map(f => ({ path: f, status: 'deleted' })),
        ...status.renamed.map(f => ({ path: f.to, status: 'renamed', from: f.from })),
      ],
      staged: status.staged,
      isClean: status.isClean(),
    });
  } catch (error) {
    console.error('Error getting status:', error);
    res.status(500).json({
      error: 'Failed to get repository status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get commit log
app.post('/api/repo/log', async (req, res) => {
  try {
    const { repoPath, maxCount = 50 } = req.body;

    if (!repoPath) {
      return res.status(400).json({ error: 'Repository path is required' });
    }

    const git: SimpleGit = simpleGit(repoPath);
    const log = await git.log({ maxCount });

    res.json({
      commits: log.all.map(commit => ({
        hash: commit.hash,
        shortHash: commit.hash.substring(0, 7),
        message: commit.message,
        author: commit.author_name,
        date: commit.date,
        refs: commit.refs,
      })),
    });
  } catch (error) {
    console.error('Error getting log:', error);
    res.status(500).json({
      error: 'Failed to get commit log',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get file diff with hunks
app.post('/api/repo/diff', async (req, res) => {
  try {
    const { repoPath, filePath, staged = false } = req.body;

    if (!repoPath || !filePath) {
      return res.status(400).json({ error: 'Repository path and file path are required' });
    }

    const git: SimpleGit = simpleGit(repoPath);
    const args = ['diff'];
    if (staged) {
      args.push('--cached');
    }
    args.push('--unified=3', filePath);

    const diffOutput = await git.raw(args);

    // Parse diff into hunks
    const hunks = parseDiff(diffOutput);

    res.json({
      filePath,
      diff: diffOutput,
      hunks,
    });
  } catch (error) {
    console.error('Error getting diff:', error);
    res.status(500).json({
      error: 'Failed to get file diff',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Parse diff output into hunks
function parseDiff(diffOutput: string) {
  const hunks: Array<{ header: string; lines: string[]; startLine: number; endLine: number }> = [];
  const lines = diffOutput.split('\n');
  let currentHunk: { header: string; lines: string[]; startLine: number; endLine: number } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Hunk header: @@ -start,count +start,count @@
    if (line.startsWith('@@')) {
      if (currentHunk) {
        hunks.push(currentHunk);
      }

      const match = line.match(/@@ -(\d+),?\d* \+(\d+),?\d* @@/);
      const startLine = match ? parseInt(match[2]) : 0;

      currentHunk = {
        header: line,
        lines: [line],
        startLine,
        endLine: startLine,
      };
    } else if (currentHunk) {
      currentHunk.lines.push(line);
      if (line.startsWith('+') && !line.startsWith('+++')) {
        currentHunk.endLine++;
      }
    }
  }

  if (currentHunk) {
    hunks.push(currentHunk);
  }

  return hunks;
}

// Stage files or hunks
app.post('/api/repo/stage', async (req, res) => {
  try {
    const { repoPath, filePath, hunk } = req.body;

    if (!repoPath || !filePath) {
      return res.status(400).json({ error: 'Repository path and file path are required' });
    }

    const git: SimpleGit = simpleGit(repoPath);

    if (hunk) {
      // Stage specific hunk using patch mode
      // Create a temporary patch file
      const patchContent = `diff --git a/${filePath} b/${filePath}
--- a/${filePath}
+++ b/${filePath}
${hunk}`;

      const tempFile = path.join('/tmp', `patch-${Date.now()}.patch`);
      await fs.writeFile(tempFile, patchContent);

      try {
        await git.raw(['apply', '--cached', tempFile]);
        await fs.unlink(tempFile);
      } catch (error) {
        await fs.unlink(tempFile);
        throw error;
      }
    } else {
      // Stage entire file
      await git.add(filePath);
    }

    res.json({
      success: true,
      message: hunk ? 'Hunk staged successfully' : 'File staged successfully',
    });
  } catch (error) {
    console.error('Error staging:', error);
    res.status(500).json({
      error: 'Failed to stage changes',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create fixup commit
app.post('/api/repo/fixup', async (req, res) => {
  try {
    const { repoPath, targetCommit } = req.body;

    if (!repoPath || !targetCommit) {
      return res.status(400).json({ error: 'Repository path and target commit are required' });
    }

    const git: SimpleGit = simpleGit(repoPath);

    // Create a fixup commit
    await git.commit(`fixup! ${targetCommit}`, [], { '--fixup': targetCommit });

    res.json({
      success: true,
      message: 'Fixup commit created successfully',
    });
  } catch (error) {
    console.error('Error creating fixup commit:', error);
    res.status(500).json({
      error: 'Failed to create fixup commit',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Interactive rebase to squash fixup commits
app.post('/api/repo/rebase', async (req, res) => {
  try {
    const { repoPath, targetCommit } = req.body;

    if (!repoPath || !targetCommit) {
      return res.status(400).json({ error: 'Repository path and target commit are required' });
    }

    const git: SimpleGit = simpleGit(repoPath);

    // Run interactive rebase with autosquash
    await git.raw(['rebase', '-i', '--autosquash', `${targetCommit}^`]);

    res.json({
      success: true,
      message: 'Rebase completed successfully',
    });
  } catch (error) {
    console.error('Error rebasing:', error);
    res.status(500).json({
      error: 'Failed to rebase',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.listen(PORT, () => {
  console.log(`Git Worktree Manager API running on http://localhost:${PORT}`);
});
