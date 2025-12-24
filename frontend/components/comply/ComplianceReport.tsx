import { ComplianceReport as ReportType } from "@/lib/api";
import { GapCard } from "./GapCard";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CheckCircle, Warning, WarningCircle, DownloadSimple, ShareNetwork } from "@phosphor-icons/react";

interface ComplianceReportProps {
    report: ReportType;
}

export function ComplianceReport({ report }: ComplianceReportProps) {
    const { analysis_summary, gaps, regulation_info, overall_compliance_status } = report;

    const statusColor =
        overall_compliance_status === "COMPLIANT" ? "text-emerald-500 bg-emerald-50 border-emerald-200" :
            overall_compliance_status === "PARTIALLY_COMPLIANT" ? "text-amber-500 bg-amber-50 border-amber-200" :
                "text-red-500 bg-red-50 border-red-200";

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Header Summary */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusColor}`}>
                            {overall_compliance_status.replace("_", " ")}
                        </span>
                        <span className="text-sm text-text-muted">Ref: {regulation_info.reference || "N/A"}</span>
                    </div>
                    <h2 className="text-3xl font-bold text-text-main mb-2">{regulation_info.title}</h2>
                    <p className="text-text-muted max-w-3xl leading-relaxed">{regulation_info.summary}</p>
                </div>
                <div className="flex gap-3 shrink-0">
                    <Button variant="outline" leftIcon={<ShareNetwork size={18} />}>Share</Button>
                    <Button leftIcon={<DownloadSimple size={18} />}>Export PDF</Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                    { label: "Total Checks", val: analysis_summary.total_requirements_checked, icon: <CheckCircle className="text-blue-500" size={24} /> },
                    { label: "Gaps Found", val: analysis_summary.gaps_found, icon: <WarningCircle className="text-red-500" size={24} />, alert: analysis_summary.gaps_found > 0 },
                    { label: "Action Items", val: analysis_summary.action_items_count, icon: <Warning className="text-amber-500" size={24} /> },
                ].map((stat, i) => (
                    <Card key={i} className={`flex flex-col gap-2 ${stat.alert ? 'border-red-200 bg-red-50/30' : ''}`}>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">{stat.label}</span>
                            {stat.icon}
                        </div>
                        <span className="text-3xl font-bold text-text-main">{stat.val}</span>
                    </Card>
                ))}
            </div>

            {/* Gaps Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-text-main">
                        Detected Gaps
                        <span className="ml-3 text-sm font-medium text-text-muted bg-gray-100 px-2 py-1 rounded-full">
                            {gaps.length}
                        </span>
                    </h3>
                </div>

                <div className="space-y-4">
                    {gaps.length > 0 ? (
                        gaps.map((gap, index) => (
                            <GapCard key={`${gap.id}-${index}`} gap={gap} />
                        ))
                    ) : (
                        <Card className="flex flex-col items-center justify-center py-12 bg-emerald-50/30 border-dashed border-emerald-200">
                            <CheckCircle size={48} className="text-emerald-500 mb-4" weight="duotone" />
                            <p className="text-lg font-semibold text-emerald-900">No Gaps Detected</p>
                            <p className="text-emerald-700">All policies appear to be compliant with this regulation.</p>
                        </Card>
                    )}
                </div>
            </div>

            {/* Action Items Section */}
            {report.action_items.length > 0 && (
                <div className="pt-8 border-t border-border">
                    <h3 className="text-xl font-bold text-text-main mb-4">
                        Action Items
                        <span className="ml-3 text-sm font-medium text-text-muted bg-gray-100 px-2 py-1 rounded-full">
                            {report.action_items.length}
                        </span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {report.action_items.map((item) => (
                            <div key={item.id} className="flex items-start gap-3 p-4 rounded-lg border border-border bg-amber-50/30">
                                <Warning className="text-amber-500 mt-0.5 shrink-0" size={18} weight="fill" />
                                <div>
                                    <p className="text-sm font-medium text-text-main">{item.description}</p>
                                    <div className="flex gap-2 mt-2">
                                        <span className="text-xs px-2 py-0.5 bg-gray-100 rounded">{item.owner_team}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded ${item.priority === "HIGH" ? "bg-red-100 text-red-700" :
                                            item.priority === "MEDIUM" ? "bg-amber-100 text-amber-700" :
                                                "bg-green-100 text-green-700"
                                            }`}>{item.priority}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
