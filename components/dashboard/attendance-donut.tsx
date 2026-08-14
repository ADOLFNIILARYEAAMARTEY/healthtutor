"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = {
  present: "var(--chart-2)",
  absent: "var(--chart-4)",
};

export function AttendanceDonut({ present, absent }: { present: number; absent: number }) {
  const data = [
    { name: "Present", value: present, color: COLORS.present },
    { name: "Absent", value: absent, color: COLORS.absent },
  ];

  if (present + absent === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        No attendance data yet.
      </div>
    );
  }

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="60%"
            outerRadius="85%"
            paddingAngle={2}
            strokeWidth={0}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              color: "var(--popover-foreground)",
              fontSize: 13,
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-2 flex items-center justify-center gap-4 text-sm">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full" style={{ background: COLORS.present }} />
          Present ({present})
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full" style={{ background: COLORS.absent }} />
          Absent ({absent})
        </span>
      </div>
    </div>
  );
}
