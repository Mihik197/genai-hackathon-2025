"use client";

import { cn } from "@/lib/utils";
import { TrendUp, TrendDown, Minus } from "@phosphor-icons/react";

interface StatCardProps {
    label: string;
    value: string | number;
    subValue?: string;
    change?: number;
    prefix?: string;
    suffix?: string;
    size?: "sm" | "md" | "lg";
}

export function StatCard({ label, value, subValue, change, prefix = "", suffix = "", size = "md" }: StatCardProps) {
    const isPositive = change !== undefined && change > 0;
    const isNegative = change !== undefined && change < 0;

    const sizeClasses = {
        sm: "p-3",
        md: "p-4",
        lg: "p-5",
    };

    const valueClasses = {
        sm: "text-lg",
        md: "text-2xl",
        lg: "text-3xl",
    };

    return (
        <div className={cn("bg-surface border border-border rounded-lg", sizeClasses[size])}>
            <div className="text-xs text-text-muted uppercase tracking-wide mb-1">{label}</div>
            <div className={cn("font-bold text-text-main", valueClasses[size])}>
                {prefix}{typeof value === "number" ? value.toLocaleString() : value}{suffix}
            </div>
            {(subValue || change !== undefined) && (
                <div className="flex items-center gap-2 mt-1">
                    {change !== undefined && (
                        <span className={cn(
                            "flex items-center gap-0.5 text-xs font-medium",
                            isPositive && "text-emerald-600",
                            isNegative && "text-red-600",
                            !isPositive && !isNegative && "text-text-muted"
                        )}>
                            {isPositive && <TrendUp size={12} weight="bold" />}
                            {isNegative && <TrendDown size={12} weight="bold" />}
                            {!isPositive && !isNegative && <Minus size={12} />}
                            {isPositive ? "+" : ""}{change.toFixed(2)}%
                        </span>
                    )}
                    {subValue && (
                        <span className="text-xs text-text-muted">{subValue}</span>
                    )}
                </div>
            )}
        </div>
    );
}

export function formatMarketCap(value: number | undefined): string {
    if (!value) return "N/A";
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${value.toLocaleString()}`;
}
