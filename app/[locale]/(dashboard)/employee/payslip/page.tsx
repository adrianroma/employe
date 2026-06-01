"use client";

import { useEffect, useState } from "react";
import { NeuCard, NeuCardContent } from "@/components/ui/neu-card";
import { NeuButton } from "@/components/ui/neu-button";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { FileText, Download } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";

interface PayrollRecord {
  _id: string;
  month: number;
  year: number;
  basicSalary: number;
  presentDays: number;
  absentDeduction: number;
  lateDeduction: number;
  unpaidLeaveDeduction: number;
  bonuses: number;
  netSalary: number;
  status: string;
}

export default function EmployeePayslipPage() {
  const t = useTranslations("employee.payslip");
  const locale = useLocale();

  const [payroll, setPayroll] = useState<PayrollRecord[]>([]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ _id: string; name: string; employeeId?: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, [month, year]);

  const fetchData = async () => {
    try {
      const [payrollRes, userRes] = await Promise.all([
        fetch(`/api/payroll/my?month=${month}&year=${year}`),
        fetch("/api/auth/me"),
      ]);

      const payrollData = await payrollRes.json();
      const userData = await userRes.json();

      if (payrollData.success) setPayroll(payrollData.data);
      if (userData.success) setUser(userData.data);
    } catch (error) {
      console.error("Failed to fetch payslip data", error);
    } finally {
      setLoading(false);
    }
  };

  const downloadPayslip = () => {
    if (user?._id) {
      window.open(`/api/export/payslip/${user._id}?month=${month}&year=${year}`, "_blank");
    }
  };

  const selectedPayroll = payroll[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">{t("title")}</h2>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
            className="flex-1 sm:flex-none px-3 py-2 rounded-lg bg-[var(--neu-surface)] border border-[var(--neu-border)] text-sm"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(0, i).toLocaleString(locale, { month: "long" })}
              </option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="flex-1 sm:flex-none px-3 py-2 rounded-lg bg-[var(--neu-surface)] border border-[var(--neu-border)] text-sm"
          >
            {[2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {!selectedPayroll ? (
        <EmptyState
          icon={FileText}
          title={t("noPayslip")}
          description={t("noPayslipDescription", {
            month: new Date(year, month - 1).toLocaleString(locale, { month: "long" }),
            year,
          })}
        />
      ) : (
        <NeuCard>
          <NeuCardContent className="p-4 sm:p-8 space-y-8">
            {/* Header */}
            <div className="border-b border-[var(--neu-border)] pb-6 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-xl font-bold text-[var(--neu-accent)]">Gruas Bermejo</h3>
                  <p className="text-sm text-[var(--neu-text-secondary)]">{t("employeePayslip")}</p>
                </div>
                <div className="sm:text-right">
                  <p className="font-medium">{user?.name}</p>
                  <p className="text-sm text-[var(--neu-text-secondary)]">ID: {user?.employeeId || "N/A"}</p>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-lg font-semibold">
                  {new Date(year, month - 1).toLocaleString(locale, { month: "long" })} {year}
                </p>
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-2 ${
                  selectedPayroll.status === "finalized"
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}>
                  {selectedPayroll.status.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Salary Details */}
            <div className="space-y-4">
              <div className="flex justify-between py-3 border-b border-[var(--neu-border)]">
                <span className="text-[var(--neu-text-secondary)]">{t("basicSalary")}</span>
                <span className="font-medium">${selectedPayroll.basicSalary.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-[var(--neu-border)]">
                <span className="text-[var(--neu-text-secondary)]">{t("presentDays")}</span>
                <span className="font-medium">{selectedPayroll.presentDays}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-[var(--neu-border)] text-red-600">
                <span>{t("absentDeduction")}</span>
                <span>-${selectedPayroll.absentDeduction.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-[var(--neu-border)] text-red-600">
                <span>{t("lateDeduction")}</span>
                <span>-${selectedPayroll.lateDeduction.toLocaleString()}</span>
              </div>
              {selectedPayroll.unpaidLeaveDeduction > 0 && (
                <div className="flex justify-between py-3 border-b border-[var(--neu-border)] text-red-600">
                  <span>{t("unpaidLeaveDeduction")}</span>
                  <span>-${selectedPayroll.unpaidLeaveDeduction.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between py-3 border-b border-[var(--neu-border)] text-green-600">
                <span>{t("bonuses")}</span>
                <span>+${selectedPayroll.bonuses.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-4 text-lg font-bold">
                <span>{t("netSalary")}</span>
                <span className="text-[var(--neu-accent)]">${selectedPayroll.netSalary.toLocaleString()}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-[var(--neu-border)]">
              <p className="text-xs text-[var(--neu-text-secondary)]">{t("computerGenerated")}</p>
              <p className="text-xs text-[var(--neu-text-secondary)] mt-1">
                {t("generatedOn", { date: new Date().toLocaleDateString(locale) })}
              </p>
            </div>

            {/* Download Button */}
            <div className="mt-6 flex justify-end">
              <NeuButton onClick={downloadPayslip} variant="accent">
                <Download className="w-4 h-4 mr-2" />
                {t("downloadPdf")}
              </NeuButton>
            </div>
          </NeuCardContent>
        </NeuCard>
      )}
    </div>
  );
}
