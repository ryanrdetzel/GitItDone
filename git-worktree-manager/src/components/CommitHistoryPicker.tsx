import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Commit } from "@/lib/api";
import { GitCommit, User, Calendar, Check } from "lucide-react";

interface CommitHistoryPickerProps {
  commits: Commit[];
  selectedCommit: string | null;
  onCommitSelect: (commitHash: string) => void;
}

export function CommitHistoryPicker({
  commits,
  selectedCommit,
  onCommitSelect,
}: CommitHistoryPickerProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Target Commit</CardTitle>
      </CardHeader>
      <CardContent>
        {commits.length === 0 ? (
          <p className="text-sm text-muted-foreground">No commits found</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {commits.map((commit) => {
              const isSelected = selectedCommit === commit.hash;

              return (
                <button
                  key={commit.hash}
                  onClick={() => onCommitSelect(commit.hash)}
                  className={cn(
                    "w-full flex items-start gap-3 p-3 rounded-md border text-left transition-all",
                    isSelected
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-border hover:border-primary/50 hover:bg-accent/50"
                  )}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {isSelected ? (
                      <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <GitCommit className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      <code className="text-xs font-mono text-muted-foreground">
                        {commit.shortHash}
                      </code>
                      {commit.refs && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                          {commit.refs}
                        </span>
                      )}
                    </div>

                    <p className="text-sm font-medium line-clamp-2">
                      {commit.message}
                    </p>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {commit.author}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(commit.date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
