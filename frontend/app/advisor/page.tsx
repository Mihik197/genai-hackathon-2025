"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function AdvisorPage() {
    return (
        <DashboardLayout>
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-text-main">Advisor (Invest)</h1>
                    <p className="text-text-muted mt-2">AI investment recommendations.</p>
                </div>
                <Button variant="outline">Market Settings</Button>
            </div>
            <Card className="min-h-[400px] flex items-center justify-center border-dashed">
                <div className="text-center">
                    <p className="text-text-muted">Module Under Construction</p>
                    <p className="text-sm text-gray-400 mt-1">This module will feature chat and portfolio views.</p>
                </div>
            </Card>
        </DashboardLayout>
    );
}
