"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import {
    getFraudTransactions,
    getFraudStats,
    processNextTransaction,
    type FraudTransactionItem,
    type FraudStats,
} from "@/lib/api";
import { ShieldCheck, ShieldWarning, Warning, Clock, CircleNotch, ArrowRight } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const POLLING_INTERVAL = 45000;

export default function ShieldPage() {
    const router = useRouter();
    const [transactions, setTransactions] = useState<FraudTransactionItem[]>([]);
    const [stats, setStats] = useState<FraudStats | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [lastProcessed, setLastProcessed] = useState<string | null>(null);
    const pollingRef = useRef<NodeJS.Timeout | null>(null);

    const fetchData = useCallback(async () => {
        const [txnData, statsData] = await Promise.all([
            getFraudTransactions(30),
            getFraudStats()
        ]);
        setTransactions(txnData.transactions);
        setStats(statsData);
    }, []);

    const processNext = useCallback(async () => {
        if (isProcessing) return;
        setIsProcessing(true);
        const result = await processNextTransaction();
        if (result.success && result.transaction) {
            setLastProcessed(result.transaction.transaction_id);
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

    const formatAmount = (amount: number) => {
        if (amount >= 100000) {
            return `Rs ${(amount / 100000).toFixed(1)}L`;
        } else if (amount >= 1000) {
            return `Rs ${(amount / 1000).toFixed(1)}K`;
        }
        return `Rs ${amount.toLocaleString()}`;
    };

    const getVerdictConfig = (verdict: string) => {
        switch (verdict) {
            case "HIGH_RISK":
                return {
                    color: "text-red-600",
                    bg: "bg-red-50",
                    border: "border-red-200",
                    icon: Warning,
                    label: "HIGH RISK"
                };
            case "SUSPICIOUS":
                return {
                    color: "text-amber-600",
                    bg: "bg-amber-50",
                    border: "border-amber-200",
                    icon: ShieldWarning,
                    label: "SUSPICIOUS"
                };
            default:
                return {
                    color: "text-emerald-600",
                    bg: "bg-emerald-50",
                    border: "border-emerald-200",
                    icon: ShieldCheck,
                    label: "SAFE"
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
                    <h1 className="text-3xl font-bold text-text-main">Shield (Fraud Detection)</h1>
                    <p className="text-text-muted mt-2">Real-time transaction monitoring and fraud detection.</p>
                </div>
                <div className="flex items-center gap-3">
                    {isProcessing ? (
                        <span className="flex items-center gap-2 text-sm text-primary">
                            <CircleNotch size={16} className="animate-spin" />
                            Analyzing...
                        </span>
                    ) : (
                        <span className="flex items-center gap-2 text-sm text-emerald-600">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Live Monitoring
                        </span>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard
                    label="Total Analyzed"
                    value={stats?.total_transactions ?? 0}
                    subValue="transactions"
                />
                <StatCard
                    label="Safe"
                    value={stats?.safe_count ?? 0}
                    subValue={stats?.total_transactions ? `${((stats.safe_count / stats.total_transactions) * 100).toFixed(1)}%` : "0%"}
                />
                <StatCard
                    label="Flagged"
                    value={(stats?.suspicious_count ?? 0) + (stats?.high_risk_count ?? 0)}
                    subValue={`${stats?.suspicious_count ?? 0} suspicious, ${stats?.high_risk_count ?? 0} high risk`}
                />
                <StatCard
                    label="Avg Latency"
                    value={stats?.avg_processing_time_ms ? `${stats.avg_processing_time_ms.toFixed(0)}ms` : "0ms"}
                    subValue="processing time"
                />
            </div>

            {stats && Object.keys(stats.fraud_type_breakdown).length > 0 && (
                <Card className="mb-8 p-6">
                    <h3 className="text-lg font-semibold text-text-main mb-4">Fraud Type Breakdown</h3>
                    <div className="flex flex-wrap gap-3">
                        {Object.entries(stats.fraud_type_breakdown).map(([type, count]) => (
                            <div
                                key={type}
                                className="px-4 py-2 rounded-lg bg-red-50 border border-red-200"
                            >
                                <span className="text-sm font-medium text-red-700">{type.replace(/_/g, " ")}</span>
                                <span className="ml-2 text-sm text-red-600 font-bold">{count}</span>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-text-main">Transaction History</h3>
                    <span className="text-sm text-text-muted">{transactions.length} transactions</span>
                </div>

                {transactions.length === 0 ? (
                    <div className="text-center py-12 text-text-muted">
                        <ShieldCheck size={48} className="mx-auto mb-4 opacity-50" />
                        <p>No transactions processed yet.</p>
                        <p className="text-sm mt-1">Transactions will appear here automatically.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <AnimatePresence mode="popLayout">
                            {transactions.map((txn, index) => {
                                const config = getVerdictConfig(txn.verdict);
                                const Icon = config.icon;
                                const isNew = txn.transaction_id === lastProcessed;

                                return (
                                    <motion.button
                                        key={txn.transaction_id}
                                        initial={isNew ? { opacity: 0, y: -20, scale: 0.95 } : false}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.3 }}
                                        onClick={() => router.push(`/shield/${txn.transaction_id}`)}
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
                                                            {txn.transaction_id}
                                                        </span>
                                                        <span className={cn(
                                                            "px-2 py-0.5 rounded text-xs font-semibold",
                                                            config.bg, config.color
                                                        )}>
                                                            {config.label}
                                                        </span>
                                                        {txn.fraud_type && (
                                                            <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                                                                {txn.fraud_type.replace(/_/g, " ")}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-4 mt-1 text-sm text-text-muted">
                                                        <span className="font-medium text-text-main">{formatAmount(txn.amount)}</span>
                                                        <span>{txn.type}</span>
                                                        <span>to {txn.destination_name}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <div className="text-sm font-medium text-text-main">
                                                        Risk: {txn.risk_score}%
                                                    </div>
                                                    <div className="flex items-center gap-1 text-xs text-text-muted">
                                                        <Clock size={12} />
                                                        {formatDate(txn.created_at)}
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
