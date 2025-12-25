"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getFraudTransactionById, type FraudTransactionDetail } from "@/lib/api";
import { ArrowLeft, ShieldCheck, ShieldWarning, Warning, CheckCircle, CircleNotch, CaretDown, CaretUp, MapPin, DeviceMobile, User, Bank, Clock, Wallet } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export default function TransactionDetailPage() {
    const params = useParams();
    const router = useRouter();
    const transactionId = params.id as string;

    const [transaction, setTransaction] = useState<FraudTransactionDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [showRawData, setShowRawData] = useState(false);

    useEffect(() => {
        async function fetchTransaction() {
            const data = await getFraudTransactionById(transactionId);
            setTransaction(data);
            setLoading(false);
        }
        fetchTransaction();
    }, [transactionId]);

    const getVerdictConfig = (verdict: string) => {
        switch (verdict) {
            case "HIGH_RISK":
                return {
                    color: "text-red-600",
                    bg: "bg-red-50",
                    border: "border-red-300",
                    icon: Warning,
                    label: "HIGH RISK"
                };
            case "SUSPICIOUS":
                return {
                    color: "text-amber-600",
                    bg: "bg-amber-50",
                    border: "border-amber-300",
                    icon: ShieldWarning,
                    label: "SUSPICIOUS"
                };
            default:
                return {
                    color: "text-emerald-600",
                    bg: "bg-emerald-50",
                    border: "border-emerald-300",
                    icon: ShieldCheck,
                    label: "SAFE"
                };
        }
    };

    const formatAmount = (amount: number) => {
        return `Rs ${amount.toLocaleString("en-IN")}`;
    };

    const formatDate = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        });
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <CircleNotch size={48} className="text-primary animate-spin" />
                </div>
            </DashboardLayout>
        );
    }

    if (!transaction) {
        return (
            <DashboardLayout>
                <div className="text-center py-12">
                    <p className="text-text-muted">Transaction not found.</p>
                    <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
                </div>
            </DashboardLayout>
        );
    }

    const config = getVerdictConfig(transaction.verdict);
    const Icon = config.icon;
    const ruleFlags = transaction.rule_flags_list || [];
    const mlFeatures = transaction.ml_features_dict || {};
    const txnData = transaction.transaction_data as Record<string, unknown> | undefined;

    // Extract nested data
    const sourceAccount = txnData?.source_account as Record<string, unknown> | undefined;
    const destination = txnData?.destination as Record<string, unknown> | undefined;
    const riskSignals = txnData?.risk_signals as Record<string, unknown> | undefined;

    return (
        <DashboardLayout>
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => router.back()} leftIcon={<ArrowLeft />}>
                        Back
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-text-main font-mono">{transaction.transaction_id}</h1>
                        <p className="text-text-muted mt-1">Analyzed on {formatDate(transaction.created_at)}</p>
                    </div>
                </div>
                <div className={cn("flex items-center gap-3 px-4 py-2 rounded-lg border-2", config.bg, config.border)}>
                    <Icon size={24} weight="fill" className={config.color} />
                    <span className={cn("font-bold", config.color)}>{config.label}</span>
                    <span className="text-text-main font-mono">Risk: {transaction.risk_score}%</span>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Card className="p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <Wallet size={20} className="text-primary" />
                        <span className="text-sm font-semibold text-text-muted uppercase">Amount</span>
                    </div>
                    <p className="text-2xl font-bold text-text-main">{formatAmount(transaction.amount)}</p>
                    <p className="text-sm text-text-muted mt-1">{transaction.type} • {(txnData?.channel as string) || "N/A"}</p>
                </Card>
                <Card className="p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <User size={20} className="text-primary" />
                        <span className="text-sm font-semibold text-text-muted uppercase">Destination</span>
                    </div>
                    <p className="text-lg font-bold text-text-main truncate">{transaction.destination_name}</p>
                    <p className="text-sm text-text-muted mt-1">{(destination?.relationship as string) || "unknown"}</p>
                </Card>
                <Card className="p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <Clock size={20} className="text-primary" />
                        <span className="text-sm font-semibold text-text-muted uppercase">Processing</span>
                    </div>
                    <p className="text-lg font-bold text-text-main">{transaction.processing_time_ms.toFixed(0)}ms</p>
                    <p className="text-sm text-text-muted mt-1">Tier {transaction.tier_reached} analysis</p>
                </Card>
                <Card className="p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <MapPin size={20} className="text-primary" />
                        <span className="text-sm font-semibold text-text-muted uppercase">Location</span>
                    </div>
                    <p className="text-lg font-bold text-text-main">{(sourceAccount?.location as string) || "N/A"}</p>
                    <p className="text-sm text-text-muted mt-1">→ {(destination?.location as string) || "N/A"}</p>
                </Card>
            </div>

            {/* Source & Destination Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <Card className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Bank size={24} className="text-blue-600" />
                        <h3 className="text-lg font-semibold text-text-main">Source Account</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-text-muted uppercase">Account ID</p>
                            <p className="text-sm font-medium text-text-main font-mono">{transaction.source_account_id}</p>
                        </div>
                        <div>
                            <p className="text-xs text-text-muted uppercase">Bank</p>
                            <p className="text-sm font-medium text-text-main">{(sourceAccount?.bank_name as string) || "N/A"}</p>
                        </div>
                        <div>
                            <p className="text-xs text-text-muted uppercase">Account Age</p>
                            <p className="text-sm font-medium text-text-main">{(sourceAccount?.account_age_days as number) || 0} days</p>
                        </div>
                        <div>
                            <p className="text-xs text-text-muted uppercase">Avg Monthly Balance</p>
                            <p className="text-sm font-medium text-text-main">{formatAmount((sourceAccount?.avg_monthly_balance as number) || 0)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-text-muted uppercase">Transactions (30d)</p>
                            <p className="text-sm font-medium text-text-main">{(sourceAccount?.total_transactions_30d as number) || 0}</p>
                        </div>
                        <div>
                            <p className="text-xs text-text-muted uppercase">KYC Status</p>
                            <p className={cn("text-sm font-medium",
                                (sourceAccount?.kyc_status as string) === "verified" ? "text-emerald-600" : "text-amber-600"
                            )}>{(sourceAccount?.kyc_status as string) || "N/A"}</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <User size={24} className="text-purple-600" />
                        <h3 className="text-lg font-semibold text-text-main">Destination</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-text-muted uppercase">Name</p>
                            <p className="text-sm font-medium text-text-main">{transaction.destination_name}</p>
                        </div>
                        <div>
                            <p className="text-xs text-text-muted uppercase">Bank</p>
                            <p className="text-sm font-medium text-text-main">{(destination?.bank_name as string) || "N/A"}</p>
                        </div>
                        <div>
                            <p className="text-xs text-text-muted uppercase">Relationship</p>
                            <p className={cn("text-sm font-medium",
                                (destination?.relationship as string) === "unknown" ? "text-red-600" : "text-text-main"
                            )}>{(destination?.relationship as string) || "unknown"}</p>
                        </div>
                        <div>
                            <p className="text-xs text-text-muted uppercase">Known Beneficiary</p>
                            <p className={cn("text-sm font-medium",
                                (destination?.is_known_beneficiary as boolean) ? "text-emerald-600" : "text-red-600"
                            )}>{(destination?.is_known_beneficiary as boolean) ? "Yes" : "No"}</p>
                        </div>
                        <div>
                            <p className="text-xs text-text-muted uppercase">Location</p>
                            <p className="text-sm font-medium text-text-main">{(destination?.location as string) || "N/A"}</p>
                        </div>
                        <div>
                            <p className="text-xs text-text-muted uppercase">MCC</p>
                            <p className="text-sm font-medium text-text-main font-mono">{(destination?.merchant_category_code as string) || "N/A"}</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Risk Signals */}
            {riskSignals && (
                <Card className="p-6 mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <DeviceMobile size={24} className="text-amber-600" />
                        <h3 className="text-lg font-semibold text-text-main">Risk Signals</h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-text-muted uppercase">IP Risk Score</p>
                            <p className={cn("text-xl font-bold",
                                (riskSignals?.ip_risk_score as number) > 50 ? "text-red-600" :
                                    (riskSignals?.ip_risk_score as number) > 30 ? "text-amber-600" : "text-emerald-600"
                            )}>{(riskSignals?.ip_risk_score as number) || 0}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-text-muted uppercase">Device Changed</p>
                            <p className={cn("text-xl font-bold",
                                (riskSignals?.device_change_flag as boolean) ? "text-red-600" : "text-emerald-600"
                            )}>{(riskSignals?.device_change_flag as boolean) ? "Yes" : "No"}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-text-muted uppercase">Velocity (10m)</p>
                            <p className={cn("text-xl font-bold",
                                (riskSignals?.velocity_txn_last_10min as number) > 3 ? "text-red-600" : "text-text-main"
                            )}>{(riskSignals?.velocity_txn_last_10min as number) || 0} txns</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-text-muted uppercase">Amount (1hr)</p>
                            <p className="text-xl font-bold text-text-main">{formatAmount((riskSignals?.velocity_amt_last_1hr as number) || 0)}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-text-muted uppercase">Failed (24hr)</p>
                            <p className={cn("text-xl font-bold",
                                (riskSignals?.failed_txn_count_24hr as number) > 2 ? "text-red-600" : "text-text-main"
                            )}>{(riskSignals?.failed_txn_count_24hr as number) || 0}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-text-muted uppercase">Session</p>
                            <p className={cn("text-xl font-bold",
                                (riskSignals?.session_duration_seconds as number) < 30 ? "text-red-600" : "text-text-main"
                            )}>{(riskSignals?.session_duration_seconds as number) || 0}s</p>
                        </div>
                    </div>
                </Card>
            )}

            {/* Risk Analysis */}
            <div className="space-y-6 mb-8">
                {ruleFlags.length > 0 && (
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold text-text-main mb-4">Risk Indicators Detected</h3>
                        <div className="flex flex-wrap gap-2">
                            {ruleFlags.map((flag, i) => (
                                <span
                                    key={i}
                                    className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium"
                                >
                                    {flag.replace(/_/g, " ")}
                                </span>
                            ))}
                        </div>
                    </Card>
                )}

                {transaction.tier_reached >= 2 && transaction.ml_score !== null && (
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold text-text-main mb-4">Risk Analysis Score</h3>
                        <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-text-muted">Overall Risk Score</span>
                                <span className="font-bold text-text-main">{transaction.ml_score?.toFixed(0) ?? "N/A"}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                                <div
                                    className={cn(
                                        "h-full rounded-full transition-all",
                                        (transaction.ml_score ?? 0) > 70 ? "bg-red-500" :
                                            (transaction.ml_score ?? 0) > 50 ? "bg-amber-500" : "bg-emerald-500"
                                    )}
                                    style={{ width: `${transaction.ml_score ?? 0}%` }}
                                />
                            </div>
                        </div>
                    </Card>
                )}

                {transaction.tier_reached >= 3 && transaction.ai_reasoning && (
                    <Card className={cn("p-6 border-2",
                        transaction.verdict === "HIGH_RISK" ? "border-red-200 bg-red-50/30" :
                            transaction.verdict === "SUSPICIOUS" ? "border-amber-200 bg-amber-50/30" : "border-emerald-200 bg-emerald-50/30"
                    )}>
                        <h3 className="text-lg font-semibold text-text-main mb-4">AI Assessment</h3>
                        {transaction.fraud_type && transaction.fraud_type.toUpperCase() !== "LEGITIMATE" && (
                            <div className="mb-4">
                                <span className="px-3 py-1.5 rounded-lg bg-red-100 border border-red-300 text-red-700 font-semibold">
                                    {transaction.fraud_type.replace(/_/g, " ")}
                                </span>
                            </div>
                        )}
                        <div className="bg-white rounded-lg p-4 border">
                            <h4 className="text-sm font-semibold text-text-muted mb-2">Analysis</h4>
                            <p className="text-text-main leading-relaxed whitespace-pre-wrap">
                                {transaction.ai_reasoning}
                            </p>
                        </div>
                    </Card>
                )}
            </div>

            {/* Collapsible Raw Data */}
            {txnData && (
                <Card className="p-6">
                    <button
                        onClick={() => setShowRawData(!showRawData)}
                        className="w-full flex items-center justify-between text-left"
                    >
                        <h3 className="text-lg font-semibold text-text-main">Raw Transaction Data</h3>
                        {showRawData ? (
                            <CaretUp size={20} className="text-text-muted" />
                        ) : (
                            <CaretDown size={20} className="text-text-muted" />
                        )}
                    </button>
                    {showRawData && (
                        <pre className="mt-4 bg-gray-50 rounded-lg p-4 overflow-x-auto text-sm text-text-main">
                            {JSON.stringify(txnData, null, 2)}
                        </pre>
                    )}
                </Card>
            )}
        </DashboardLayout>
    );
}

