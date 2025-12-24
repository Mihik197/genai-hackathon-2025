"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
    analyzeRegulationStream,
    getAnalysisHistory,
    getAnalysisById,
    getPolicies,
    type ComplianceReport as ReportType,
    type AnalysisHistoryItem,
    type ProgressEvent,
    type PoliciesByCategory,
} from "@/lib/api";
import { FileUpload } from "@/components/comply/FileUpload";
import { ComplianceReport } from "@/components/comply/ComplianceReport";
import { CircleNotch, ArrowLeft, ClockCounterClockwise, CaretDown, CaretUp, CheckCircle, Warning, WarningCircle, Clock, GearSix } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";
import { PolicyManager } from "@/components/comply/PolicyManager";

export default function ComplyPage() {
    const [viewState, setViewState] = useState<"UPLOAD" | "ANALYZING" | "RESULT">("UPLOAD");
    const [report, setReport] = useState<ReportType | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
    const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [historyExpanded, setHistoryExpanded] = useState(false);
    const [progressStep, setProgressStep] = useState<string>("");
    const [progressMessage, setProgressMessage] = useState<string>("");
    const [progressCurrent, setProgressCurrent] = useState<number>(0);
    const [progressTotal, setProgressTotal] = useState<number>(0);
    const [showPolicyModal, setShowPolicyModal] = useState(false);
    const [policies, setPolicies] = useState<PoliciesByCategory>({});

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        const data = await getAnalysisHistory();
        setHistory(data.analyses);
    };

    const fetchPolicies = async () => {
        const data = await getPolicies();
        setPolicies(data);
    };

    const openPolicyModal = () => {
        fetchPolicies();
        setShowPolicyModal(true);
    };

    const handleFileSelect = async (file: File) => {
        setViewState("ANALYZING");
        setErrorMsg(null);
        setSelectedHistoryId(null);
        setProgressStep("");
        setProgressMessage("Starting analysis...");
        setProgressCurrent(0);
        setProgressTotal(0);

        const result = await analyzeRegulationStream(file, (event: ProgressEvent) => {
            if (event.type === "progress") {
                setProgressStep(event.step || "");
                setProgressMessage(event.message || "");
                if (event.current !== undefined) setProgressCurrent(event.current);
                if (event.total !== undefined) setProgressTotal(event.total);
            }
        });

        if (result.success && result.report) {
            setReport(result.report);
            setViewState("RESULT");
            fetchHistory();
        } else {
            setErrorMsg(result.error || "An unknown error occurred during analysis.");
            setViewState("UPLOAD");
        }
    };

    const handleHistorySelect = async (id: string) => {
        setLoadingHistory(true);
        setSelectedHistoryId(id);
        const data = await getAnalysisById(id);
        if (data?.report) {
            setReport(data.report);
            setViewState("RESULT");
        }
        setLoadingHistory(false);
    };

    const resetAnalysis = () => {
        setReport(null);
        setViewState("UPLOAD");
        setErrorMsg(null);
        setSelectedHistoryId(null);
    };

    const statusConfig = {
        COMPLIANT: { icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
        PARTIALLY_COMPLIANT: { icon: Warning, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
        NON_COMPLIANT: { icon: WarningCircle, color: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
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

    const displayedHistory = historyExpanded ? history : history.slice(0, 3);

    return (
        <DashboardLayout>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-text-main">Comply (RegTech)</h1>
                    <p className="text-text-muted mt-2">Automated regulatory gap analysis and policy compliance.</p>
                </div>
                {viewState === "RESULT" && (
                    <Button variant="secondary" onClick={resetAnalysis} leftIcon={<ArrowLeft />}>
                        New Analysis
                    </Button>
                )}
                {viewState !== "ANALYZING" && (
                    <Button variant="outline" onClick={openPolicyModal} leftIcon={<GearSix />}>
                        Manage Policies
                    </Button>
                )}
            </div>

            <AnimatePresence mode="wait">
                {viewState === "UPLOAD" && (
                    <motion.div
                        key="upload"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-8"
                    >
                        <div className="flex flex-col items-center justify-center min-h-[350px]">
                            <FileUpload onFileSelect={handleFileSelect} />
                            {errorMsg && (
                                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 max-w-md text-center text-sm">
                                    <span className="font-bold block mb-1">Analysis Failed</span>
                                    {errorMsg}
                                </div>
                            )}

                            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl opacity-60">
                                {["Upload Circular", "AI Checks Policies", "Get Action Items"].map((step, i) => (
                                    <div key={i} className="flex flex-col items-center text-center gap-2">
                                        <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                                            {i + 1}
                                        </span>
                                        <p className="text-sm font-medium text-text-muted">{step}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* History Section - Below Upload */}
                        {history.length > 0 && (
                            <div className="border-t border-border pt-8">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-text-main flex items-center gap-2">
                                        <ClockCounterClockwise size={20} className="text-text-muted" />
                                        Recent Analyses
                                        <span className="text-sm font-normal text-text-muted">({history.length})</span>
                                    </h3>
                                    {history.length > 3 && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setHistoryExpanded(!historyExpanded)}
                                            rightIcon={historyExpanded ? <CaretUp size={16} /> : <CaretDown size={16} />}
                                        >
                                            {historyExpanded ? "Show Less" : "Show All"}
                                        </Button>
                                    )}
                                </div>

                                {loadingHistory ? (
                                    <div className="flex justify-center py-8">
                                        <CircleNotch size={24} className="text-primary animate-spin" />
                                    </div>
                                ) : (
                                    <motion.div
                                        layout
                                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                                    >
                                        <AnimatePresence>
                                            {displayedHistory.map((analysis, index) => {
                                                const config = statusConfig[analysis.overall_status] || statusConfig.NON_COMPLIANT;
                                                const StatusIcon = config.icon;
                                                const isSelected = selectedHistoryId === analysis.id;

                                                return (
                                                    <motion.button
                                                        key={analysis.id}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, scale: 0.95 }}
                                                        transition={{ delay: index * 0.05 }}
                                                        onClick={() => handleHistorySelect(analysis.id)}
                                                        className={cn(
                                                            "w-full text-left p-4 rounded-xl border-2 transition-all duration-200 bg-surface hover:shadow-lg hover:-translate-y-0.5",
                                                            isSelected
                                                                ? "border-primary shadow-lg"
                                                                : `${config.border} hover:border-primary/50`
                                                        )}
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <div className={cn("p-2.5 rounded-lg shrink-0", config.bg)}>
                                                                <StatusIcon size={20} weight="fill" className={config.color} />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-semibold text-text-main line-clamp-2 text-sm leading-snug">
                                                                    {analysis.regulation_title || analysis.filename}
                                                                </p>
                                                                {analysis.regulation_reference && (
                                                                    <p className="text-xs text-text-muted mt-1 font-mono">
                                                                        {analysis.regulation_reference}
                                                                    </p>
                                                                )}
                                                                <div className="flex items-center gap-3 mt-3 text-xs">
                                                                    <span className="flex items-center gap-1 text-text-muted">
                                                                        <Clock size={12} />
                                                                        {formatDate(analysis.created_at)}
                                                                    </span>
                                                                    {analysis.gaps_count > 0 && (
                                                                        <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold">
                                                                            {analysis.gaps_count} gap{analysis.gaps_count > 1 ? "s" : ""}
                                                                        </span>
                                                                    )}
                                                                    {analysis.gaps_count === 0 && (
                                                                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
                                                                            Compliant
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </motion.button>
                                                );
                                            })}
                                        </AnimatePresence>
                                    </motion.div>
                                )}
                            </div>
                        )}
                    </motion.div>
                )}

                {viewState === "ANALYZING" && (
                    <motion.div
                        key="analyzing"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center min-h-[450px] text-center"
                    >
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse"></div>
                            <CircleNotch size={64} className="text-primary animate-spin relative z-10" />
                        </div>
                        <h2 className="text-2xl font-bold text-text-main mt-8">
                            {progressStep === "analyzing" && progressTotal > 0
                                ? `Analyzing Policy ${progressCurrent}/${progressTotal}`
                                : "Analyzing Document..."}
                        </h2>
                        <p className="text-text-muted mt-2 max-w-md">
                            {progressMessage || "Reading the regulation, fetching relevant policies, and identifying compliance gaps."}
                        </p>
                        {progressStep === "analyzing" && progressTotal > 0 && (
                            <div className="mt-6 max-w-xs w-full">
                                <div className="flex justify-between text-xs text-text-muted mb-1">
                                    <span>Progress</span>
                                    <span>{Math.round((progressCurrent / progressTotal) * 100)}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                    <motion.div
                                        className="h-full bg-primary rounded-full"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(progressCurrent / progressTotal) * 100}%` }}
                                        transition={{ duration: 0.3 }}
                                    />
                                </div>
                            </div>
                        )}
                        {progressStep !== "analyzing" && (
                            <div className="mt-8 max-w-xs w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                <div className="h-full bg-primary rounded-full w-1/3 animate-[loading-bar_2s_ease-in-out_infinite]"></div>
                            </div>
                        )}
                        <div className="mt-8 flex flex-col gap-2 text-sm">
                            {["upload", "categorizing", "categorized", "retrieving", "retrieved", "analyzing", "aggregating"].map((step, i) => {
                                const stepLabels: Record<string, string> = {
                                    upload: "Document uploaded",
                                    categorizing: "Reading regulation...",
                                    categorized: "Categories identified",
                                    retrieving: "Finding policies...",
                                    retrieved: "Policies found",
                                    analyzing: "Analyzing policies...",
                                    aggregating: "Generating report...",
                                };
                                const steps = ["upload", "categorizing", "categorized", "retrieving", "retrieved", "analyzing", "aggregating"];
                                const currentIdx = steps.indexOf(progressStep);
                                const stepIdx = steps.indexOf(step);
                                const isComplete = stepIdx < currentIdx;
                                const isCurrent = step === progressStep;

                                return (
                                    <div key={step} className={cn(
                                        "flex items-center gap-2 transition-all",
                                        isComplete ? "text-emerald-600" : isCurrent ? "text-primary font-medium" : "text-gray-400"
                                    )}>
                                        {isComplete ? (
                                            <CheckCircle size={16} weight="fill" />
                                        ) : isCurrent ? (
                                            <CircleNotch size={16} className="animate-spin" />
                                        ) : (
                                            <div className="w-4 h-4 rounded-full border-2 border-current" />
                                        )}
                                        <span>{stepLabels[step]}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                {viewState === "RESULT" && report && (
                    <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <ComplianceReport report={report} />
                    </motion.div>
                )}
            </AnimatePresence>

            <Modal
                isOpen={showPolicyModal}
                onClose={() => setShowPolicyModal(false)}
                title="Manage Bank Policies"
            >
                <PolicyManager policies={policies} onRefresh={fetchPolicies} />
            </Modal>
        </DashboardLayout>
    );
}
