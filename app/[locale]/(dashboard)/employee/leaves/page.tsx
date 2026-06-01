"use client";

import { useEffect, useState } from "react";
import { NeuCard, NeuCardContent } from "@/components/ui/neu-card";
import { NeuButton } from "@/components/ui/neu-button";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { Calendar, XCircle, Clock } from "lucide-react";
import { List2 } from "@/components/ui/list-2";
import { NeuBadge } from "@/components/ui/neu-badge";
import { useTranslations } from "next-intl";

interface LeaveRequest {
  _id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
}

interface LeaveBalance {
  annual: number;
  sick: number;
  casual: number;
}

export default function EmployeeLeavesPage() {
  const t = useTranslations("employee.leaves");

  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [balance, setBalance] = useState<LeaveBalance>({ annual: 0, sick: 0, casual: 0 });
  const [loading, setLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    leaveType: "annual",
    startDate: "",
    endDate: "",
    reason: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [leavesRes, userRes] = await Promise.all([
        fetch("/api/leaves/my"),
        fetch("/api/auth/me"),
      ]);

      const leavesData = await leavesRes.json();
      const userData = await userRes.json();

      if (leavesData.success) setLeaves(leavesData.data);
      if (userData.success) setBalance(userData.data.leaveBalance || { annual: 0, sick: 0, casual: 0 });
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch("/api/leaves/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowApplyModal(false);
        setFormData({ leaveType: "annual", startDate: "", endDate: "", reason: "" });
        fetchData();
      }
    } catch (error) {
      console.error("Failed to apply for leave", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      const response = await fetch(`/api/leaves/my?id=${id}`, { method: "DELETE" });
      if (response.ok) fetchData();
    } catch (error) {
      console.error("Failed to cancel leave", error);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "approved": return "success" as const;
      case "rejected": return "error" as const;
      default: return "default" as const;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{t("title")}</h2>
          <p className="text-sm text-[var(--neu-text-secondary)] mt-1">{t("description")}</p>
        </div>
        <NeuButton onClick={() => setShowApplyModal(true)} variant="accent" className="w-full sm:w-auto">
          <Calendar className="w-4 h-4" />
          {t("applyButton")}
        </NeuButton>
      </div>

      {/* Leave Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <NeuCard>
          <NeuCardContent className="p-4 text-center">
            <p className="text-sm text-[var(--neu-text-secondary)]">{t("annualLeave")}</p>
            <p className="text-3xl font-bold text-blue-600">{balance.annual}</p>
            <p className="text-xs text-[var(--neu-text-secondary)]">{t("daysRemaining")}</p>
          </NeuCardContent>
        </NeuCard>
        <NeuCard>
          <NeuCardContent className="p-4 text-center">
            <p className="text-sm text-[var(--neu-text-secondary)]">{t("sickLeave")}</p>
            <p className="text-3xl font-bold text-green-600">{balance.sick}</p>
            <p className="text-xs text-[var(--neu-text-secondary)]">{t("daysRemaining")}</p>
          </NeuCardContent>
        </NeuCard>
        <NeuCard>
          <NeuCardContent className="p-4 text-center">
            <p className="text-sm text-[var(--neu-text-secondary)]">{t("casualLeave")}</p>
            <p className="text-3xl font-bold text-purple-600">{balance.casual}</p>
            <p className="text-xs text-[var(--neu-text-secondary)]">{t("daysRemaining")}</p>
          </NeuCardContent>
        </NeuCard>
      </div>

      {/* Leave History */}
      <NeuCard>
        <NeuCardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">{t("historyTitle")}</h3>
          {leaves.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title={t("noLeaves")}
              description={t("noLeavesDescription")}
            />
          ) : (
            <List2
              items={leaves.map((leave) => ({
                icon: <Calendar className="w-5 h-5 text-[var(--neu-accent)]" />,
                title: leave.leaveType.toUpperCase(),
                category: t("leaveRequest"),
                description: (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 opacity-80">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}</span>
                      <span className="font-bold text-[var(--neu-accent)]">{t("days", { days: leave.totalDays })}</span>
                    </div>
                    <div className="text-sm italic opacity-60 line-clamp-1">
                      &quot;{leave.reason}&quot;
                    </div>
                  </div>
                ),
                status: (
                  <div className="flex items-center gap-3">
                    <NeuBadge variant={getStatusBadgeVariant(leave.status)}>
                      {leave.status}
                    </NeuBadge>
                    {leave.status === "pending" && (
                      <NeuButton
                        size="icon"
                        variant="ghost"
                        onClick={() => handleCancel(leave._id)}
                        className="h-8 w-8 text-[var(--neu-danger)] hover:bg-[var(--neu-danger)]/10"
                      >
                        <XCircle className="w-4 h-4" />
                      </NeuButton>
                    )}
                  </div>
                )
              }))}
            />
          )}
        </NeuCardContent>
      </NeuCard>

      {/* Apply Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--neu-surface)] rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">{t("applyModal.title")}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t("applyModal.leaveType")}</label>
                <select
                  value={formData.leaveType}
                  onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--neu-border)] bg-[var(--neu-bg)]"
                >
                  <option value="annual">{t("applyModal.annual")}</option>
                  <option value="sick">{t("applyModal.sick")}</option>
                  <option value="casual">{t("applyModal.casual")}</option>
                  <option value="unpaid">{t("applyModal.unpaid")}</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t("applyModal.startDate")}</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-[var(--neu-border)] bg-[var(--neu-bg)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t("applyModal.endDate")}</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-[var(--neu-border)] bg-[var(--neu-bg)]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t("applyModal.reason")}</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  required
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--neu-border)] bg-[var(--neu-bg)]"
                />
              </div>
              <div className="flex gap-4">
                <NeuButton type="submit" variant="accent" loading={submitting} className="flex-1">
                  {t("applyModal.submit")}
                </NeuButton>
                <NeuButton type="button" variant="ghost" onClick={() => setShowApplyModal(false)}>
                  {t("applyModal.cancel")}
                </NeuButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
