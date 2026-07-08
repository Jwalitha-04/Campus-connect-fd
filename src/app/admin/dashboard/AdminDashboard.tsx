"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { resolveReport, deleteReportedContent } from "../actions";

interface Profile {
  id: string;
  display_name: string;
  role: string;
}

interface ModerationReport {
  id: string;
  reporter_id: string;
  target_type: "post" | "comment" | "skill" | "item";
  target_id: string;
  reason: string;
  status: "pending" | "resolved" | "dismissed";
  created_at: string;
  reporter?: Profile | null;
}

interface AdminDashboardProps {
  reports: ModerationReport[];
  stats: {
    totalUsers: number;
    activeItems: number;
    completedSessions: number;
    totalPosts: number;
  };
}

export default function AdminDashboard({ reports: initialReports, stats }: AdminDashboardProps) {
  const [reports, setReports] = useState<ModerationReport[]>(initialReports);
  const [isPending, startTransition] = useTransition();

  const handleResolve = (reportId: string, status: "resolved" | "dismissed") => {
    startTransition(async () => {
      try {
        await resolveReport(reportId, status);
        setReports((prev) => prev.filter((r) => r.id !== reportId));
      } catch (err) {
        console.error("Failed to resolve report:", err);
      }
    });
  };

  const handleDeleteContent = (reportId: string, targetType: "post" | "comment" | "skill" | "item", targetId: string) => {
    if (!confirm("Are you sure you want to permanently delete this content?")) return;

    startTransition(async () => {
      try {
        await deleteReportedContent(reportId, targetType, targetId);
        setReports((prev) => prev.filter((r) => r.id !== reportId));
      } catch (err) {
        console.error("Failed to delete content:", err);
      }
    });
  };

  return (
    <div className="w-full min-h-screen p-6 flex flex-col font-sans select-none relative">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 border-b border-pod-border pb-6">
        <div>
          <h1 className="font-display text-4.5xl font-bold tracking-wide text-ink drop-shadow-sm">
            Admin HQ Biome
          </h1>
          <p className="font-hand text-xl text-ink-soft mt-1">
            "Skeuomorphic moderation desk & live campus system diagnostics"
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-4">
          <Link
            href="/admin/qr-desk"
            className="flex items-center justify-center min-h-[44px] rounded-full bg-gradient-amber text-white font-sans font-semibold text-xs shadow-md hover:opacity-95 active:scale-[0.98] transition-all px-8 cursor-pointer"
          >
            Open QR Hand-off Desk
          </Link>
          <Link
            href="/"
            className="font-sans text-xs text-ink-soft hover:underline flex items-center"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Analytics Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto w-full mb-8">
        
        {[
          { label: "Total Users Count", value: stats.totalUsers, note: "Profiles registered", grad: "linear-gradient(135deg,#B98CF0,#F08CD8)" },
          { label: "Active Notices Bulletins", value: stats.activeItems, note: "Lost & Found reports", grad: "linear-gradient(135deg,#FF9A5A,#FFC93C)" },
          { label: "Completed Swaps", value: stats.completedSessions, note: "Tutor study sessions", grad: "linear-gradient(135deg,#4FD8A8,#6FE0C6)" },
          { label: "Total Forum Posts", value: stats.totalPosts, note: "Community board notes", grad: "linear-gradient(135deg,#B98CF0,#F08CD8)" },
        ].map((widget, idx) => (
          <div
            key={idx}
            className="p-6 bg-pod-surface border border-pod-border text-ink shadow-sm pod-aura blob-shape relative overflow-hidden"
            style={{ "--aura-gradient": widget.grad } as React.CSSProperties}
          >
            <span className="font-sans text-[9px] font-semibold text-ink-soft uppercase tracking-wider block mb-1">
              {widget.label}
            </span>
            <div className="text-3xl font-display font-extrabold tracking-wide my-1">
              {widget.value}
            </div>
            <span className="font-sans text-[10px] text-ink-soft">{widget.note}</span>
          </div>
        ))}

      </div>

      {/* Moderation Reports Table */}
      <div className="max-w-5xl mx-auto w-full">
        <div className="p-8 bg-pod-surface border border-pod-border text-ink rounded-2xl shadow-md">
          
          <span className="font-sans text-[10px] font-semibold text-ink-soft uppercase tracking-wider block mb-4">
            Moderation Reports Inbox ({reports.length})
          </span>

          {reports.length === 0 ? (
            <div className="text-center font-sans text-xs text-ink-soft italic py-10">
              No flagged reports to review. Board content is clean!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-pod-border text-ink-soft font-sans text-[10px] uppercase tracking-wider">
                    <th className="pb-3">Reporter</th>
                    <th className="pb-3">Target Type</th>
                    <th className="pb-3">Report Reason</th>
                    <th className="pb-3">Created</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pod-border">
                  {reports.map((report) => (
                    <tr key={report.id} className="hover:bg-black/5">
                      <td className="py-4 font-bold">{report.reporter?.display_name || "System"}</td>
                      <td className="py-4 capitalize font-sans font-bold text-red-500">{report.target_type}</td>
                      <td className="py-4 text-xs font-medium">{report.reason}</td>
                      <td className="py-4 text-ink-soft">
                        {new Date(report.created_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="py-4 text-right space-x-2">
                        <button
                          onClick={() => handleResolve(report.id, "dismissed")}
                          disabled={isPending}
                          className="px-3 py-1.5 border border-pod-border text-ink-soft hover:bg-black/5 rounded-full font-bold uppercase text-[9px] cursor-pointer disabled:opacity-50"
                        >
                          Dismiss
                        </button>
                        <button
                          onClick={() => handleDeleteContent(report.id, report.target_type, report.target_id)}
                          disabled={isPending}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold uppercase text-[9px] cursor-pointer disabled:opacity-50 shadow-xs"
                        >
                          Remove Content
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
