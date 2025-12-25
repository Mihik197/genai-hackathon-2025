"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getCreditAssessmentById, type CreditAssessmentDetail } from "@/lib/api";
import { ArrowLeft, User, ChartBar, Warning, CheckCircle, XCircle } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export default function CreditAssessmentDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [assessment, setAssessment] = useState<CreditAssessmentDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAssessment = async () => {
            if (params.id) {
                const data = await getCreditAssessmentById(params.id as string);
                setAssessment(data);
            }
            setLoading(false);
        };
        fetchAssessment();
    }, [params.id]);

    const getRiskConfig = (band: string) => {
        switch (band) {
            case "High":
                return {
                    color: "text-red-600",
                    bg: "bg-red-50",
                    border: "border-red-200",
                    barColor: "bg-red-500",
                    icon: Warning,
                    label: "HIGH RISK"
                };
            case "Moderate":
                return {
                    color: "text-amber-600",
                    bg: "bg-amber-50",
                    border: "border-amber-200",
                    barColor: "bg-amber-500",
                    icon: ChartBar,
                    label: "MODERATE RISK"
                };
            default:
                return {
                    color: "text-emerald-600",
                    bg: "bg-emerald-50",
                    border: "border-emerald-200",
                    barColor: "bg-emerald-500",
                    icon: User,
                    label: "LOW RISK"
                };
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="animate-pulse text-text-muted">Loading assessment...</div>
                </div>
            </DashboardLayout>
        );
    }

    if (!assessment) {
        return (
            <DashboardLayout>
                <div className="text-center py-12">
                    <p className="text-text-muted">Assessment not found.</p>
                    <Button variant="secondary" onClick={() => router.push("/inclusion")} className="mt-4">
                        Back to Inclusion
                    </Button>
                </div>
            </DashboardLayout>
        );
    }

    const config = getRiskConfig(assessment.risk_band);
    const Icon = config.icon;
    const applicant = assessment.applicant_data as Record<string, unknown> | undefined;

    return (
        <DashboardLayout>
            <div className="mb-6">
                <Button
                    variant="ghost"
                    onClick={() => router.push("/inclusion")}
                    className="flex items-center gap-2 text-text-muted hover:text-text-main"
                >
                    <ArrowLeft size={16} />
                    Back to Assessments
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card className={cn("p-6 border-2", config.border)}>
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className={cn("p-3 rounded-xl", config.bg)}>
                                    <Icon size={32} weight="fill" className={config.color} />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-text-main">{assessment.user_id}</h1>
                                    <p className="text-text-muted capitalize">{assessment.occupation}, {assessment.age} years</p>
                                </div>
                            </div>
                            <div className={cn("px-4 py-2 rounded-lg text-sm font-bold", config.bg, config.color)}>
                                {config.label}
                            </div>
                        </div>

                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-text-muted">Credit Score</span>
                                <span className="text-3xl font-bold text-text-main">{assessment.final_score}</span>
                            </div>
                            <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className={cn("h-full rounded-full transition-all duration-500", config.barColor)}
                                    style={{ width: `${(assessment.final_score / 1000) * 100}%` }}
                                />
                            </div>
                            <div className="flex justify-between mt-1 text-xs text-text-muted">
                                <span>0</span>
                                <span>350</span>
                                <span>700</span>
                                <span>1000</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                            <div className="text-center p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-text-muted mb-1">Rule Score</p>
                                <p className="text-xl font-semibold text-text-main">{assessment.rule_score}</p>
                            </div>
                            <div className="text-center p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-text-muted mb-1">ML Score</p>
                                <p className="text-xl font-semibold text-text-main">{assessment.ml_score}</p>
                            </div>
                        </div>
                    </Card>

                    {assessment.reason_codes_list && assessment.reason_codes_list.length > 0 && (
                        <Card className="p-6">
                            <h3 className="text-lg font-semibold text-text-main mb-4">Risk Factors</h3>
                            <div className="space-y-2">
                                {assessment.reason_codes_list.map((code, idx) => (
                                    <div key={idx} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                                        <XCircle size={20} className="text-red-500 shrink-0 mt-0.5" weight="fill" />
                                        <span className="text-sm text-red-700">{code}</span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}

                    {(!assessment.reason_codes_list || assessment.reason_codes_list.length === 0) && (
                        <Card className="p-6">
                            <h3 className="text-lg font-semibold text-text-main mb-4">Risk Factors</h3>
                            <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                                <CheckCircle size={20} className="text-emerald-500" weight="fill" />
                                <span className="text-sm text-emerald-700">No significant risk factors identified</span>
                            </div>
                        </Card>
                    )}
                </div>

                <div className="space-y-6">
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold text-text-main mb-4">Applicant Profile</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between py-2 border-b border-gray-50">
                                <span className="text-text-muted">User ID</span>
                                <span className="font-mono text-text-main">{assessment.user_id}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-50">
                                <span className="text-text-muted">Age</span>
                                <span className="text-text-main">{assessment.age} years</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-50">
                                <span className="text-text-muted">Occupation</span>
                                <span className="text-text-main capitalize">{assessment.occupation}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-50">
                                <span className="text-text-muted">Monthly Income</span>
                                <span className="text-text-main">Rs {assessment.monthly_income?.toLocaleString()}</span>
                            </div>
                            {applicant && (
                                <>
                                    <div className="flex justify-between py-2 border-b border-gray-50">
                                        <span className="text-text-muted">Account Age</span>
                                        <span className="text-text-main">{applicant.account_age_months as number} months</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-gray-50">
                                        <span className="text-text-muted">Transactions (30d)</span>
                                        <span className="text-text-main">{applicant.transaction_count_30d as number}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-gray-50">
                                        <span className="text-text-muted">Chargebacks</span>
                                        <span className="text-text-main">{applicant.chargeback_count as number}</span>
                                    </div>
                                    <div className="flex justify-between py-2">
                                        <span className="text-text-muted">Location Risk</span>
                                        <span className="text-text-main">{((applicant.location_risk_score as number) * 100).toFixed(0)}%</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </Card>

                    <Card className="p-6">
                        <h3 className="text-lg font-semibold text-text-main mb-4">Model Details</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between py-2 border-b border-gray-50">
                                <span className="text-text-muted">Assessment ID</span>
                                <span className="font-mono text-xs text-text-main">{assessment.assessment_id}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-50">
                                <span className="text-text-muted">ML Probability</span>
                                <span className="text-text-main">{(assessment.ml_probability * 100).toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-50">
                                <span className="text-text-muted">Processing Time</span>
                                <span className="text-text-main">{assessment.processing_time_ms.toFixed(1)}ms</span>
                            </div>
                            <div className="flex justify-between py-2">
                                <span className="text-text-muted">Score Fusion</span>
                                <span className="text-text-main">60% ML + 40% Rule</span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
