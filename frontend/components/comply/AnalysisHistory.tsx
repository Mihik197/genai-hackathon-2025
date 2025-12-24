"use client";

import { Card } from "@/components/ui/Card";
import { type AnalysisHistoryItem } from "@/lib/api";
import { CheckCircle, Warning, WarningCircle, Clock, FileText } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface AnalysisHistoryProps {
    analyses: AnalysisHistoryItem[];
    onSelect: (id: string) => void;
    selectedId?: string | null;
}

export function AnalysisHistory({ analyses, onSelect, selectedId }: AnalysisHistoryProps) {
    if (analyses.length === 0) {
        return (
            <div className="text-center py-8 text-text-muted text-sm">
                No previous analyses yet.
            </div>
        );
    }

    const statusConfig = {
        COMPLIANT: { icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
        PARTIALLY_COMPLIANT: { icon: Warning, color: "text-amber-600", bg: "bg-amber-50" },
        NON_COMPLIANT: { icon: WarningCircle, color: "text-red-600", bg: "bg-red-50" },
    };

    const formatDate = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className="space-y-3">
            {analyses.map((analysis) => {
                const config = statusConfig[analysis.overall_status] || statusConfig.NON_COMPLIANT;
                const StatusIcon = config.icon;
                const isSelected = selectedId === analysis.id;

                return (
                    <button
                        key={analysis.id}
                        onClick={() => onSelect(analysis.id)}
                        className={cn(
                            "w-full text-left p-4 rounded-lg border transition-all duration-200",
                            isSelected
                                ? "border-primary bg-primary/5 shadow-md"
                                : "border-border bg-surface hover:border-primary/30 hover:shadow-sm"
                        )}
                    >
                        <div className="flex items-start gap-3">
                            <div className={cn("p-2 rounded-lg shrink-0", config.bg)}>
                                <StatusIcon size={18} weight="fill" className={config.color} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-text-main truncate text-sm">
                                    {analysis.regulation_title || analysis.filename}
                                </p>
                                {analysis.regulation_reference && (
                                    <p className="text-xs text-text-muted truncate mt-0.5">
                                        {analysis.regulation_reference}
                                    </p>
                                )}
                                <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
                                    <span className="flex items-center gap-1">
                                        <Clock size={12} />
                                        {formatDate(analysis.created_at)}
                                    </span>
                                    {analysis.gaps_count > 0 && (
                                        <span className="text-red-600 font-medium">
                                            {analysis.gaps_count} gap{analysis.gaps_count > 1 ? "s" : ""}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
