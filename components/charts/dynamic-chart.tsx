"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from "recharts";
import { Card } from "@/components/ui/card";

interface DynamicChartProps {
  data: any[];
  chartType: "bar" | "line" | "pie" | "radar" | "table" | "metric" | "funnel";
  visualization?: {
    xAxis?: string;
    yAxis?: string;
    groupBy?: string;
  };
}

const COLORS = [
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
];

export function DynamicChart({ data, chartType, visualization }: DynamicChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        No data available to visualize
      </Card>
    );
  }

  // Metric type - single number display
  if (chartType === "metric") {
    const metrics = data[0];
    const keys = Object.keys(metrics);
    
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {keys.map((key) => (
          <Card key={key} className="p-6">
            <div className="text-sm text-muted-foreground mb-2">
              {key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </div>
            <div className="text-3xl font-bold">
              {typeof metrics[key] === 'number' 
                ? metrics[key].toLocaleString()
                : metrics[key]}
            </div>
          </Card>
        ))}
      </div>
    );
  }

  // Table type
  if (chartType === "table") {
    const keys = Object.keys(data[0] || {});
    
    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b bg-muted/50">
              {keys.map((key) => (
                <th key={key} className="text-left p-3 font-semibold">
                  {key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={idx} className="border-b hover:bg-muted/30">
                {keys.map((key) => (
                  <td key={key} className="p-3">
                    {typeof row[key] === 'number' 
                      ? row[key].toLocaleString()
                      : row[key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Determine axes
  const keys = Object.keys(data[0] || {});
  const xKey = visualization?.xAxis || keys[0];
  const yKey = visualization?.yAxis || keys[1];

  // Bar Chart
  if (chartType === "bar") {
    return (
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey={yKey} fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  // Line Chart
  if (chartType === "line") {
    return (
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey={yKey} stroke="#3b82f6" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  // Pie Chart
  if (chartType === "pie") {
    return (
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={data}
            dataKey={yKey}
            nameKey={xKey}
            cx="50%"
            cy="50%"
            outerRadius={150}
            label
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  // Radar Chart
  if (chartType === "radar") {
    return (
      <ResponsiveContainer width="100%" height={400}>
        <RadarChart data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey={xKey} />
          <PolarRadiusAxis />
          <Radar
            name="Score"
            dataKey={yKey}
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.6}
          />
          <Tooltip />
        </RadarChart>
      </ResponsiveContainer>
    );
  }

  // Funnel Chart (using bar chart horizontally)
  if (chartType === "funnel") {
    const sortedData = [...data].reverse(); // Reverse for funnel effect
    
    return (
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={sortedData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis dataKey={xKey} type="category" width={150} />
          <Tooltip />
          <Legend />
          <Bar dataKey={yKey} fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return null;
}

