import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileStatusViewer } from "./FileStatusViewer";
import { DiffViewer } from "./DiffViewer";
import { CommitHistoryPicker } from "./CommitHistoryPicker";
import { api } from "@/lib/api";
import type { FileStatus, Commit, DiffHunk } from "@/lib/api";
import { Loader2, GitMerge, AlertCircle } from "lucide-react";

interface CommitSquasherProps {
  repoPath: string;
}

type Step = "select-files" | "select-hunks" | "select-commit" | "confirm";

export function CommitSquasher({ repoPath }: CommitSquasherProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [step, setStep] = useState<Step>("select-files");
  const [files, setFiles] = useState<FileStatus[]>([]);
  const [commits, setCommits] = useState<Commit[]>([]);

  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [selectedHunks, setSelectedHunks] = useState<Set<number>>(new Set());
  const [selectedCommit, setSelectedCommit] = useState<string | null>(null);

  const [currentDiff, setCurrentDiff] = useState<{
    filePath: string;
    hunks: DiffHunk[];
  } | null>(null);

  // Load initial data
  useEffect(() => {
    loadData();
  }, [repoPath]);

  async function loadData() {
    setLoading(true);
    setError(null);

    try {
      const [statusData, logData] = await Promise.all([
        api.getStatus(repoPath),
        api.getLog(repoPath, 50),
      ]);

      setFiles(statusData.files);
      setCommits(logData.commits);

      if (statusData.files.length === 0) {
        setError("No changed files in working directory");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  async function handleFileSelect(filePath: string) {
    setSelectedFile(filePath);
    setSelectedHunks(new Set());
    setLoading(true);
    setError(null);

    try {
      const diffData = await api.getDiff(repoPath, filePath);
      setCurrentDiff({
        filePath: diffData.filePath,
        hunks: diffData.hunks,
      });
      setStep("select-hunks");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load diff");
    } finally {
      setLoading(false);
    }
  }

  function handleHunkToggle(hunkIndex: number) {
    setSelectedHunks((prev) => {
      const next = new Set(prev);
      if (next.has(hunkIndex)) {
        next.delete(hunkIndex);
      } else {
        next.add(hunkIndex);
      }
      return next;
    });
  }

  function handleCommitSelect(commitHash: string) {
    setSelectedCommit(commitHash);
  }

  async function handleSquash() {
    if (!selectedFile || !selectedCommit) {
      setError("Please select a file and target commit");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Stage the selected hunks or entire file
      if (selectedHunks.size > 0 && currentDiff) {
        // Stage each selected hunk
        for (const hunkIndex of selectedHunks) {
          const hunk = currentDiff.hunks[hunkIndex];
          const hunkContent = hunk.lines.join("\n");
          await api.stageChanges(repoPath, selectedFile, hunkContent);
        }
      } else {
        // Stage entire file
        await api.stageChanges(repoPath, selectedFile);
      }

      // Create fixup commit
      await api.createFixup(repoPath, selectedCommit);

      // Rebase to squash
      await api.rebase(repoPath, selectedCommit);

      setSuccess(
        `Successfully squashed changes into commit ${selectedCommit.substring(0, 7)}`
      );

      // Reset state
      setStep("select-files");
      setSelectedFile(null);
      setSelectedHunks(new Set());
      setSelectedCommit(null);
      setCurrentDiff(null);

      // Reload data
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to squash commits");
    } finally {
      setLoading(false);
    }
  }

  function getStepTitle() {
    switch (step) {
      case "select-files":
        return "Step 1: Select a Changed File";
      case "select-hunks":
        return "Step 2: Select Hunks to Squash";
      case "select-commit":
        return "Step 3: Select Target Commit";
      case "confirm":
        return "Step 4: Confirm Squash";
      default:
        return "Commit Squasher";
    }
  }

  if (loading && files.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitMerge className="h-5 w-5" />
            {getStepTitle()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 rounded-md bg-green-50 text-green-700 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p className="text-sm">{success}</p>
            </div>
          )}

          <div className="flex gap-2">
            <div className="flex-shrink-0 space-y-1">
              {["select-files", "select-hunks", "select-commit"].map((s, i) => (
                <div
                  key={s}
                  className={`flex items-center gap-2 text-sm ${
                    step === s
                      ? "text-primary font-medium"
                      : i < ["select-files", "select-hunks", "select-commit"].indexOf(step)
                      ? "text-muted-foreground"
                      : "text-muted-foreground/50"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                      step === s
                        ? "border-primary bg-primary text-primary-foreground"
                        : i < ["select-files", "select-hunks", "select-commit"].indexOf(step)
                        ? "border-primary bg-primary/20 text-primary"
                        : "border-muted"
                    }`}
                  >
                    {i + 1}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-4">
                {step === "select-files" &&
                  "Choose a file from your working directory to start."}
                {step === "select-hunks" &&
                  "Select the specific changes (hunks) you want to squash, or continue to squash the entire file."}
                {step === "select-commit" &&
                  "Choose which commit you want to squash your changes into."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <FileStatusViewer
            files={files}
            selectedFile={selectedFile}
            onFileSelect={handleFileSelect}
          />

          {step !== "select-files" && currentDiff && (
            <div className="space-y-2">
              <Button
                variant="outline"
                onClick={() => {
                  if (step === "select-hunks") {
                    setStep("select-commit");
                  } else if (step === "select-commit") {
                    handleSquash();
                  }
                }}
                disabled={
                  loading ||
                  (step === "select-commit" && !selectedCommit) ||
                  (step === "select-hunks" && selectedHunks.size === 0)
                }
                className="w-full"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {step === "select-hunks" && "Continue to Select Commit"}
                {step === "select-commit" && "Squash Selected Changes"}
              </Button>

              {step === "select-hunks" && (
                <p className="text-xs text-center text-muted-foreground">
                  {selectedHunks.size} hunk(s) selected
                </p>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (step === "select-commit") {
                    setStep("select-hunks");
                  } else if (step === "select-hunks") {
                    setStep("select-files");
                    setSelectedFile(null);
                    setCurrentDiff(null);
                    setSelectedHunks(new Set());
                  }
                }}
                className="w-full"
              >
                Back
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {step === "select-hunks" && currentDiff && (
            <DiffViewer
              filePath={currentDiff.filePath}
              hunks={currentDiff.hunks}
              selectedHunks={selectedHunks}
              onHunkToggle={handleHunkToggle}
            />
          )}

          {step === "select-commit" && (
            <CommitHistoryPicker
              commits={commits}
              selectedCommit={selectedCommit}
              onCommitSelect={handleCommitSelect}
            />
          )}
        </div>
      </div>
    </div>
  );
}
