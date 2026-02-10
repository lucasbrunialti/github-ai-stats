"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface DeveloperStats {
  developer: string;
  month: string;
  prCount: number;
  additions: number;
  deletions: number;
}

interface PerformanceChartProps {
  data: DeveloperStats[];
}

// Generate consistent colors for developers
function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return `hsl(${h}, 70%, 50%)`;
}

export function PerformanceChart({ data }: PerformanceChartProps) {
  // Transform data for stacked bar chart
  // Group by month, with each developer as a separate bar
  const months = [...new Set(data.map((d) => d.month))].sort();
  const developers = [...new Set(data.map((d) => d.developer))];

  const chartData = months.map((month) => {
    const monthData: Record<string, number | string> = { month };
    developers.forEach((dev) => {
      const stat = data.find((d) => d.month === month && d.developer === dev);
      monthData[dev] = stat?.prCount || 0;
    });
    return monthData;
  });

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No data available. Fetch some PRs first to see performance metrics.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => {
            const [year, month] = value.split("-");
            const monthNames = [
              "Jan", "Feb", "Mar", "Apr", "May", "Jun",
              "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
            ];
            return `${monthNames[parseInt(month) - 1]} ${year.slice(2)}`;
          }}
        />
        <YAxis
          tick={{ fontSize: 12 }}
          label={{
            value: "PRs Merged",
            angle: -90,
            position: "insideLeft",
            style: { textAnchor: "middle" },
          }}
        />
        <Tooltip
          formatter={(value: number, name: string) => [value, name]}
          labelFormatter={(label) => {
            const [year, month] = label.split("-");
            const monthNames = [
              "January", "February", "March", "April", "May", "June",
              "July", "August", "September", "October", "November", "December",
            ];
            return `${monthNames[parseInt(month) - 1]} ${year}`;
          }}
        />
        <Legend />
        {developers.map((dev) => (
          <Bar
            key={dev}
            dataKey={dev}
            name={dev}
            fill={stringToColor(dev)}
            stackId="stack"
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
