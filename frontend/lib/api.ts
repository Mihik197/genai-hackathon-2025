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

export async function analyzeRegulation(file: File): Promise<AnalyzeResponse> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}/comply/analyze`, {
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

    return await response.json();
}

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
