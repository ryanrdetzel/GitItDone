import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DiffHunk } from "@/lib/api";
import { Check } from "lucide-react";

interface DiffViewerProps {
  filePath: string;
  hunks: DiffHunk[];
  selectedHunks: Set<number>;
  onHunkToggle: (hunkIndex: number) => void;
}

export function DiffViewer({
  filePath,
  hunks,
  selectedHunks,
  onHunkToggle,
}: DiffViewerProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{filePath}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {hunks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No changes to display</p>
        ) : (
          hunks.map((hunk, index) => (
            <div
              key={index}
              className={cn(
                "border rounded-md overflow-hidden transition-all",
                selectedHunks.has(index)
                  ? "border-primary bg-primary/5"
                  : "border-border"
              )}
            >
              <div className="flex items-center justify-between bg-muted/50 px-3 py-2">
                <code className="text-xs text-muted-foreground">
                  {hunk.header}
                </code>
                <Button
                  size="sm"
                  variant={selectedHunks.has(index) ? "default" : "outline"}
                  onClick={() => onHunkToggle(index)}
                  className="h-7"
                >
                  {selectedHunks.has(index) && (
                    <Check className="mr-1 h-3 w-3" />
                  )}
                  {selectedHunks.has(index) ? "Selected" : "Select"}
                </Button>
              </div>
              <div className="bg-background p-3 overflow-x-auto">
                <pre className="text-xs font-mono">
                  {hunk.lines.slice(1).map((line, lineIndex) => {
                    let lineClass = "text-foreground";
                    if (line.startsWith("+") && !line.startsWith("+++")) {
                      lineClass = "text-green-600 bg-green-50/50";
                    } else if (line.startsWith("-") && !line.startsWith("---")) {
                      lineClass = "text-red-600 bg-red-50/50";
                    } else if (line.startsWith("@@")) {
                      lineClass = "text-blue-600";
                    }
                    return (
                      <div key={lineIndex} className={cn("px-1", lineClass)}>
                        {line || " "}
                      </div>
                    );
                  })}
                </pre>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
