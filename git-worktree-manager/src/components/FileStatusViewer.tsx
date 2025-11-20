import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { FileStatus } from "@/lib/api";
import { FileText, FilePlus, FileX, FileSymlink, ChevronRight } from "lucide-react";

interface FileStatusViewerProps {
  files: FileStatus[];
  selectedFile: string | null;
  onFileSelect: (filePath: string) => void;
}

const statusIcons = {
  modified: FileText,
  created: FilePlus,
  deleted: FileX,
  renamed: FileSymlink,
};

const statusColors = {
  modified: "text-yellow-600",
  created: "text-green-600",
  deleted: "text-red-600",
  renamed: "text-blue-600",
};

const statusLabels = {
  modified: "Modified",
  created: "Created",
  deleted: "Deleted",
  renamed: "Renamed",
};

export function FileStatusViewer({
  files,
  selectedFile,
  onFileSelect,
}: FileStatusViewerProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Changed Files ({files.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {files.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No changed files in working directory
          </p>
        ) : (
          <div className="space-y-1">
            {files.map((file) => {
              const Icon = statusIcons[file.status];
              const isSelected = selectedFile === file.path;

              return (
                <button
                  key={file.path}
                  onClick={() => onFileSelect(file.path)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors text-left",
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon className={cn("h-4 w-4 flex-shrink-0", !isSelected && statusColors[file.status])} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{file.path}</div>
                    {file.from && (
                      <div className="text-xs opacity-80">from: {file.from}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full",
                      isSelected ? "bg-primary-foreground/20" : "bg-muted"
                    )}>
                      {statusLabels[file.status]}
                    </span>
                    <ChevronRight className="h-4 w-4 flex-shrink-0" />
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
