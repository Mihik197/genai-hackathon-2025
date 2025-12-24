export interface RegulationInfo {
    title: string;
    reference?: string;
    effective_date?: string;
    summary: string;
}

export interface Gap {
    id: string;
    requirement: string;
    current_state: string;
    affected_policy?: string;
    affected_section?: string;
    action_required: string;
    priority: "HIGH" | "MEDIUM" | "LOW";
    deadline_recommended?: string;
}

export interface ActionItem {
    id: string;
    description: string;
    owner_team: string;
    priority: "HIGH" | "MEDIUM" | "LOW";
    estimated_effort: string;
}

export interface AnalysisSummary {
    total_requirements_checked: number;
    gaps_found: number;
    action_items_count: number;
}

export interface ComplianceReport {
    regulation_info: RegulationInfo;
    analysis_summary: AnalysisSummary;
    gaps: Gap[];
    action_items: ActionItem[];
    overall_compliance_status: "COMPLIANT" | "PARTIALLY_COMPLIANT" | "NON_COMPLIANT";
    risk_assessment: string;
}

export interface AnalyzeResponse {
    success: boolean;
    report?: ComplianceReport;
    error?: string;
    processing_time_seconds: number;
}

export interface AnalysisHistoryItem {
    id: string;
    filename: string;
    regulation_title: string;
    regulation_reference: string | null;
    overall_status: "COMPLIANT" | "PARTIALLY_COMPLIANT" | "NON_COMPLIANT";
    gaps_count: number;
    action_items_count: number;
    processing_time: number;
    created_at: string;
}

export interface AnalysisHistoryResponse {
    analyses: AnalysisHistoryItem[];
}

const API_BASE_URL = "http://127.0.0.1:8000/api/v1";

export async function getAnalysisHistory(): Promise<AnalysisHistoryResponse> {
    const response = await fetch(`${API_BASE_URL}/comply/history`);
    if (!response.ok) {
        return { analyses: [] };
    }
    return await response.json();
}

export async function getAnalysisById(id: string): Promise<{ report?: ComplianceReport } | null> {
    const response = await fetch(`${API_BASE_URL}/comply/history/${id}`);
    if (!response.ok) {
        return null;
    }
    return await response.json();
}

export interface ProgressEvent {
    type: "progress" | "complete" | "error";
    step?: string;
    message?: string;
    current?: number;
    total?: number;
    report?: ComplianceReport;
    processing_time_seconds?: number;
}

export async function analyzeRegulationStream(
    file: File,
    onProgress: (event: ProgressEvent) => void
): Promise<AnalyzeResponse> {
    const formData = new FormData();
    formData.append("file", file);

    try {
        const response = await fetch(`${API_BASE_URL}/comply/analyze-stream`, {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                success: false,
                error: errorData.detail || `Upload failed with status ${response.status}`,
                processing_time_seconds: 0,
            };
        }

        const reader = response.body?.getReader();
        if (!reader) {
            return { success: false, error: "No response body", processing_time_seconds: 0 };
        }

        const decoder = new TextDecoder();
        let buffer = "";
        let finalReport: ComplianceReport | undefined;
        let processingTime = 0;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
                if (line.trim()) {
                    try {
                        const event: ProgressEvent = JSON.parse(line);
                        onProgress(event);

                        if (event.type === "complete" && event.report) {
                            finalReport = event.report;
                            processingTime = event.processing_time_seconds || 0;
                        }
                        if (event.type === "error") {
                            return {
                                success: false,
                                error: event.message || "Analysis failed",
                                processing_time_seconds: 0,
                            };
                        }
                    } catch {
                        // Skip malformed JSON
                    }
                }
            }
        }

        if (finalReport) {
            return {
                success: true,
                report: finalReport,
                processing_time_seconds: processingTime,
            };
        }

        return { success: false, error: "No report received", processing_time_seconds: 0 };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Network error",
            processing_time_seconds: 0,
        };
    }
}

// Policy Management Types
export interface PolicyFile {
    file_name: string;
    file_size: number;
}

export interface CategoryPolicies {
    name: string;
    policies: PolicyFile[];
}

export interface PoliciesByCategory {
    [category: string]: CategoryPolicies;
}

// Policy Management API
export async function getPolicies(): Promise<PoliciesByCategory> {
    const response = await fetch(`${API_BASE_URL}/comply/policies`);
    if (!response.ok) {
        return {};
    }
    return await response.json();
}

export async function uploadPolicy(category: string, file: File): Promise<{ success: boolean; message?: string; error?: string }> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}/comply/policies/${category}`, {
        method: "POST",
        body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
        return { success: false, error: data.detail || "Upload failed" };
    }
    return { success: true, message: data.message };
}

export async function deletePolicy(category: string, filename: string): Promise<{ success: boolean; error?: string }> {
    const response = await fetch(`${API_BASE_URL}/comply/policies/${category}/${encodeURIComponent(filename)}`, {
        method: "DELETE",
    });

    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        return { success: false, error: data.detail || "Delete failed" };
    }
    return { success: true };
}

// Investment Strategy Types
export interface StrategyRequest {
    ticker_or_sector: string;
    risk_tolerance: "conservative" | "moderate" | "aggressive";
    investment_horizon: "short" | "medium" | "long";
    focus_areas?: string;
}

export interface NewsItem {
    headline: string;
    source: string;
    date?: string;
    relevance: string;
}

export interface MarketDataAnalysis {
    ticker_or_sector: string;
    report_date: string;
    executive_summary: string[];
    sentiment: "BULLISH" | "BEARISH" | "NEUTRAL";
    sentiment_reasoning: string;
    recent_news: NewsItem[];
    key_risks: string[];
    key_opportunities: string[];
    analyst_ratings_summary?: string;
    sources_count: number;
}

export interface TradingStrategyItem {
    strategy_name: string;
    description: string;
    profile_alignment: string;
    key_indicators: string[];
    entry_conditions: string;
    exit_conditions: string;
    specific_risks: string[];
    is_recommended: boolean;
}

export interface TradingStrategies {
    ticker_or_sector: string;
    risk_tolerance: string;
    investment_horizon: string;
    strategies: TradingStrategyItem[];
    overall_approach: string;
}

export interface StrategyExecution {
    strategy_name: string;
    order_types: string;
    position_sizing: string;
    entry_method: string;
    stop_loss: string;
    take_profit: string;
    management: string;
}

export interface ExecutionPlan {
    general_principles: string[];
    risk_management_approach: string;
    cost_control_measures: string;
    monitoring_frequency: string;
    strategy_executions: StrategyExecution[];
}

export interface StrategyRisk {
    strategy_name: string;
    risk_level: "LOW" | "MEDIUM" | "HIGH";
    key_risks: string[];
}

export interface RiskAssessment {
    overall_risk_level: "LOW" | "MEDIUM" | "HIGH";
    risk_summary: string[];
    market_risks: string[];
    strategy_risks: StrategyRisk[];
    execution_risks: string[];
    alignment_status: "ALIGNED" | "PARTIALLY_ALIGNED" | "MISALIGNED";
    alignment_explanation: string;
    mitigation_recommendations: string[];
}

export interface InvestmentStrategy {
    id: string;
    strategy_name: string;
    ticker_or_sector: string;
    risk_tolerance: string;
    investment_horizon: string;
    market_analysis: MarketDataAnalysis;
    trading_strategies: TradingStrategies;
    execution_plan: ExecutionPlan;
    risk_assessment: RiskAssessment;
    processing_time: number;
    disclaimer: string;
}

export interface StrategyHistoryItem {
    id: string;
    ticker_or_sector: string;
    strategy_name: string;
    risk_tolerance: string;
    investment_horizon: string;
    processing_time: number;
    created_at: string;
}

export interface InvestProgressEvent {
    type: "progress" | "complete" | "error";
    step?: string;
    status?: "running" | "complete";
    message?: string;
    current?: number;
    total?: number;
    strategy?: InvestmentStrategy;
    processing_time?: number;
}


export async function generateStrategyStream(
    request: StrategyRequest,
    onProgress: (event: InvestProgressEvent) => void
): Promise<{ success: boolean; strategy?: InvestmentStrategy; error?: string }> {
    try {
        const response = await fetch(`${API_BASE_URL}/invest/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(request),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                success: false,
                error: errorData.detail || `Request failed with status ${response.status}`,
            };
        }

        const reader = response.body?.getReader();
        if (!reader) {
            return { success: false, error: "No response body" };
        }

        const decoder = new TextDecoder();
        let buffer = "";
        let finalStrategy: InvestmentStrategy | undefined;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
                if (line.trim()) {
                    try {
                        const event: InvestProgressEvent = JSON.parse(line);
                        onProgress(event);

                        if (event.type === "complete" && event.strategy) {
                            finalStrategy = event.strategy;
                        }
                        if (event.type === "error") {
                            return {
                                success: false,
                                error: event.message || "Strategy generation failed",
                            };
                        }
                    } catch {
                        // Skip malformed JSON
                    }
                }
            }
        }

        if (finalStrategy) {
            return { success: true, strategy: finalStrategy };
        }

        return { success: false, error: "No strategy received" };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Network error",
        };
    }
}

export async function getStrategyHistory(): Promise<{ strategies: StrategyHistoryItem[] }> {
    const response = await fetch(`${API_BASE_URL}/invest/history`);
    if (!response.ok) {
        return { strategies: [] };
    }
    return await response.json();
}

export async function getStrategyById(id: string): Promise<{ strategy_output?: InvestmentStrategy } | null> {
    const response = await fetch(`${API_BASE_URL}/invest/history/${id}`);
    if (!response.ok) {
        return null;
    }
    return await response.json();
}
