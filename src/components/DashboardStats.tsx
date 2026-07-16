import React from "react";
import { PredictionRecord, SystemStats } from "../types";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell 
} from "recharts";
import { Activity, ShieldCheck, Clock, Users, ArrowUpRight, BarChart2 } from "lucide-react";

interface DashboardStatsProps {
  predictions: PredictionRecord[];
  stats: SystemStats;
  isAdminView?: boolean;
}

const COLORS = ["#2563eb", "#3b82f6", "#f59e0b", "#f43f5e", "#a855f7", "#ec4899"];

export default function DashboardStats({ predictions, stats, isAdminView = false }: DashboardStatsProps) {
  // 1. Prepare data for Disease Occurrences
  const diseaseData = Object.entries(stats.diseaseCounts).map(([name, count]) => ({
    name: name.length > 18 ? name.substring(0, 15) + "..." : name,
    count
  }));

  // 2. Prepare data for Confidence History
  const confidenceData = [...predictions]
    .reverse() // chronological order
    .map((p) => {
      const date = new Date(p.prediction_time);
      return {
        date: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        confidence: Math.round(p.confidence * 100),
        disease: p.disease_name
      };
    });

  // 3. Prepare data for Severity distribution
  const severityCounts: Record<string, number> = { Low: 0, Medium: 0, High: 0, Critical: 0 };
  predictions.forEach((p) => {
    const sev = p.details?.severity || "Low";
    severityCounts[sev] = (severityCounts[sev] || 0) + 1;
  });

  const severityData = Object.entries(severityCounts)
    .filter(([_, count]) => count > 0)
    .map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-8 animate-fade-in">
      {/* KPI Cards Grid */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${isAdminView ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-6`}>
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute right-4 top-4 bg-blue-500/10 text-blue-600 p-2.5 rounded-lg">
            <Activity className="w-5 h-5" />
          </div>
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Scans</p>
          <h3 className="text-3xl font-bold text-slate-900 mt-2">{stats.totalPredictions}</h3>
          <p className="text-[11px] text-slate-400 mt-2 font-mono">Completed AI reports</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute right-4 top-4 bg-sky-500/10 text-sky-600 p-2.5 rounded-lg">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Avg Confidence</p>
          <h3 className="text-3xl font-bold text-slate-900 mt-2">
            {stats.averageConfidence > 0 ? `${Math.round(stats.averageConfidence * 100)}%` : "N/A"}
          </h3>
          <p className="text-[11px] text-slate-400 mt-2 font-mono">Detection certainty rate</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute right-4 top-4 bg-amber-500/10 text-amber-600 p-2.5 rounded-lg">
            <Clock className="w-5 h-5" />
          </div>
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Latest Assessment</p>
          <h3 className="text-lg font-bold text-slate-900 mt-3 truncate">
            {predictions[0]?.disease_name || "No scans yet"}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">
            {predictions[0] ? new Date(predictions[0].prediction_time).toLocaleDateString() : "Ready to scan"}
          </p>
        </div>

        {isAdminView && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm relative overflow-hidden">
            <div className="absolute right-4 top-4 bg-purple-500/10 text-purple-600 p-2.5 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
              Active App Users
            </p>
            <h3 className="text-2xl font-bold text-slate-900 mt-3">
              {stats.totalUsers}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1 font-mono">
              Registered database users
            </p>
          </div>
        )}
      </div>

      {/* Visual Analytics Charts */}
      {predictions.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Occurrence Frequency (Bar Chart) */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm lg:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <BarChart2 className="w-4 h-4 text-slate-400" />
              <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Condition Occurrences</h4>
            </div>
            
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={diseaseData}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ background: "#0f172a", border: "none", borderRadius: "12px", color: "#f8fafc" }}
                    labelStyle={{ fontWeight: "bold" }}
                  />
                  <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Severity Breakdown (Pie Chart) */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-4 h-4 text-slate-400" />
              <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Severity Classification</h4>
            </div>

            <div className="h-48 w-full relative">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={severityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {severityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ background: "#0f172a", border: "none", borderRadius: "12px", color: "#f8fafc" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4">
              {severityData.map((item, index) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-xs text-slate-500 font-medium">{item.name} ({item.value})</span>
                </div>
              ))}
            </div>
          </div>

          {/* Confidence Rates History (Area Chart) */}
          {confidenceData.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm lg:col-span-3">
              <div className="flex items-center gap-2 mb-6">
                <Clock className="w-4 h-4 text-slate-400" />
                <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Confidence Track Trend</h4>
              </div>

              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height={230}>
                  <AreaChart data={confidenceData}>
                    <defs>
                      <linearGradient id="colorConfidence" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} unit="%" />
                    <Tooltip 
                      contentStyle={{ background: "#0f172a", border: "none", borderRadius: "12px", color: "#f8fafc" }}
                      labelStyle={{ fontWeight: "bold" }}
                    />
                    <Area type="monotone" dataKey="confidence" name="Certainty Percentage" stroke="#2563eb" fillOpacity={1} fill="url(#colorConfidence)" strokeWidth={2.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-xl shadow-sm">
          <p className="text-slate-400 font-medium">No skin assessment telemetry available yet.</p>
          <p className="text-slate-400 text-xs mt-1">Please navigate to the scan panel and submit an image for clinical AI analysis.</p>
        </div>
      )}
    </div>
  );
}
