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
