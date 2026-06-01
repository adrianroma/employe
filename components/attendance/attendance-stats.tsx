"use client";

import { UserCheck, UserX, Clock, TrendingUp, Timer, Users } from "lucide-react";
import { NeuStatCard } from "@/components/ui/neu-stat-card";
import { ChipLoader } from "@/components/ui/chip-loader";
import { useTranslations } from "next-intl";

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

interface AttendanceStatsProps {
  stats: AttendanceStatsData | null;
  isLoading?: boolean;
}

export function AttendanceStats({ stats, isLoading }: AttendanceStatsProps) {
  const t = useTranslations("admin.stats");

  if (isLoading || !stats) {
    return <ChipLoader size="md" />;
  }

  const getTrend = (value: number): "up" | "down" | "neutral" => {
    if (value > 0) return "up";
    if (value < 0) return "down";
    return "neutral";
  };

  const formatTrendValue = (value: number): string => {
    const sign = value > 0 ? "+" : "";
    return `${sign}${value}%`;
  };

  return (
    <div className="space-y-4">
      {/* First Row - 4 cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <NeuStatCard
          title={t("presentToday")}
          value={stats.presentToday}
          icon={<UserCheck className="w-6 h-6" />}
          trend={getTrend(stats.presentTrend)}
          trendValue={stats.presentTrend !== 0 ? formatTrendValue(stats.presentTrend) : undefined}
          subtitle={t("vsYesterday")}
        />
        <NeuStatCard
          title={t("absentToday")}
          value={stats.absentToday}
          icon={<UserX className="w-6 h-6" />}
          trend="down"
          subtitle={t("employees")}
        />
        <NeuStatCard
          title={t("lateToday")}
          value={stats.lateToday}
          icon={<Clock className="w-6 h-6" />}
          trend={getTrend(stats.lateTrend)}
          trendValue={stats.lateTrend !== 0 ? formatTrendValue(stats.lateTrend) : undefined}
          subtitle={t("vsYesterday")}
        />
        <NeuStatCard
          title={t("attendanceRate")}
          value={`${stats.attendanceRate}%`}
          icon={<TrendingUp className="w-6 h-6" />}
          trend={stats.attendanceRate >= 90 ? "up" : stats.attendanceRate >= 75 ? "neutral" : "down"}
          subtitle={t("thisMonth")}
        />
      </div>

      {/* Second Row - 2 cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <NeuStatCard
          title={t("avgHours")}
          value={`${stats.avgHoursThisMonth}h`}
          icon={<Timer className="w-6 h-6" />}
          subtitle={t("thisMonth")}
        />
        <NeuStatCard
          title={t("totalEmployees")}
          value={stats.totalEmployees}
          icon={<Users className="w-6 h-6" />}
          subtitle={t("active")}
        />
      </div>
    </div>
  );
}
