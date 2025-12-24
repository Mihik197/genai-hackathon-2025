"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
    generateStrategyStream,
    getStrategyHistory,
    getStrategyById,
    type InvestmentStrategy,
    type StrategyHistoryItem,
    type InvestProgressEvent,
    type StrategyRequest,
} from "@/lib/api";
import { CircleNotch, ArrowLeft, ClockCounterClockwise, CaretDown, CaretUp, CheckCircle, Clock, Lightning, ChartLineUp, ShieldCheck, Coins, Target, Warning, MagnifyingGlass, FileText } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type RiskTolerance = "conservative" | "moderate" | "aggressive";
type InvestmentHorizon = "short" | "medium" | "long";

export default function AdvisorPage() {
    const [viewState, setViewState] = useState<"CONFIGURE" | "GENERATING" | "RESULT">("CONFIGURE");
    const [strategy, setStrategy] = useState<InvestmentStrategy | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [history, setHistory] = useState<StrategyHistoryItem[]>([]);
    const [historyExpanded, setHistoryExpanded] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const [tickerOrSector, setTickerOrSector] = useState("");
    const [riskTolerance, setRiskTolerance] = useState<RiskTolerance>("moderate");
    const [investmentHorizon, setInvestmentHorizon] = useState<InvestmentHorizon>("medium");
    const [focusAreas, setFocusAreas] = useState("");

    const [progressSteps, setProgressSteps] = useState<Record<string, "pending" | "running" | "complete">>({
        data_search_agent: "pending",
        data_format_agent: "pending",
        trading_analyst: "pending",
        execution_analyst: "pending",
        risk_analyst: "pending",
    });
    const [currentMessage, setCurrentMessage] = useState("");

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        const data = await getStrategyHistory();
        setHistory(data.strategies);
    };

    const handleGenerate = async () => {
        if (!tickerOrSector.trim()) {
            setErrorMsg("Please enter a ticker symbol or sector to analyze.");
            return;
        }

        setViewState("GENERATING");
        setErrorMsg(null);
        setCurrentMessage("Initializing strategy generation...");
        setProgressSteps({
            data_search_agent: "pending",
            data_format_agent: "pending",
            trading_analyst: "pending",
            execution_analyst: "pending",
            risk_analyst: "pending",
        });

        const request: StrategyRequest = {
            ticker_or_sector: tickerOrSector.trim(),
            risk_tolerance: riskTolerance,
            investment_horizon: investmentHorizon,
            focus_areas: focusAreas.trim() || undefined,
        };

        const result = await generateStrategyStream(request, (event: InvestProgressEvent) => {
            if (event.type === "progress") {
                setCurrentMessage(event.message || "");
                if (event.step && event.status) {
                    setProgressSteps(prev => ({
                        ...prev,
                        [event.step!]: event.status!,
                    }));
                }
            }
        });

        if (result.success && result.strategy) {
            setStrategy(result.strategy);
            setViewState("RESULT");
            fetchHistory();
        } else {
            setErrorMsg(result.error || "An unknown error occurred during strategy generation.");
            setViewState("CONFIGURE");
        }
    };

    const handleHistorySelect = async (id: string) => {
        setLoadingHistory(true);
        const data = await getStrategyById(id);
        if (data?.strategy_output) {
            setStrategy(data.strategy_output);
            setViewState("RESULT");
        }
        setLoadingHistory(false);
    };

    const resetView = () => {
        setStrategy(null);
        setViewState("CONFIGURE");
        setErrorMsg(null);
    };

    const formatDate = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    const riskOptions: { value: RiskTolerance; label: string; description: string }[] = [
        { value: "conservative", label: "Conservative", description: "Lower risk, stable returns" },
        { value: "moderate", label: "Moderate", description: "Balanced risk-reward" },
        { value: "aggressive", label: "Aggressive", description: "Higher risk, growth focus" },
    ];

    const horizonOptions: { value: InvestmentHorizon; label: string; description: string }[] = [
        { value: "short", label: "Short-term", description: "Less than 1 year" },
        { value: "medium", label: "Medium-term", description: "1-3 years" },
        { value: "long", label: "Long-term", description: "3+ years" },
    ];

    const stepLabels: Record<string, { label: string; icon: React.ReactNode }> = {
        data_search_agent: { label: "Market Data Search", icon: <MagnifyingGlass size={18} /> },
        data_format_agent: { label: "Data Analysis & Analysis", icon: <FileText size={18} /> },
        trading_analyst: { label: "Strategy Generation", icon: <Target size={18} /> },
        execution_analyst: { label: "Execution Planning", icon: <Lightning size={18} /> },
        risk_analyst: { label: "Risk Evaluation", icon: <ShieldCheck size={18} /> },
    };

    const displayedHistory = historyExpanded ? history : history.slice(0, 3);

    return (
        <DashboardLayout>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-text-main">Advisor (Investment Strategy)</h1>
                    <p className="text-text-muted mt-2">AI-powered investment strategy generation for portfolio managers.</p>
                </div>
                {viewState === "RESULT" && (
                    <Button variant="secondary" onClick={resetView} leftIcon={<ArrowLeft />}>
                        New Strategy
                    </Button>
                )}
            </div>

            <AnimatePresence mode="wait">
                {viewState === "CONFIGURE" && (
                    <motion.div
                        key="configure"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-8"
                    >
                        <Card className="p-8">
                            <h2 className="text-xl font-semibold text-text-main mb-6">Generate Investment Strategy</h2>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-text-main mb-2">
                                        What would you like to analyze?
                                    </label>
                                    <input
                                        type="text"
                                        value={tickerOrSector}
                                        onChange={(e) => setTickerOrSector(e.target.value)}
                                        placeholder='e.g. "AAPL", "Indian Banking Sector", "Global Tech"'
                                        className="w-full px-4 py-3 rounded-lg border border-border bg-surface text-text-main placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text-main mb-3">
                                        Risk Tolerance
                                    </label>
                                    <div className="grid grid-cols-3 gap-4">
                                        {riskOptions.map((option) => (
                                            <button
                                                key={option.value}
                                                onClick={() => setRiskTolerance(option.value)}
                                                className={cn(
                                                    "p-4 rounded-lg border-2 text-left transition-all",
                                                    riskTolerance === option.value
                                                        ? "border-primary bg-primary/5"
                                                        : "border-border hover:border-primary/50"
                                                )}
                                            >
                                                <span className="font-medium text-text-main">{option.label}</span>
                                                <p className="text-xs text-text-muted mt-1">{option.description}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text-main mb-3">
                                        Investment Horizon
                                    </label>
                                    <div className="grid grid-cols-3 gap-4">
                                        {horizonOptions.map((option) => (
                                            <button
                                                key={option.value}
                                                onClick={() => setInvestmentHorizon(option.value)}
                                                className={cn(
                                                    "p-4 rounded-lg border-2 text-left transition-all",
                                                    investmentHorizon === option.value
                                                        ? "border-primary bg-primary/5"
                                                        : "border-border hover:border-primary/50"
                                                )}
                                            >
                                                <span className="font-medium text-text-main">{option.label}</span>
                                                <p className="text-xs text-text-muted mt-1">{option.description}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text-main mb-2">
                                        Additional Focus (optional)
                                    </label>
                                    <textarea
                                        value={focusAreas}
                                        onChange={(e) => setFocusAreas(e.target.value)}
                                        placeholder='e.g. "Focus on dividend stocks given current interest rates"'
                                        rows={2}
                                        className="w-full px-4 py-3 rounded-lg border border-border bg-surface text-text-main placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none"
                                    />
                                </div>

                                {errorMsg && (
                                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                                        <span className="font-bold block mb-1">Error</span>
                                        {errorMsg}
                                    </div>
                                )}

                                <Button onClick={handleGenerate} size="lg" className="w-full" leftIcon={<ChartLineUp />}>
                                    Generate Strategy
                                </Button>
                            </div>
                        </Card>

                        {history.length > 0 && (
                            <div className="border-t border-border pt-8">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-text-main flex items-center gap-2">
                                        <ClockCounterClockwise size={20} className="text-text-muted" />
                                        Recent Strategies
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
                                    <div className="grid gap-3">
                                        {displayedHistory.map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() => handleHistorySelect(item.id)}
                                                className="flex items-center justify-between p-4 rounded-lg border border-border bg-surface hover:bg-surface-secondary transition-colors text-left"
                                            >
                                                <div>
                                                    <span className="font-medium text-text-main">{item.strategy_name}</span>
                                                    <div className="flex items-center gap-3 mt-1 text-sm text-text-muted">
                                                        <span className="capitalize">{item.risk_tolerance}</span>
                                                        <span>-</span>
                                                        <span className="capitalize">{item.investment_horizon}-term</span>
                                                    </div>
                                                </div>
                                                <div className="text-right text-sm text-text-muted">
                                                    <div>{formatDate(item.created_at)}</div>
                                                    <div className="flex items-center gap-1 justify-end mt-1">
                                                        <Clock size={12} />
                                                        {item.processing_time.toFixed(1)}s
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                )}

                {viewState === "GENERATING" && (
                    <motion.div
                        key="generating"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <Card className="p-8">
                            <div className="text-center mb-8">
                                <CircleNotch size={48} className="text-primary animate-spin mx-auto mb-4" />
                                <h2 className="text-xl font-semibold text-text-main">
                                    Generating Strategy for {tickerOrSector}
                                </h2>
                                <p className="text-text-muted mt-2">{currentMessage}</p>
                            </div>

                            <div className="space-y-4 max-w-md mx-auto">
                                {Object.entries(stepLabels).map(([key, { label, icon }]) => {
                                    const status = progressSteps[key];
                                    return (
                                        <div
                                            key={key}
                                            className={cn(
                                                "flex items-center gap-4 p-4 rounded-lg border transition-all",
                                                status === "complete" && "border-emerald-200 bg-emerald-50",
                                                status === "running" && "border-primary bg-primary/5",
                                                status === "pending" && "border-border bg-surface opacity-50"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-8 h-8 rounded-full flex items-center justify-center",
                                                status === "complete" && "bg-emerald-500 text-white",
                                                status === "running" && "bg-primary text-white",
                                                status === "pending" && "bg-gray-200 text-gray-400"
                                            )}>
                                                {status === "complete" ? (
                                                    <CheckCircle size={18} weight="bold" />
                                                ) : status === "running" ? (
                                                    <CircleNotch size={18} className="animate-spin" />
                                                ) : (
                                                    icon
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <span className={cn(
                                                    "font-medium",
                                                    status === "complete" && "text-emerald-700",
                                                    status === "running" && "text-primary",
                                                    status === "pending" && "text-text-muted"
                                                )}>
                                                    {label}
                                                </span>
                                            </div>
                                            {status === "complete" && (
                                                <span className="text-xs text-emerald-600 font-medium">Done</span>
                                            )}
                                            {status === "running" && (
                                                <span className="text-xs text-primary font-medium">In Progress</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <p className="text-center text-sm text-text-muted mt-8">
                                The AI is searching the web for the latest market data, news, and insights to create a comprehensive strategy.
                            </p>
                        </Card>
                    </motion.div>
                )}

                {viewState === "RESULT" && strategy && (
                    <motion.div
                        key="result"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6"
                    >
                        <Card className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold text-text-main">{strategy.strategy_name}</h2>
                                    <div className="flex items-center gap-4 mt-2 text-sm text-text-muted">
                                        <span className="capitalize">{strategy.risk_tolerance} Risk</span>
                                        <span>-</span>
                                        <span className="capitalize">{strategy.investment_horizon}-term</span>
                                        <span>-</span>
                                        <span className="flex items-center gap-1">
                                            <Clock size={14} />
                                            {strategy.processing_time?.toFixed(1)}s
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Coins size={24} className="text-primary" />
                                </div>
                            </div>
                        </Card>

                        {strategy.market_analysis && (
                            <Card className="p-6">
                                <h3 className="text-lg font-semibold text-text-main flex items-center gap-2 mb-4">
                                    <ChartLineUp size={20} className="text-primary" />
                                    Market Analysis
                                    {strategy.market_analysis.sentiment && (
                                        <span className={cn(
                                            "ml-2 px-2 py-0.5 rounded text-xs font-medium",
                                            strategy.market_analysis.sentiment === "BULLISH" && "bg-emerald-100 text-emerald-700",
                                            strategy.market_analysis.sentiment === "BEARISH" && "bg-red-100 text-red-700",
                                            strategy.market_analysis.sentiment === "NEUTRAL" && "bg-gray-100 text-gray-700"
                                        )}>
                                            {strategy.market_analysis.sentiment}
                                        </span>
                                    )}
                                </h3>

                                {strategy.market_analysis.executive_summary?.length > 0 && (
                                    <div className="mb-4">
                                        <h4 className="font-medium text-text-main mb-2">Key Findings</h4>
                                        <ul className="list-disc pl-5 space-y-1 text-sm text-text-muted">
                                            {strategy.market_analysis.executive_summary.map((point, i) => (
                                                <li key={i}>{point}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <div className="grid md:grid-cols-2 gap-4">
                                    {strategy.market_analysis.key_opportunities?.length > 0 && (
                                        <div className="p-4 bg-emerald-50 rounded-lg">
                                            <h4 className="font-medium text-emerald-700 mb-2">Opportunities</h4>
                                            <ul className="list-disc pl-5 space-y-1 text-sm text-emerald-600">
                                                {strategy.market_analysis.key_opportunities.map((opp, i) => (
                                                    <li key={i}>{opp}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {strategy.market_analysis.key_risks?.length > 0 && (
                                        <div className="p-4 bg-red-50 rounded-lg">
                                            <h4 className="font-medium text-red-700 mb-2">Risks</h4>
                                            <ul className="list-disc pl-5 space-y-1 text-sm text-red-600">
                                                {strategy.market_analysis.key_risks.map((risk, i) => (
                                                    <li key={i}>{risk}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        )}

                        {strategy.trading_strategies?.strategies?.length > 0 && (
                            <Card className="p-6">
                                <h3 className="text-lg font-semibold text-text-main flex items-center gap-2 mb-4">
                                    <Target size={20} className="text-primary" />
                                    Trading Strategies
                                </h3>
                                <div className="space-y-4">
                                    {strategy.trading_strategies.strategies.map((strat, i) => (
                                        <div key={i} className={cn(
                                            "p-4 rounded-lg border",
                                            strat.is_recommended ? "border-primary bg-primary/5" : "border-border"
                                        )}>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="font-semibold text-text-main">{strat.strategy_name}</span>
                                                {strat.is_recommended && (
                                                    <span className="px-2 py-0.5 bg-primary text-white text-xs rounded">Recommended</span>
                                                )}
                                            </div>
                                            <p className="text-sm text-text-muted mb-3">{strat.description}</p>
                                            <div className="grid md:grid-cols-2 gap-2 text-xs">
                                                <div><strong>Entry:</strong> {strat.entry_conditions}</div>
                                                <div><strong>Exit:</strong> {strat.exit_conditions}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}

                        {strategy.execution_plan?.strategy_executions?.length > 0 && (
                            <Card className="p-6">
                                <h3 className="text-lg font-semibold text-text-main flex items-center gap-2 mb-4">
                                    <Lightning size={20} className="text-primary" />
                                    Execution Plan
                                </h3>
                                {strategy.execution_plan.general_principles?.length > 0 && (
                                    <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                                        <h4 className="font-medium text-blue-700 mb-2">General Principles</h4>
                                        <ul className="list-disc pl-5 space-y-1 text-sm text-blue-600">
                                            {strategy.execution_plan.general_principles.map((p, i) => (
                                                <li key={i}>{p}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                <div className="space-y-3">
                                    {strategy.execution_plan.strategy_executions.map((exec, i) => (
                                        <div key={i} className="p-3 border border-border rounded-lg text-sm">
                                            <div className="font-medium text-text-main mb-2">{exec.strategy_name}</div>
                                            <div className="grid md:grid-cols-2 gap-1 text-text-muted text-xs">
                                                <div><strong>Orders:</strong> {exec.order_types}</div>
                                                <div><strong>Position:</strong> {exec.position_sizing}</div>
                                                <div><strong>Stop-Loss:</strong> {exec.stop_loss}</div>
                                                <div><strong>Take-Profit:</strong> {exec.take_profit}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}

                        {strategy.risk_assessment && (
                            <Card className="p-6">
                                <h3 className="text-lg font-semibold text-text-main flex items-center gap-2 mb-4">
                                    <ShieldCheck size={20} className="text-primary" />
                                    Risk Assessment
                                    <span className={cn(
                                        "ml-2 px-2 py-0.5 rounded text-xs font-medium",
                                        strategy.risk_assessment.overall_risk_level === "LOW" && "bg-emerald-100 text-emerald-700",
                                        strategy.risk_assessment.overall_risk_level === "MEDIUM" && "bg-amber-100 text-amber-700",
                                        strategy.risk_assessment.overall_risk_level === "HIGH" && "bg-red-100 text-red-700"
                                    )}>
                                        {strategy.risk_assessment.overall_risk_level} Risk
                                    </span>
                                </h3>

                                {strategy.risk_assessment.risk_summary?.length > 0 && (
                                    <ul className="list-disc pl-5 space-y-1 text-sm text-text-muted mb-4">
                                        {strategy.risk_assessment.risk_summary.map((point, i) => (
                                            <li key={i}>{point}</li>
                                        ))}
                                    </ul>
                                )}

                                {strategy.risk_assessment.alignment_status && (
                                    <div className={cn(
                                        "p-3 rounded-lg mb-4",
                                        strategy.risk_assessment.alignment_status === "ALIGNED" && "bg-emerald-50",
                                        strategy.risk_assessment.alignment_status === "PARTIALLY_ALIGNED" && "bg-amber-50",
                                        strategy.risk_assessment.alignment_status === "MISALIGNED" && "bg-red-50"
                                    )}>
                                        <div className="font-medium text-sm mb-1">
                                            Profile Alignment: {strategy.risk_assessment.alignment_status.replace("_", " ")}
                                        </div>
                                        <p className="text-xs text-text-muted">{strategy.risk_assessment.alignment_explanation}</p>
                                    </div>
                                )}

                                {strategy.risk_assessment.mitigation_recommendations?.length > 0 && (
                                    <div className="p-4 bg-blue-50 rounded-lg">
                                        <h4 className="font-medium text-blue-700 mb-2">Mitigation Recommendations</h4>
                                        <ul className="list-disc pl-5 space-y-1 text-sm text-blue-600">
                                            {strategy.risk_assessment.mitigation_recommendations.map((rec, i) => (
                                                <li key={i}>{rec}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </Card>
                        )}

                        <Card className="p-4 bg-amber-50 border-amber-200">
                            <div className="flex items-start gap-3">
                                <Warning size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-amber-700">{strategy.disclaimer}</p>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </DashboardLayout>
    );
}
