"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AttendanceStats } from "@/components/attendance/attendance-stats";
import { AttendanceFilters, FilterState } from "@/components/attendance/attendance-filters";
import { AttendanceTable } from "@/components/attendance/attendance-table";
import { AttendanceExport } from "@/components/attendance/attendance-export";
import { NeuCard, NeuCardHeader, NeuCardTitle, NeuCardContent } from "@/components/ui/neu-card";
import { NeuButton } from "@/components/ui/neu-button";
import { ChipLoader } from "@/components/ui/chip-loader";
import { useTranslations, useLocale } from "next-intl";

interface AttendanceStatsData {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  avgHoursThisMonth: number;
  attendanceRate: number;
  totalLateThisMonth: number;
  presentTrend: number;
  lateTrend: number;
  month: string;
}

interface AttendanceRecord {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    department?: string;
  };
  date: string;
  checkIn: string;
  checkOut: string | null;
  hoursWorked: number;
  status: "present" | "absent" | "late";
  notes?: string;
}

const ITEMS_PER_PAGE = 10;

export default function AdminDashboardPage() {
  const t = useTranslations("admin.dashboard");
  const tc = useTranslations("admin.common");
  const locale = useLocale();

  const [stats, setStats] = useState<AttendanceStatsData | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingRecords, setIsLoadingRecords] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<FilterState>({
    month: new Date().toISOString().slice(0, 7),
    employeeId: "",
    status: "",
    search: "",
  });

  const fetchStats = useCallback(async (month: string) => {
    setIsLoadingStats(true);
    try {
      const response = await fetch(`/api/attendance/stats?month=${month}`);
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      } else {
        setError(data.error || "Failed to fetch stats");
      }
    } catch (err) {
      setError("Failed to fetch stats");
      console.error(err);
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  const fetchRecords = useCallback(async (month: string) => {
    setIsLoadingRecords(true);
    try {
      const response = await fetch(`/api/attendance?month=${month}`);
      const data = await response.json();
      if (data.success) {
        const validRecords = Array.isArray(data.data.records) ? data.data.records : [];
        setRecords(validRecords);
        setFilteredRecords(validRecords);
      } else {
        setError(data.error || "Failed to fetch records");
      }
    } catch (err) {
      setError("Failed to fetch records");
      console.error(err);
    } finally {
      setIsLoadingRecords(false);
    }
  }, []);

  useEffect(() => {
    fetchStats(filters.month);
    fetchRecords(filters.month);
  }, [fetchStats, fetchRecords, filters.month]);

  useEffect(() => {
    let result = [...records];

    if (filters.employeeId) {
      result = result.filter(
        (record) =>
          typeof record.userId === "object" &&
          record.userId._id === filters.employeeId
      );
    }

    if (filters.status) {
      result = result.filter((record) => record.status === filters.status);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (record) =>
          typeof record.userId === "object" &&
          record.userId.name.toLowerCase().includes(searchLower)
      );
    }

    setFilteredRecords(result);
    setCurrentPage(1);
  }, [filters, records]);

  const handleFilter = (newFilters: FilterState) => {
    setFilters(newFilters);
    fetchStats(newFilters.month);
    fetchRecords(newFilters.month);
  };

  const handlePrevMonth = () => {
    const [year, month] = filters.month.split("-").map(Number);
    const date = new Date(year, month - 2, 1);
    const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    handleFilter({ ...filters, month: newMonth });
  };

  const handleNextMonth = () => {
    const [year, month] = filters.month.split("-").map(Number);
    const date = new Date(year, month, 1);
    const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    handleFilter({ ...filters, month: newMonth });
  };

  const totalPages = Math.ceil(filteredRecords.length / ITEMS_PER_PAGE);
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const formatMonthDisplay = (monthStr: string) => {
    const [year, month] = monthStr.split("-");
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleDateString(locale, { month: "long", year: "numeric" });
  };

  if (error) {
    return (
      <div className="space-y-8">
        <div className="text-center py-12">
          <p className="text-[var(--neu-danger)] text-lg">{error}</p>
          <NeuButton
            variant="accent"
            onClick={() => {
              setError(null);
              fetchStats(filters.month);
              fetchRecords(filters.month);
            }}
            className="mt-4"
          >
            {tc("retry")}
          </NeuButton>
        </div>
      </div>
    );
  }

  const isLoading = isLoadingStats || isLoadingRecords;

  return (
    <div className="relative space-y-8" style={{ minHeight: "400px" }}>
      {isLoading && (
        <ChipLoader overlay size="md" label={tc("loading")} />
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <NeuButton
            variant="ghost"
            size="icon"
            onClick={handlePrevMonth}
            aria-label={t("previousMonth")}
          >
            <ChevronLeft className="w-5 h-5" />
          </NeuButton>
          <h1 className="text-2xl font-bold text-[var(--neu-text)]">
            {formatMonthDisplay(filters.month)}
          </h1>
          <NeuButton
            variant="ghost"
            size="icon"
            onClick={handleNextMonth}
            aria-label={t("nextMonth")}
          >
            <ChevronRight className="w-5 h-5" />
          </NeuButton>
        </div>
        <AttendanceExport records={filteredRecords} month={filters.month} />
      </div>

      <AttendanceStats stats={stats} isLoading={false} />

      <AttendanceFilters onFilter={handleFilter} initialFilters={filters} />

      <NeuCard>
        <NeuCardHeader>
          <NeuCardTitle>{t("attendanceRecords")}</NeuCardTitle>
        </NeuCardHeader>
        <NeuCardContent>
          <AttendanceTable records={paginatedRecords} />

          {!isLoadingRecords && totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-[var(--neu-border)]">
              <p className="text-sm text-[var(--neu-text-secondary)]">
                {t("showing", {
                  from: (currentPage - 1) * ITEMS_PER_PAGE + 1,
                  to: Math.min(currentPage * ITEMS_PER_PAGE, filteredRecords.length),
                  total: filteredRecords.length,
                })}
              </p>
              <div className="flex gap-2">
                <NeuButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  {tc("previous")}
                </NeuButton>
                <NeuButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  {tc("next")}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </NeuButton>
              </div>
            </div>
          )}
        </NeuCardContent>
      </NeuCard>
    </div>
  );
}
