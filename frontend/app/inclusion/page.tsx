"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import {
    getCreditAssessments,
    getCreditStats,
    processNextApplicant,
    type CreditAssessmentItem,
    type CreditStats,
} from "@/lib/api";
import { User, ChartBar, Warning, CircleNotch, ArrowRight, Clock } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const POLLING_INTERVAL = 17000;

export default function InclusionPage() {
    const router = useRouter();
    const [assessments, setAssessments] = useState<CreditAssessmentItem[]>([]);
    const [stats, setStats] = useState<CreditStats | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [lastProcessed, setLastProcessed] = useState<string | null>(null);
    const pollingRef = useRef<NodeJS.Timeout | null>(null);

    const fetchData = useCallback(async () => {
        const [assessmentData, statsData] = await Promise.all([
            getCreditAssessments(30),
            getCreditStats()
        ]);
        setAssessments(assessmentData.assessments);
        setStats(statsData);
    }, []);

    const processNext = useCallback(async () => {
        if (isProcessing) return;
        setIsProcessing(true);
        const result = await processNextApplicant();
        if (result.success && result.assessment) {
            setLastProcessed(result.assessment.assessment_id);
            await fetchData();
        }
        setIsProcessing(false);
    }, [isProcessing, fetchData]);

    useEffect(() => {
        fetchData();
        processNext();

        pollingRef.current = setInterval(() => {
            processNext();
        }, POLLING_INTERVAL);

        return () => {
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
            }
        };
    }, []);

    const formatIncome = (income: number) => {
        if (income >= 10000) {
            return `Rs ${(income / 1000).toFixed(0)}K`;
        }
        return `Rs ${income.toLocaleString()}`;
    };

    const getRiskConfig = (band: string) => {
        switch (band) {
            case "High":
                return {
                    color: "text-red-600",
                    bg: "bg-red-50",
                    border: "border-red-200",
                    icon: Warning,
                    label: "HIGH RISK"
                };
            case "Moderate":
                return {
                    color: "text-amber-600",
                    bg: "bg-amber-50",
                    border: "border-amber-200",
                    icon: ChartBar,
                    label: "MODERATE"
                };
            default:
                return {
                    color: "text-emerald-600",
                    bg: "bg-emerald-50",
                    border: "border-emerald-200",
                    icon: User,
                    label: "LOW RISK"
                };
        }
    };

    const formatDate = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        });
    };

    return (
        <DashboardLayout>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-text-main">Inclusion (Credit Scoring)</h1>
                    <p className="text-text-muted mt-2">Alternative credit scoring for financial inclusion.</p>
                </div>
                <div className="flex items-center gap-3">
                    {isProcessing ? (
                        <span className="flex items-center gap-2 text-sm text-primary">
                            <CircleNotch size={16} className="animate-spin" />
                            Assessing...
                        </span>
                    ) : (
                        <span className="flex items-center gap-2 text-sm text-emerald-600">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Live Assessment
                        </span>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                <StatCard
                    label="Total Assessed"
                    value={stats?.total_assessments ?? 0}
                    subValue="applicants"
                />
                <StatCard
                    label="Low Risk"
                    value={stats?.low_risk_count ?? 0}
                    subValue={stats?.total_assessments ? `${((stats.low_risk_count / stats.total_assessments) * 100).toFixed(0)}%` : "0%"}
                />
                <StatCard
                    label="Moderate"
                    value={stats?.moderate_risk_count ?? 0}
                    subValue={stats?.total_assessments ? `${((stats.moderate_risk_count / stats.total_assessments) * 100).toFixed(0)}%` : "0%"}
                />
                <StatCard
                    label="High Risk"
                    value={stats?.high_risk_count ?? 0}
                    subValue={stats?.total_assessments ? `${((stats.high_risk_count / stats.total_assessments) * 100).toFixed(0)}%` : "0%"}
                />
                <StatCard
                    label="Avg Score"
                    value={stats?.avg_score ? Math.round(stats.avg_score) : 0}
                    subValue="out of 1000"
                />
            </div>

            <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-text-main">Applicant Assessments</h3>
                    <span className="text-sm text-text-muted">{assessments.length} assessments</span>
                </div>

                {assessments.length === 0 ? (
                    <div className="text-center py-12 text-text-muted">
                        <User size={48} className="mx-auto mb-4 opacity-50" />
                        <p>No assessments yet.</p>
                        <p className="text-sm mt-1">Applicants will appear here automatically.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <AnimatePresence mode="popLayout">
                            {assessments.map((assessment) => {
                                const config = getRiskConfig(assessment.risk_band);
                                const Icon = config.icon;
                                const isNew = assessment.assessment_id === lastProcessed;

                                return (
                                    <motion.button
                                        key={assessment.assessment_id}
                                        initial={isNew ? { opacity: 0, y: -20, scale: 0.95 } : false}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.3 }}
                                        onClick={() => router.push(`/inclusion/${assessment.assessment_id}`)}
                                        className={cn(
                                            "w-full text-left p-4 rounded-xl border-2 transition-all duration-200",
                                            "bg-surface hover:shadow-lg hover:-translate-y-0.5",
                                            config.border,
                                            "hover:border-primary/50",
                                            isNew && "ring-2 ring-primary ring-offset-2"
                                        )}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className={cn("p-2.5 rounded-lg", config.bg)}>
                                                    <Icon size={20} weight="fill" className={config.color} />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-mono text-sm font-medium text-text-main">
                                                            {assessment.user_id}
                                                        </span>
                                                        <span className={cn(
                                                            "px-2 py-0.5 rounded text-xs font-semibold",
                                                            config.bg, config.color
                                                        )}>
                                                            {config.label}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-4 mt-1 text-sm text-text-muted">
                                                        <span className="capitalize">{assessment.occupation}</span>
                                                        <span>{assessment.age} yrs</span>
                                                        <span>{formatIncome(assessment.monthly_income)}/mo</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <div className="text-lg font-semibold text-text-main">
                                                        {assessment.final_score}
                                                    </div>
                                                    <div className="flex items-center gap-1 text-xs text-text-muted">
                                                        <Clock size={12} />
                                                        {formatDate(assessment.created_at)}
                                                    </div>
                                                </div>
                                                <ArrowRight size={20} className="text-text-muted" />
                                            </div>
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </Card>
        </DashboardLayout>
    );
}
