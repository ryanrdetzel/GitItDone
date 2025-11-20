import { useState } from 'react';
import { GitBranch, FolderGit2, Plus, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { api } from '@/lib/api';
import type { RepoInfo } from '@/lib/api';
import { CommitSquasher } from '@/components/CommitSquasher';

function App() {
  const [repoPath, setRepoPath] = useState('');
  const [repoInfo, setRepoInfo] = useState<RepoInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Worktree creation state
  const [showCreateWorktree, setShowCreateWorktree] = useState(false);
  const [newWorktreePath, setNewWorktreePath] = useState('');
  const [newWorktreeBranch, setNewWorktreeBranch] = useState('');
  const [createNewBranch, setCreateNewBranch] = useState(false);

  const loadRepoInfo = async () => {
    if (!repoPath.trim()) {
      setError('Please enter a repository path');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const info = await api.getRepoInfo(repoPath);
      setRepoInfo(info);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load repository');
      setRepoInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshRepoInfo = async () => {
    if (repoPath) {
      await loadRepoInfo();
    }
  };

  const handleCheckoutBranch = async (branch: string) => {
    if (!repoPath) return;

    setLoading(true);
    setError('');

    try {
      await api.checkoutBranch(repoPath, branch);
      await refreshRepoInfo();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to checkout branch');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorktree = async () => {
    if (!repoPath || !newWorktreePath || !newWorktreeBranch) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.createWorktree(repoPath, newWorktreePath, newWorktreeBranch, createNewBranch);
      setShowCreateWorktree(false);
      setNewWorktreePath('');
      setNewWorktreeBranch('');
      setCreateNewBranch(false);
      await refreshRepoInfo();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create worktree');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveWorktree = async (worktreePath: string) => {
    if (!repoPath) return;

    if (!confirm(`Are you sure you want to remove worktree at ${worktreePath}?`)) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.removeWorktree(repoPath, worktreePath, false);
      await refreshRepoInfo();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove worktree');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <FolderGit2 className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Git Worktree Manager</h1>
        </div>

        {/* Repository Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Repository</CardTitle>
            <CardDescription>
              Enter the path to your Git repository
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="/path/to/your/repo"
                  value={repoPath}
                  onChange={(e) => setRepoPath(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadRepoInfo()}
                />
              </div>
              <Button onClick={loadRepoInfo} disabled={loading}>
                {loading ? 'Loading...' : 'Load Repository'}
              </Button>
            </div>
            {error && (
              <p className="text-sm text-destructive mt-2">{error}</p>
            )}
          </CardContent>
        </Card>

        {/* Repository Info */}
        {repoInfo && (
          <>
            {/* Branches */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <GitBranch className="h-5 w-5" />
                      Branches
                    </CardTitle>
                    <CardDescription>
                      Current: <strong>{repoInfo.currentBranch}</strong>
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={refreshRepoInfo}
                    disabled={loading}
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label>Switch Branch</Label>
                  <Select
                    value={repoInfo.currentBranch}
                    onChange={(e) => handleCheckoutBranch(e.target.value)}
                    disabled={loading}
                  >
                    {repoInfo.branches.map((branch) => (
                      <option key={branch} value={branch}>
                        {branch}
                        {branch === repoInfo.currentBranch ? ' (current)' : ''}
                      </option>
                    ))}
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Worktrees */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Worktrees</CardTitle>
                  <Button onClick={() => setShowCreateWorktree(!showCreateWorktree)}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Worktree
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Create Worktree Form */}
                {showCreateWorktree && (
                  <div className="p-4 border rounded-lg space-y-4 bg-muted/50">
                    <h3 className="font-semibold">Create New Worktree</h3>
                    <div className="space-y-2">
                      <Label>Worktree Path</Label>
                      <Input
                        placeholder="/path/to/new/worktree"
                        value={newWorktreePath}
                        onChange={(e) => setNewWorktreePath(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Branch</Label>
                      <Input
                        placeholder="branch-name"
                        value={newWorktreeBranch}
                        onChange={(e) => setNewWorktreeBranch(e.target.value)}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="create-branch"
                        checked={createNewBranch}
                        onChange={(e) => setCreateNewBranch(e.target.checked)}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="create-branch">
                        Create new branch
                      </Label>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleCreateWorktree} disabled={loading}>
                        Create Worktree
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowCreateWorktree(false);
                          setNewWorktreePath('');
                          setNewWorktreeBranch('');
                          setCreateNewBranch(false);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Worktree List */}
                <div className="space-y-2">
                  {repoInfo.worktrees.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                      No worktrees found
                    </p>
                  ) : (
                    repoInfo.worktrees.map((worktree, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="font-medium">{worktree.path}</div>
                          <div className="text-sm text-muted-foreground">
                            Branch: {worktree.branch || 'N/A'}
                            {worktree.detached && ' (detached)'}
                            {worktree.bare && ' (bare)'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {worktree.commit}
                          </div>
                        </div>
                        {!worktree.bare && (
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleRemoveWorktree(worktree.path)}
                            disabled={loading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Commit Squasher */}
            <CommitSquasher repoPath={repoPath} />
          </>
        )}
      </div>
    </div>
  );
}

export default App;
