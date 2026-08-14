"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { PerformanceDistribution } from "@/lib/db/dashboard";

export function AcademicPerformanceChart({ distribution }: { distribution: PerformanceDistribution }) {
  const data = [
    { name: "Excellent", range: "80–100", count: distribution.excellent, fill: "var(--chart-2)" },
    { name: "Good", range: "70–79", count: distribution.good, fill: "var(--chart-1)" },
    { name: "Average", range: "50–69", count: distribution.average, fill: "var(--chart-3)" },
    { name: "Below Average", range: "<50", count: distribution.belowAverage, fill: "var(--chart-4)" },
  ];

  const total = data.reduce((sum, d) => sum + d.count, 0);
  if (total === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
        No academic performance data yet.
      </div>
    );
  }

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
            axisLine={{ stroke: "var(--border)" }}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)" }}
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              color: "var(--popover-foreground)",
              fontSize: 13,
            }}
            formatter={(value, _name, item) => [
              `${value} student${value === 1 ? "" : "s"}`,
              (item.payload as { range: string }).range,
            ]}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={56}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
