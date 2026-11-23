import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const tooltipStyle = {
  backgroundColor: "#022c22",
  border: "1px solid #065f46",
  borderRadius: "0.75rem",
  fontSize: "0.75rem",
};

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={tooltipStyle} className="px-3 py-2 text-gray-100">
      <p className="font-bold mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name} : {p.value}
        </p>
      ))}
    </div>
  );
};

const formatDay = day => {
  const d = new Date(`${day}T00:00:00`);
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
};

const TrafficChart = ({ data }) => {
  const rows = (data ?? []).map(d => ({
    ...d,
    day: formatDay(d.day),
  }));

  if (!rows.length || rows.every(r => !r.views && !r.visitors)) {
    return (
      <div className="h-56 flex items-center justify-center text-sm text-gray-400">
        Pas encore de données sur la période.
      </div>
    );
  }

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={rows} margin={{ top: 4, right: 4, bottom: 0, left: -18 }}>
          <defs>
            <linearGradient id="faViews" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="faVisitors" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34d399" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#34d399" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#064e3b" strokeOpacity={0.25} vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fill: "#9ca3af", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            minTickGap={32}
          />
          <YAxis
            tick={{ fill: "#9ca3af", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            width={40}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#065f46" }} />
          <Area
            type="monotone"
            dataKey="views"
            name="Vues"
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#faViews)"
          />
          <Area
            type="monotone"
            dataKey="visitors"
            name="Visiteurs"
            stroke="#34d399"
            strokeWidth={1.5}
            fill="url(#faVisitors)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TrafficChart;
