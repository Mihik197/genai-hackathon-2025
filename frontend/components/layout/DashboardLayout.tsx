"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    SquaresFour,
    ShieldCheck,
    TrendUp,
    Users,
    Scales,
    Gear,
    Bell,
    MagnifyingGlass,
    List,
    X
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const navItems = [
        { name: "Dashboard", href: "/", icon: SquaresFour },
        { name: "Shield (Fraud)", href: "/shield", icon: ShieldCheck, color: "text-red-500" },
        { name: "Advisor (Invest)", href: "/advisor", icon: TrendUp, color: "text-emerald-500" },
        { name: "Inclusion (Credit)", href: "/inclusion", icon: Users, color: "text-blue-500" },
        { name: "Comply (RegTech)", href: "/comply", icon: Scales, color: "text-violet-500" },
    ];

    return (
        <div className="flex h-screen bg-background font-sans overflow-hidden">
            {/* Sidebar */}
            <aside className={cn(
                "bg-surface border-r border-border flex flex-col z-20 shadow-xl shadow-gray-200/50 transition-all duration-300 flex-shrink-0",
                sidebarOpen ? "w-64" : "w-0 overflow-hidden"
            )}>
                {/* Brand */}
                <div className="h-16 flex items-center px-6 border-b border-border/50">
                    <div className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
                            <ShieldCheck weight="fill" size={20} />
                        </div>
                        <span>FinGuard<span className="text-text-main font-normal">AI</span></span>
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
                    <div className="px-3 mb-2 text-xs font-semibold text-text-muted uppercase tracking-wider">
                        Menu
                    </div>
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                                    isActive
                                        ? "bg-primary/10 text-primary shadow-sm"
                                        : "text-text-muted hover:bg-gray-50 hover:text-text-main"
                                )}
                            >
                                <Icon
                                    size={20}
                                    weight={isActive ? "fill" : "regular"}
                                    className={cn(
                                        "transition-colors",
                                        isActive ? "text-primary" : "text-gray-400 group-hover:text-text-main",
                                        item.color && isActive && item.color
                                    )}
                                />
                                {item.name}
                            </Link>
                        );
                    })}
                </div>

                {/* Bottom Actions */}
                <div className="p-4 border-t border-border/50 bg-gray-50/50">
                    <button className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-text-muted hover:text-text-main rounded-md hover:bg-white transition-colors">
                        <Gear size={20} />
                        Settings
                    </button>
                    <div className="mt-4 flex items-center gap-3 px-3 pt-4 border-t border-border/50">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-purple-400 flex items-center justify-center text-white text-xs font-bold">
                            MA
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-medium truncate text-text-main">Mihik Admin</p>
                            <p className="text-xs text-text-muted truncate">admin@finguard.ai</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Wrapper */}
            <main className="flex-1 flex flex-col h-full overflow-hidden relative">

                {/* Header */}
                <header className="h-16 bg-surface/80 backdrop-blur-md border-b border-border flex items-center justify-between px-8 z-10 sticky top-0">
                    {/* Toggle Button & Search */}
                    <div className="flex items-center gap-4 flex-1">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 text-text-muted hover:text-primary transition-colors rounded-lg hover:bg-primary/5"
                        >
                            {sidebarOpen ? <X size={24} weight="bold" /> : <List size={24} weight="bold" />}
                        </button>
                        
                        {/* Search Bar - Placeholder */}
                        <div className="relative w-96">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                <MagnifyingGlass size={16} />
                            </div>
                            <input
                                type="text"
                                placeholder="Search transactions, policies, or users..."
                                className="w-full h-9 pl-9 pr-4 rounded-full bg-gray-100/50 border-none text-sm text-text-main focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all placeholder:text-gray-400"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="relative p-2 text-text-muted hover:text-primary transition-colors rounded-full hover:bg-primary/5">
                            <Bell size={20} />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-surface"></span>
                        </button>
                    </div>
                </header>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto bg-background">
                    {children}
                </div>

            </main>
        </div>
    );
}
