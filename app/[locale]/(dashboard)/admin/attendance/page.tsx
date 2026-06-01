"use client";

import { useState, useEffect, useCallback } from "react";
import { ClipboardCheck, Loader2, ChevronLeft, ChevronRight, Filter, Download, Upload } from "lucide-react";
import { NeuCard, NeuCardHeader, NeuCardTitle, NeuCardContent } from "@/components/ui/neu-card";
import { NeuButton } from "@/components/ui/neu-button";
import { NeuBadge } from "@/components/ui/neu-badge";
import { NeuSelect } from "@/components/ui/neu-select";
import { NeuInput } from "@/components/ui/neu-input";
import {
  NeuTable,
  NeuTableHeader,
  NeuTableBody,
  NeuTableRow,
  NeuTableHead,
  NeuTableCell,
} from "@/components/ui/neu-table";
import { NeuDialog } from "@/components/ui/neu-dialog";
import { List2, ListItem } from "@/components/ui/list-2";
import { User as UserIcon, MapPin, Clock } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";

interface AttendanceRecord {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    employeeId?: string;
  };
  date: string;
  checkIn: string;
  checkOut: string | null;
  status: "present" | "absent" | "late" | "half-day" | "on-leave";
  hoursWorked: number;
  notes?: string;
  overriddenBy?: { name: string };
  overriddenAt?: string;
  outOfOffice?: boolean;
  location?: {
    lat: number | null;
    lng: number | null;
  };
}

interface TodaySummary {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  onLeaveToday: number;
}

export default function AdminAttendancePage() {
  const t = useTranslations("admin.attendance");
  const tc = useTranslations("admin.common");
  const locale = useLocale();

  const statusOptions = [
    { value: "", label: t("allStatuses") },
    { value: "present", label: "Present" },
    { value: "absent", label: "Absent" },
    { value: "late", label: "Late" },
    { value: "half-day", label: "Half Day" },
    { value: "on-leave", label: "On Leave" },
  ];

  const overrideStatusOptions = [
    { value: "present", label: "Present" },
    { value: "absent", label: "Absent" },
    { value: "late", label: "Late" },
    { value: "half-day", label: "Half Day" },
    { value: "on-leave", label: "On Leave" },
  ];

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<TodaySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState<string>("");
  const [filters, setFilters] = useState({ status: "", search: "" });

  const [isOverrideDialogOpen, setIsOverrideDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [overrideStatus, setOverrideStatus] = useState("");
  const [overrideNotes, setOverrideNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);

  useEffect(() => {
    const now = new Date();
    setCurrentMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
  }, []);

  const fetchAttendance = useCallback(async () => {
    if (!currentMonth) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/attendance?month=${currentMonth}`);
      const data = await response.json();
      if (data.success) {
        setRecords(data.data.records || []);
      } else {
        setError(data.error || "Failed to fetch attendance");
      }
    } catch (err) {
      setError("Failed to fetch attendance");
    } finally {
      setIsLoading(false);
    }
  }, [currentMonth]);

  const fetchSummary = useCallback(async () => {
    try {
      const response = await fetch("/api/attendance/today-summary");
      const data = await response.json();
      if (data.success) {
        setSummary(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch summary", err);
    }
  }, []);

  useEffect(() => {
    fetchAttendance();
    fetchSummary();
  }, [fetchAttendance, fetchSummary]);

  const getPreviousMonth = (month: string) => {
    const [year, monthNum] = month.split("-").map(Number);
    const date = new Date(year, monthNum - 2);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  };

  const getNextMonth = (month: string) => {
    const [year, monthNum] = month.split("-").map(Number);
    const date = new Date(year, monthNum);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  };

  const getMonthName = (monthStr: string) => {
    const [year, month] = monthStr.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString(locale, { month: "long", year: "numeric" });
  };

  const getLocationBadge = (record: AttendanceRecord) => {
    if (!record.location?.lat || !record.location?.lng) {
      return <NeuBadge variant="default">No GPS</NeuBadge>;
    }
    if (record.outOfOffice) {
      return <NeuBadge variant="warning">Out of Office</NeuBadge>;
    }
    return <NeuBadge variant="success">In Office</NeuBadge>;
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "present": return "present" as const;
      case "late": return "late" as const;
      case "absent": return "absent" as const;
      case "half-day": return "warning" as const;
      case "on-leave": return "accent" as const;
      default: return "default" as const;
    }
  };

  const filteredRecords = records.filter((record) => {
    const matchesStatus = !filters.status || record.status === filters.status;
    const matchesSearch =
      !filters.search ||
      record.userId.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      record.userId.email.toLowerCase().includes(filters.search.toLowerCase()) ||
      record.userId.employeeId?.toLowerCase().includes(filters.search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const openOverrideDialog = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setOverrideStatus(record.status);
    setOverrideNotes("");
    setIsOverrideDialogOpen(true);
  };

  const handleOverride = async () => {
    if (!selectedRecord) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/attendance/${selectedRecord._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: overrideStatus, notes: overrideNotes }),
      });
      const data = await response.json();
      if (data.success) {
        setIsOverrideDialogOpen(false);
        fetchAttendance();
      } else {
        setError(data.error || "Failed to override attendance");
      }
    } catch (err) {
      setError("Failed to override attendance");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImport = async () => {
    if (!importFile) return;
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("file", importFile);
    try {
      const response = await fetch("/api/attendance/import", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        setImportResult(data.data);
        fetchAttendance();
      } else {
        setError(data.error || "Failed to import");
      }
    } catch (err) {
      setError("Failed to import");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--neu-text)] flex items-center gap-3">
            <ClipboardCheck className="w-6 h-6 md:w-8 md:h-8 text-[var(--neu-accent)]" />
            {t("title")}
          </h1>
          <p className="text-xs md:text-sm text-[var(--neu-text-secondary)] mt-1">
            {t("description")}
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <NeuButton variant="ghost" onClick={() => setIsImportDialogOpen(true)} className="flex-1 sm:flex-none">
            <Upload className="w-4 h-4" />
            {t("importCsv")}
          </NeuButton>
        </div>
      </div>

      {/* Today's Summary */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          <NeuCard>
            <NeuCardContent className="p-4">
              <p className="text-sm text-[var(--neu-text-secondary)]">{t("totalEmployees")}</p>
              <p className="text-2xl font-bold">{summary.totalEmployees}</p>
            </NeuCardContent>
          </NeuCard>
          <NeuCard>
            <NeuCardContent className="p-4">
              <p className="text-sm text-[var(--neu-text-secondary)]">{t("present")}</p>
              <p className="text-2xl font-bold text-[var(--neu-success)]">{summary.presentToday}</p>
            </NeuCardContent>
          </NeuCard>
          <NeuCard>
            <NeuCardContent className="p-4">
              <p className="text-sm text-[var(--neu-text-secondary)]">{t("absent")}</p>
              <p className="text-2xl font-bold text-[var(--neu-danger)]">{summary.absentToday}</p>
            </NeuCardContent>
          </NeuCard>
          <NeuCard>
            <NeuCardContent className="p-4">
              <p className="text-sm text-[var(--neu-text-secondary)]">{t("late")}</p>
              <p className="text-2xl font-bold text-[var(--neu-warning)]">{summary.lateToday}</p>
            </NeuCardContent>
          </NeuCard>
          <NeuCard>
            <NeuCardContent className="p-4">
              <p className="text-sm text-[var(--neu-text-secondary)]">{t("onLeave")}</p>
              <p className="text-2xl font-bold">{summary.onLeaveToday}</p>
            </NeuCardContent>
          </NeuCard>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4 items-center bg-white/5 p-4 rounded-xl border border-white/10">
        <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-start bg-[var(--neu-surface)] p-1 rounded-lg border border-[var(--neu-border)]">
          <NeuButton
            size="icon"
            variant="ghost"
            onClick={() => setCurrentMonth(getPreviousMonth(currentMonth))}
            className="h-9 w-9"
          >
            <ChevronLeft className="w-4 h-4" />
          </NeuButton>
          <span className="text-sm font-bold min-w-[120px] text-center text-[var(--neu-text)] uppercase tracking-wider">
            {currentMonth ? getMonthName(currentMonth) : ""}
          </span>
          <NeuButton
            size="icon"
            variant="ghost"
            onClick={() => setCurrentMonth(getNextMonth(currentMonth))}
            className="h-9 w-9"
          >
            <ChevronRight className="w-4 h-4" />
          </NeuButton>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full flex-1">
          <div className="flex-1">
            <NeuSelect
              options={statusOptions}
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full h-11"
              placeholder={t("allStatuses")}
            />
          </div>
          <div className="flex-[2]">
            <NeuInput
              placeholder={t("searchPlaceholder")}
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              icon={<Filter className="w-4 h-4" />}
              className="w-full h-11"
            />
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <NeuCard>
        <NeuCardHeader>
          <NeuCardTitle>{t("tableTitle", { count: filteredRecords.length })}</NeuCardTitle>
        </NeuCardHeader>
        <NeuCardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--neu-accent)]" />
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-12 text-[var(--neu-text-secondary)]">
              <ClipboardCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>{t("noRecords")}</p>
            </div>
          ) : (
            <List2
              items={filteredRecords.map((record) => ({
                icon: <UserIcon className="w-5 h-5" />,
                title: record.userId.name,
                category: record.userId.employeeId || "No ID",
                description: (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 opacity-70">
                        <Clock className="w-3.5 h-3.5" />
                        {record.checkIn ? new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "-"}
                      </span>
                      <span>→</span>
                      <span className="flex items-center gap-1 opacity-70">
                        {record.checkOut ? new Date(record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "-"}
                      </span>
                      <span className="ml-2 font-bold text-[var(--neu-accent)]">
                        {record.hoursWorked?.toFixed(1) || "0"}h
                      </span>
                    </div>
                    <div className="text-sm font-medium opacity-60">
                      {record.date}
                    </div>
                  </div>
                ),
                status: (
                  <div className="flex items-center gap-3">
                    {getLocationBadge(record)}
                    <NeuBadge variant={getStatusBadgeVariant(record.status)}>
                      {record.status}
                    </NeuBadge>
                  </div>
                ),
                onClick: () => openOverrideDialog(record)
              }))}
            />
          )}
        </NeuCardContent>
      </NeuCard>

      {/* Override Dialog */}
      <NeuDialog
        open={isOverrideDialogOpen}
        onClose={() => setIsOverrideDialogOpen(false)}
        title={t("overrideDialog.title")}
      >
        <div className="space-y-4">
          {selectedRecord && (
            <div className="p-4 bg-[var(--neu-surface-light)] rounded-[var(--neu-radius)]">
              <p className="font-medium">{selectedRecord.userId.name}</p>
              <p className="text-sm text-[var(--neu-text-secondary)]">
                {selectedRecord.date} • Current: {selectedRecord.status}
              </p>
            </div>
          )}
          <NeuSelect
            label={t("overrideDialog.newStatus")}
            options={overrideStatusOptions}
            value={overrideStatus}
            onChange={(e) => setOverrideStatus(e.target.value)}
          />
          <NeuInput
            label={t("overrideDialog.notes")}
            placeholder={t("overrideDialog.notesPlaceholder")}
            value={overrideNotes}
            onChange={(e) => setOverrideNotes(e.target.value)}
          />
          <div className="flex gap-3 pt-4">
            <NeuButton
              variant="accent"
              onClick={handleOverride}
              loading={isSubmitting}
              className="flex-1"
            >
              {t("overrideDialog.updateStatus")}
            </NeuButton>
            <NeuButton
              variant="ghost"
              onClick={() => setIsOverrideDialogOpen(false)}
              disabled={isSubmitting}
            >
              {tc("cancel")}
            </NeuButton>
          </div>
        </div>
      </NeuDialog>

      {/* Import Dialog */}
      <NeuDialog
        open={isImportDialogOpen}
        onClose={() => {
          setIsImportDialogOpen(false);
          setImportResult(null);
          setImportFile(null);
        }}
        title={t("importDialog.title")}
      >
        <div className="space-y-4">
          {!importResult ? (
            <>
              <p className="text-sm text-[var(--neu-text-secondary)]">
                {t("importDialog.csvFormat")}
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-[var(--neu-text-secondary)]
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-[var(--neu-accent)] file:text-white
                  hover:file:bg-[var(--neu-accent-hover)]"
              />
              <div className="flex gap-3 pt-4">
                <NeuButton
                  variant="accent"
                  onClick={handleImport}
                  loading={isSubmitting}
                  disabled={!importFile}
                  className="flex-1"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {t("importDialog.import")}
                </NeuButton>
                <NeuButton
                  variant="ghost"
                  onClick={() => setIsImportDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  {tc("cancel")}
                </NeuButton>
              </div>
            </>
          ) : (
            <>
              <div className="p-4 bg-[var(--neu-success)]/10 rounded-[var(--neu-radius)]">
                <p className="font-medium text-[var(--neu-success)]">
                  {t("importDialog.importComplete")}
                </p>
                <p className="text-sm mt-1">
                  {t("importDialog.importedSkipped", {
                    imported: importResult.imported,
                    skipped: importResult.skipped,
                  })}
                </p>
              </div>
              {importResult.errors.length > 0 && (
                <div className="max-h-40 overflow-y-auto">
                  <p className="text-sm font-medium mb-2">{t("importDialog.errors")}</p>
                  {importResult.errors.map((err, i) => (
                    <p key={i} className="text-xs text-[var(--neu-danger)]">
                      {err}
                    </p>
                  ))}
                </div>
              )}
              <NeuButton
                variant="accent"
                onClick={() => {
                  setImportResult(null);
                  setImportFile(null);
                  setIsImportDialogOpen(false);
                }}
                className="w-full"
              >
                {t("importDialog.done")}
              </NeuButton>
            </>
          )}
        </div>
      </NeuDialog>
    </div>
  );
}
