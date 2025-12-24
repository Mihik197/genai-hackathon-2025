import { useState } from "react";
import { type Gap } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { CaretDown, CaretUp, Warning, WarningCircle, Info } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface GapCardProps {
    gap: Gap;
}

export function GapCard({ gap }: GapCardProps) {
    const [expanded, setExpanded] = useState(false);

    const priorityColors = {
        HIGH: "bg-red-50 text-red-700 border-red-200",
        MEDIUM: "bg-amber-50 text-amber-700 border-amber-200",
        LOW: "bg-blue-50 text-blue-700 border-blue-200",
    };

    const priorityIcons = {
        HIGH: <WarningCircle weight="fill" className="text-red-600" size={18} />,
        MEDIUM: <Warning weight="fill" className="text-amber-600" size={18} />,
        LOW: <Info weight="fill" className="text-blue-600" size={18} />,
    };

    return (
        <Card
            className={cn(
                "border-l-4 transition-all duration-200",
                gap.priority === "HIGH" ? "border-l-red-500" :
                    gap.priority === "MEDIUM" ? "border-l-amber-500" : "border-l-blue-500"
            )}
            noPadding
        >
            <div
                className="p-5 cursor-pointer hover:bg-gray-50/50 transition-colors"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                            <span className={cn("px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5", priorityColors[gap.priority])}>
                                {priorityIcons[gap.priority]}
                                {gap.priority} PRIORITY
                            </span>
                            <span className="text-xs text-text-muted font-mono">{gap.id}</span>
                        </div>

                        <h3 className="text-base font-semibold text-text-main leading-snug">
                            {gap.requirement}
                        </h3>

                        <p className="text-sm text-text-muted line-clamp-2">
                            Current: {gap.current_state}
                        </p>
                    </div>

                    <button className="text-text-muted hover:text-primary transition-colors mt-1">
                        {expanded ? <CaretUp size={20} /> : <CaretDown size={20} />}
                    </button>
                </div>
            </div>

            {expanded && (
                <div className="px-5 pb-5 pt-0 border-t border-border/50 bg-gray-50/30">
                    <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <span className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-1">Affected Policy</span>
                                <p className="text-sm font-medium text-text-main bg-white border border-border px-3 py-2 rounded-md inline-block">
                                    {gap.affected_policy}
                                </p>
                                {gap.affected_section && (
                                    <p className="text-xs text-text-muted mt-1 ml-1">{gap.affected_section}</p>
                                )}
                            </div>

                            <div>
                                <span className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-1">Recommended Deadline</span>
                                <p className="text-sm text-text-main">
                                    {gap.deadline_recommended || "As soon as possible"}
                                </p>
                            </div>
                        </div>

                        <div className="bg-white border border-border p-4 rounded-lg shadow-sm">
                            <span className="text-xs font-semibold text-primary uppercase tracking-wider block mb-2">Required Action</span>
                            <p className="text-sm text-text-main leading-relaxed">
                                {gap.action_required}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </Card>
    );
}
