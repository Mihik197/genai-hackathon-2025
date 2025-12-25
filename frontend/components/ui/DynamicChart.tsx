"use client";

import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell, RadialBarChart, RadialBar, Legend } from "recharts";
import { Card } from "./Card";
import type { Visualization } from "@/lib/api";

interface DynamicChartProps {
    visualization: Visualization;
}

function LineChartComponent({ visualization }: DynamicChartProps) {
    const { data, meta, title, description } = visualization;

    if (!data.labels || data.values.length === 0) return null;

    const chartData = data.labels.map((label, i) => ({
        label: label.length > 5 ? label.slice(5) : label,
        value: data.values[i],
    }));

    const minVal = Math.min(...data.values) * 0.98;
    const maxVal = Math.max(...data.values) * 1.02;
    const change = data.values.length >= 2
        ? ((data.values[data.values.length - 1] - data.values[0]) / data.values[0]) * 100
        : 0;
    const isPositive = meta?.positive_is_good !== false ? change >= 0 : change <= 0;

    return (
        <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-text-main">{title}</h4>
                <span className={`text-sm font-medium ${isPositive ? "text-emerald-600" : "text-red-600"}`}>
                    {change >= 0 ? "+" : ""}{change.toFixed(2)}%
                </span>
            </div>
            {description && <p className="text-xs text-text-muted mb-3">{description}</p>}
            <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} interval="preserveStartEnd" />
                        <YAxis domain={[minVal, maxVal]} tick={{ fontSize: 10 }} tickLine={false} axisLine={false}
                            tickFormatter={(v) => `${meta?.unit || ""}${v.toFixed(0)}`} width={50} />
                        <Tooltip formatter={(value) => [`${meta?.unit || ""}${typeof value === 'number' ? value.toFixed(2) : value}`, "Value"]}
                            contentStyle={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "8px", fontSize: "12px" }} />
                        {data.annotations?.map((ann, i) => (
                            <ReferenceLine key={i} y={ann.value} stroke="#3b82f6" strokeDasharray="5 5"
                                label={{ value: ann.label, position: "right", fontSize: 10 }} />
                        ))}
                        <Line type="monotone" dataKey="value" stroke={isPositive ? "#10b981" : "#ef4444"} strokeWidth={2} dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}

function BarChartComponent({ visualization }: DynamicChartProps) {
    const { data, meta, title, description } = visualization;

    if (!data.labels || data.values.length === 0) return null;

    const chartData = data.labels.map((label, i) => ({
        label: label.length > 10 ? label.slice(0, 10) + "..." : label,
        value: data.values[i],
        secondary: data.secondary_values?.[i],
    }));

    const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

    return (
        <Card className="p-4">
            <h4 className="text-sm font-semibold text-text-main mb-2">{title}</h4>
            {description && <p className="text-xs text-text-muted mb-3">{description}</p>}
            <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} />
                        <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false}
                            tickFormatter={(v) => `${meta?.unit || ""}${v}`} width={50} />
                        <Tooltip formatter={(value) => [`${meta?.unit || ""}${typeof value === 'number' ? value.toFixed(2) : value}`, ""]} />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                            {chartData.map((_, index) => (
                                <Cell key={index} fill={colors[index % colors.length]} />
                            ))}
                        </Bar>
                        {data.secondary_values && (
                            <Bar dataKey="secondary" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                        )}
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}

function ComparisonChartComponent({ visualization }: DynamicChartProps) {
    const { data, meta, title, description } = visualization;

    if (!data.labels || data.values.length === 0) return null;

    const chartData = data.labels.map((label, i) => ({
        label,
        current: data.values[i],
        target: data.secondary_values?.[i],
    }));

    return (
        <Card className="p-4">
            <h4 className="text-sm font-semibold text-text-main mb-2">{title}</h4>
            {description && <p className="text-xs text-text-muted mb-3">{description}</p>}
            <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical">
                        <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => `${meta?.unit || ""}${v}`} />
                        <YAxis type="category" dataKey="label" tick={{ fontSize: 10 }} width={80} />
                        <Tooltip formatter={(value) => [`${meta?.unit || ""}${typeof value === 'number' ? value.toFixed(2) : value}`, ""]} />
                        <Bar dataKey="current" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Current" />
                        {data.secondary_values && (
                            <Bar dataKey="target" fill="#10b981" radius={[0, 4, 4, 0]} name="Target" />
                        )}
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}

function GaugeChartComponent({ visualization }: DynamicChartProps) {
    const { data, meta, title, description } = visualization;

    if (data.values.length === 0) return null;

    const value = data.values[0];
    const isPositive = meta?.positive_is_good !== false ? value >= 50 : value <= 50;

    const chartData = [
        { name: "value", value: value, fill: isPositive ? "#10b981" : "#ef4444" },
    ];

    return (
        <Card className="p-4">
            <h4 className="text-sm font-semibold text-text-main mb-2 text-center">{title}</h4>
            {description && <p className="text-xs text-text-muted mb-3 text-center">{description}</p>}
            <div className="h-32 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart cx="50%" cy="80%" innerRadius="60%" outerRadius="100%" startAngle={180} endAngle={0} data={chartData}>
                        <RadialBar dataKey="value" cornerRadius={10} background={{ fill: "#e5e7eb" }} />
                    </RadialBarChart>
                </ResponsiveContainer>
            </div>
            <div className="text-center -mt-4">
                <span className={`text-2xl font-bold ${isPositive ? "text-emerald-600" : "text-red-600"}`}>
                    {value.toFixed(0)}{meta?.unit || "%"}
                </span>
            </div>
        </Card>
    );
}

export function DynamicChart({ visualization }: DynamicChartProps) {
    switch (visualization.type) {
        case "line":
            return <LineChartComponent visualization={visualization} />;
        case "bar":
            return <BarChartComponent visualization={visualization} />;
        case "comparison":
            return <ComparisonChartComponent visualization={visualization} />;
        case "gauge":
            return <GaugeChartComponent visualization={visualization} />;
        default:
            return null;
    }
}
