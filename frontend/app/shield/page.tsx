"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function ShieldPage() {
    return (
        <DashboardLayout>
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-text-main">Shield (Fraud)</h1>
                    <p className="text-text-muted mt-2">Real-time fraud detection monitoring.</p>
                </div>
                <Button variant="danger">View Alerts</Button>
            </div>
            <Card className="min-h-[400px] flex items-center justify-center border-dashed">
                <div className="text-center">
                    <p className="text-text-muted">Module Under Construction</p>
                    <p className="text-sm text-gray-400 mt-1">This module will feature live transaction feeds.</p>
                </div>
            </Card>
        </DashboardLayout>
    );
}
