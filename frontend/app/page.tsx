"use client";

import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  ShieldCheck,
  TrendUp,
  Users,
  Scales,
  ArrowRight,
  CaretUp,
  CaretDown
} from "@phosphor-icons/react";

export default function Home() {
  const modules = [
    {
      title: "Comply (RegTech)",
      description: "Automated regulatory gap analysis and compliance reporting.",
      icon: Scales,
      href: "/comply",
      color: "bg-violet-500",
      stats: "3 Gaps Found",
      trend: "+12%",
      trendUp: false,
    },
    {
      title: "Inclusion (Credit)",
      description: "Alternative credit scoring using non-traditional data.",
      icon: Users,
      href: "/inclusion",
      color: "bg-blue-500",
      stats: "156 Approved",
      trend: "+8.4%",
      trendUp: true,
    },
    {
      title: "Advisor (Invest)",
      description: "AI-powered personalized portfolio management.",
      icon: TrendUp,
      href: "/advisor",
      color: "bg-emerald-500",
      stats: "$2.4M AUM",
      trend: "+4.2%",
      trendUp: true,
    },
    {
      title: "Shield (Fraud)",
      description: "Real-time transaction monitoring and anomaly detection.",
      icon: ShieldCheck,
      href: "/shield",
      color: "bg-red-500",
      stats: "94% Accuracy",
      trend: "+1.2%",
      trendUp: true,
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-main tracking-tight">Dashboard Overview</h1>
            <p className="text-text-muted mt-2">Welcome back to FinGuard. Here's what's happening today.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm">Download Report</Button>
            <Button size="sm">System Status: Online</Button>
          </div>
        </div>

        {/* Quick Stats Row - Placeholder */}
        <div className="grid grid-cols-4 gap-6">
          {[
            { label: "Total Transactions", val: "14,250", trend: "+12%" },
            { label: "Active Analyzers", val: "8", trend: "Stable" },
            { label: "Pending Reviews", val: "23", trend: "-5%" },
            { label: "Compliance Score", val: "94/100", trend: "+2%" },
          ].map((stat, i) => (
            <Card key={i} className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">{stat.label}</span>
              <div className="flex items-end justify-between">
                <span className="text-2xl font-bold text-text-main">{stat.val}</span>
                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{stat.trend}</span>
              </div>
            </Card>
          ))}
        </div>

        {/* Modules Grid */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-text-main">Active Modules</h2>
          <div className="grid grid-cols-2 gap-6">
            {modules.map((module) => (
              <Link href={module.href} key={module.title} className="group block">
                <Card hoverEffect className="h-full relative overflow-hidden group-hover:border-primary/50 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl ${module.color} bg-opacity-10 flex items-center justify-center text-white mb-4 shadow-sm`}>
                      {/* We need to render the background with opacity, so we use an inner div or inline style */}
                      <div className={`absolute inset-0 opacity-10 ${module.color} z-0`}></div>
                      <div className={`relative z-10 w-10 h-10 rounded-lg ${module.color} flex items-center justify-center`}>
                        <module.icon size={24} weight="fill" className="text-white" />
                      </div>
                    </div>
                    <div className={`flex items-center gap-1 text-sm font-medium ${module.trendUp ? 'text-emerald-600' : 'text-red-500'}`}>
                      {module.trendUp ? <CaretUp weight="bold" /> : <CaretDown weight="bold" />}
                      {module.trend}
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-text-main mb-2 group-hover:text-primary transition-colors">{module.title}</h3>
                  <p className="text-text-muted text-sm mb-6">{module.description}</p>

                  <div className="flex items-center justify-between pt-4 border-t border-border/50">
                    <div>
                      <span className="text-xs text-text-muted block">Key Metric</span>
                      <span className="font-semibold text-text-main">{module.stats}</span>
                    </div>
                    <Button variant="ghost" size="sm" className="group-hover:translate-x-1 transition-transform p-0 hover:bg-transparent">
                      Enter Module <ArrowRight className="ml-2" />
                    </Button>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
