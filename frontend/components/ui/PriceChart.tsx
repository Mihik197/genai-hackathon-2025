"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Card } from "./Card";

interface PriceChartProps {
    prices: number[];
    dates: string[];
    currentPrice?: number;
    analystTarget?: number;
    title?: string;
}

export function PriceChart({ prices, dates, currentPrice, analystTarget, title = "Price History" }: PriceChartProps) {
    if (!prices || prices.length === 0) {
        return null;
    }

    const data = dates.map((date, i) => ({
        date: date.slice(5),
        price: prices[i],
    }));

    const minPrice = Math.min(...prices) * 0.98;
    const maxPrice = Math.max(...prices) * 1.02;

    const priceChange = prices.length >= 2 ? ((prices[prices.length - 1] - prices[0]) / prices[0]) * 100 : 0;
    const isPositive = priceChange >= 0;

    return (
        <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-text-main">{title}</h4>
                <span className={`text-sm font-medium ${isPositive ? "text-emerald-600" : "text-red-600"}`}>
                    {isPositive ? "+" : ""}{priceChange.toFixed(2)}%
                </span>
            </div>
            <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <XAxis
                            dataKey="date"
                            tick={{ fontSize: 10 }}
                            tickLine={false}
                            axisLine={{ stroke: "#e5e5e5" }}
                            interval="preserveStartEnd"
                        />
                        <YAxis
                            domain={[minPrice, maxPrice]}
                            tick={{ fontSize: 10 }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(v) => `$${v.toFixed(0)}`}
                            width={50}
                        />
                        <Tooltip
                            formatter={(value: number) => [`$${value.toFixed(2)}`, "Price"]}
                            contentStyle={{
                                backgroundColor: "var(--color-surface)",
                                border: "1px solid var(--color-border)",
                                borderRadius: "8px",
                                fontSize: "12px"
                            }}
                        />
                        {analystTarget && (
                            <ReferenceLine
                                y={analystTarget}
                                stroke="#3b82f6"
                                strokeDasharray="5 5"
                                label={{ value: "Target", position: "right", fontSize: 10 }}
                            />
                        )}
                        <Line
                            type="monotone"
                            dataKey="price"
                            stroke={isPositive ? "#10b981" : "#ef4444"}
                            strokeWidth={2}
                            dot={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
            {currentPrice && (
                <div className="mt-2 text-center text-sm text-text-muted">
                    Current: <span className="font-semibold text-text-main">${currentPrice.toFixed(2)}</span>
                    {analystTarget && (
                        <> | Target: <span className="font-semibold text-blue-600">${analystTarget.toFixed(2)}</span></>
                    )}
                </div>
            )}
        </Card>
    );
}
