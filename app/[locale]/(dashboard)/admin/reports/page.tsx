"use client";

import { useState, useEffect } from "react";
import { BarChart2, Users, CheckCircle, XCircle, Calendar, Loader2 } from "lucide-react";
import { NeuCard, NeuCardHeader, NeuCardTitle, NeuCardContent } from "@/components/ui/neu-card";
import { NeuBadge } from "@/components/ui/neu-badge";
import { NeuSelect } from "@/components/ui/neu-select";
import { NeuStatCard } from "@/components/ui/neu-stat-card";
import { AttendanceBarChart } from "@/components/charts/attendance-bar-chart";
import { AttendanceTrendChart } from "@/components/charts/attendance-trend-chart";
import { DepartmentPieChart } from "@/components/charts/department-pie-chart";
import {
  NeuTable,
  NeuTableHeader,
  NeuTableBody,
  NeuTableRow,
  NeuTableHead,
  NeuTableCell,
} from "@/components/ui/neu-table";
import { EmptyState } from "@/components/ui/empty-state";
import { useTranslations, useLocale } from "next-intl";

interface TodayStats {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  onLeaveToday: number;
}

interface MonthlyData {
  date: string;
  present: number;
  absent: number;
  late: number;
}

interface DepartmentData {
  name: string;
  value: number;
}

interface TrendData {
  month: string;
  present: number;
  absent: number;
  late: number;
}

interface TopPerformer {
  userId: string;
  name: string;
  employeeId: string;
  department: string;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  attendanceRate: number;
  punctualityScore: number;
}

export default function AdminReportsPage() {
  const t = useTranslations("admin.reports");
  const locale = useLocale();

  const monthOptions = [
    { value: "1", label: new Date(0, 0).toLocaleString(locale, { month: "long" }) },
    { value: "2", label: new Date(0, 1).toLocaleString(locale, { month: "long" }) },
    { value: "3", label: new Date(0, 2).toLocaleString(locale, { month: "long" }) },
    { value: "4", label: new Date(0, 3).toLocaleString(locale, { month: "long" }) },
    { value: "5", label: new Date(0, 4).toLocaleString(locale, { month: "long" }) },
    { value: "6", label: new Date(0, 5).toLocaleString(locale, { month: "long" }) },
    { value: "7", label: new Date(0, 6).toLocaleString(locale, { month: "long" }) },
    { value: "8", label: new Date(0, 7).toLocaleString(locale, { month: "long" }) },
    { value: "9", label: new Date(0, 8).toLocaleString(locale, { month: "long" }) },
    { value: "10", label: new Date(0, 9).toLocaleString(locale, { month: "long" }) },
    { value: "11", label: new Date(0, 10).toLocaleString(locale, { month: "long" }) },
    { value: "12", label: new Date(0, 11).toLocaleString(locale, { month: "long" }) },
  ];

  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [todayStats, setTodayStats] = useState<TodayStats | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [departmentData, setDepartmentData] = useState<DepartmentData[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([]);

  useEffect(() => {
    const now = new Date();
    setSelectedMonth(String(now.getMonth() + 1));
    setSelectedYear(String(now.getFullYear()));
  }, []);

  useEffect(() => {
    if (!selectedMonth || !selectedYear) return;

    const fetchReports = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [statsRes, monthlyRes, deptRes, trendRes, performersRes] = await Promise.all([
          fetch("/api/attendance/stats"),
          fetch(`/api/reports/monthly?month=${selectedMonth}&year=${selectedYear}`),
          fetch(`/api/reports/department?month=${selectedMonth}&year=${selectedYear}`),
          fetch("/api/reports/trend?months=6"),
          fetch(`/api/reports/top-performers?month=${selectedMonth}&year=${selectedYear}&limit=10`),
        ]);

        const statsData = await statsRes.json();
        const monthlyData = await monthlyRes.json();
        const deptData = await deptRes.json();
        const trendData = await trendRes.json();
        const performersData = await performersRes.json();

        if (statsData.success) setTodayStats(statsData.data);
        if (monthlyData.success) setMonthlyData(monthlyData.data || []);
        if (deptData.success) {
          const pieData = deptData.data
            .filter((d: { totalEmployees: number }) => d.totalEmployees > 0)
            .map((d: { departmentName: string; totalEmployees: number }) => ({
              name: d.departmentName,
              value: d.totalEmployees,
            }));
          setDepartmentData(pieData);
        }
        if (trendData.success) setTrendData(trendData.data || []);
        if (performersData.success) setTopPerformers(performersData.data || []);
      } catch (err) {
        setError("Failed to load reports");
      } finally {
        setIsLoading(false);
      }
    };

    fetchReports();
  }, [selectedMonth, selectedYear]);

  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const year = new Date().getFullYear() - 2 + i;
    return { value: String(year), label: String(year) };
  });

  if (isLoading && !todayStats) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--neu-accent)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--neu-text)]">{t("title")}</h1>
          <p className="text-[var(--neu-text-secondary)]">{t("description")}</p>
        </div>

        <div className="flex gap-3">
          <NeuSelect
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            options={monthOptions}
            className="w-40"
          />
          <NeuSelect
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            options={yearOptions}
            className="w-32"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <NeuStatCard
          title={t("totalEmployees")}
          value={todayStats?.totalEmployees || 0}
          icon={<Users className="w-6 h-6" />}
          trend="neutral"
          trendValue="0%"
        />
        <NeuStatCard
          title={t("presentToday")}
          value={todayStats?.presentToday || 0}
          icon={<CheckCircle className="w-6 h-6" />}
          trend="up"
          trendValue="0%"
        />
        <NeuStatCard
          title={t("absentToday")}
          value={todayStats?.absentToday || 0}
          icon={<XCircle className="w-6 h-6" />}
          trend="down"
          trendValue="0%"
        />
        <NeuStatCard
          title={t("onLeaveToday")}
          value={todayStats?.onLeaveToday || 0}
          icon={<Calendar className="w-6 h-6" />}
          trend="neutral"
          trendValue="0%"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <NeuCard>
          <NeuCardHeader>
            <NeuCardTitle>{t("monthlyOverview")}</NeuCardTitle>
          </NeuCardHeader>
          <NeuCardContent>
            {monthlyData.length > 0 ? (
              <AttendanceBarChart data={monthlyData} />
            ) : (
              <EmptyState
                icon={BarChart2}
                title={t("noData")}
                description={t("noAttendanceRecords")}
              />
            )}
          </NeuCardContent>
        </NeuCard>

        <NeuCard>
          <NeuCardHeader>
            <NeuCardTitle>{t("departmentDistribution")}</NeuCardTitle>
          </NeuCardHeader>
          <NeuCardContent>
            {departmentData.length > 0 ? (
              <DepartmentPieChart data={departmentData} />
            ) : (
              <EmptyState
                icon={Users}
                title={t("noData")}
                description={t("noDepartmentData")}
              />
            )}
          </NeuCardContent>
        </NeuCard>
      </div>

      {/* Trend Chart */}
      <NeuCard>
        <NeuCardHeader>
          <NeuCardTitle>{t("trendTitle")}</NeuCardTitle>
        </NeuCardHeader>
        <NeuCardContent>
          {trendData.length > 0 ? (
            <AttendanceTrendChart data={trendData} />
          ) : (
            <EmptyState
              icon={BarChart2}
              title={t("noTrendData")}
              description={t("insufficientData")}
            />
          )}
        </NeuCardContent>
      </NeuCard>

      {/* Top Performers Table */}
      <NeuCard>
        <NeuCardHeader>
          <NeuCardTitle>{t("topPerformers")}</NeuCardTitle>
        </NeuCardHeader>
        <NeuCardContent>
          {topPerformers.length > 0 ? (
            <NeuTable>
              <NeuTableHeader>
                <NeuTableRow>
                  <NeuTableHead>{t("rank")}</NeuTableHead>
                  <NeuTableHead>{t("employee")}</NeuTableHead>
                  <NeuTableHead>{t("department")}</NeuTableHead>
                  <NeuTableHead>{t("presentDays")}</NeuTableHead>
                  <NeuTableHead>{t("lateDays")}</NeuTableHead>
                  <NeuTableHead>{t("attendanceRate")}</NeuTableHead>
                  <NeuTableHead>{t("punctuality")}</NeuTableHead>
                </NeuTableRow>
              </NeuTableHeader>
              <NeuTableBody>
                {topPerformers.map((performer, index) => (
                  <NeuTableRow key={performer.userId}>
                    <NeuTableCell>
                      <NeuBadge
                        variant={index < 3 ? "success" : "default"}
                        className="w-8 h-8 flex items-center justify-center rounded-full"
                      >
                        {index + 1}
                      </NeuBadge>
                    </NeuTableCell>
                    <NeuTableCell>
                      <div>
                        <p className="font-medium">{performer.name}</p>
                        <p className="text-sm text-[var(--neu-text-secondary)]">
                          {performer.employeeId}
                        </p>
                      </div>
                    </NeuTableCell>
                    <NeuTableCell>{performer.department}</NeuTableCell>
                    <NeuTableCell>{performer.presentDays}</NeuTableCell>
                    <NeuTableCell>
                      <NeuBadge variant={performer.lateDays === 0 ? "success" : "warning"}>
                        {performer.lateDays}
                      </NeuBadge>
                    </NeuTableCell>
                    <NeuTableCell>
                      <NeuBadge variant={performer.attendanceRate >= 95 ? "success" : performer.attendanceRate >= 80 ? "warning" : "error"}>
                        {performer.attendanceRate}%
                      </NeuBadge>
                    </NeuTableCell>
                    <NeuTableCell>
                      <NeuBadge variant={performer.punctualityScore >= 90 ? "success" : performer.punctualityScore >= 70 ? "warning" : "error"}>
                        {performer.punctualityScore}
                      </NeuBadge>
                    </NeuTableCell>
                  </NeuTableRow>
                ))}
              </NeuTableBody>
            </NeuTable>
          ) : (
            <EmptyState
              icon={Users}
              title={t("noPerformersData")}
              description={t("noPerformersDescription")}
            />
          )}
        </NeuCardContent>
      </NeuCard>
    </div>
  );
}
