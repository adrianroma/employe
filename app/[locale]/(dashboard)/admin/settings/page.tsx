"use client";

import { useState, useEffect } from "react";
import { Settings, MapPin, Mail, Loader2, CheckCircle, AlertTriangle, Save, Send } from "lucide-react";
import { NeuCard, NeuCardHeader, NeuCardTitle, NeuCardContent } from "@/components/ui/neu-card";
import { NeuButton } from "@/components/ui/neu-button";
import { NeuBadge } from "@/components/ui/neu-badge";
import { NeuInput } from "@/components/ui/neu-input";
import { NeuToast } from "@/components/ui/neu-toast";
import { useTranslations } from "next-intl";

interface LocationSettings {
  officeLat: number;
  officeLng: number;
  radiusMeters: number;
  strictGeofence: boolean;
}

interface EmailSettings {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  autoSendPayslip: boolean;
}

export default function AdminSettingsPage() {
  const t = useTranslations("admin.settings");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [locationSettings, setLocationSettings] = useState<LocationSettings>({
    officeLat: 0,
    officeLng: 0,
    radiusMeters: 100,
    strictGeofence: false,
  });

  const [emailSettings, setEmailSettings] = useState<EmailSettings>({
    smtpHost: "",
    smtpPort: 587,
    smtpUser: "",
    autoSendPayslip: false,
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/settings/location");
        const data = await response.json();

        if (data.success) {
          setLocationSettings(data.data);
        }

        setEmailSettings({
          smtpHost: process.env.SMTP_HOST || "smtp.gmail.com",
          smtpPort: parseInt(process.env.SMTP_PORT || "587"),
          smtpUser: process.env.SMTP_USER || "",
          autoSendPayslip: false,
        });
      } catch (error) {
        setToast({ message: "Failed to load settings", type: "error" });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSaveLocationSettings = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/settings/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(locationSettings),
      });

      const data = await response.json();

      if (data.success) {
        setToast({ message: "Location settings saved successfully", type: "success" });
      } else {
        setToast({ message: data.error || "Failed to save settings", type: "error" });
      }
    } catch (error) {
      setToast({ message: "Failed to save settings", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestEmail = async () => {
    setIsTestingEmail(true);
    try {
      const response = await fetch("/api/admin/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (data.success) {
        setToast({ message: data.message || "Test email sent successfully", type: "success" });
      } else {
        setToast({ message: data.error || "Failed to send test email", type: "error" });
      }
    } catch (error) {
      setToast({ message: "Failed to send test email", type: "error" });
    } finally {
      setIsTestingEmail(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--neu-accent)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && (
        <NeuToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--neu-text)] flex items-center gap-2">
          <Settings className="w-6 h-6" />
          {t("title")}
        </h1>
        <p className="text-[var(--neu-text-secondary)]">{t("description")}</p>
      </div>

      {/* Geo-location Settings */}
      <NeuCard>
        <NeuCardHeader>
          <NeuCardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            {t("geoTitle")}
          </NeuCardTitle>
        </NeuCardHeader>
        <NeuCardContent>
          <div className="space-y-6">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900">{t("geofenceTitle")}</p>
                  <p className="text-sm text-blue-700">{t("geofenceDescription")}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--neu-text)] mb-2">
                  {t("officeLat")}
                </label>
                <NeuInput
                  type="number"
                  step="0.000001"
                  min="-90"
                  max="90"
                  value={locationSettings.officeLat}
                  onChange={(e) =>
                    setLocationSettings({ ...locationSettings, officeLat: parseFloat(e.target.value) || 0 })
                  }
                  placeholder={t("latPlaceholder")}
                />
                <p className="text-xs text-[var(--neu-text-secondary)] mt-1">{t("latRange")}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--neu-text)] mb-2">
                  {t("officeLng")}
                </label>
                <NeuInput
                  type="number"
                  step="0.000001"
                  min="-180"
                  max="180"
                  value={locationSettings.officeLng}
                  onChange={(e) =>
                    setLocationSettings({ ...locationSettings, officeLng: parseFloat(e.target.value) || 0 })
                  }
                  placeholder={t("lngPlaceholder")}
                />
                <p className="text-xs text-[var(--neu-text-secondary)] mt-1">{t("lngRange")}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--neu-text)] mb-2">
                {t("radius")}
              </label>
              <NeuInput
                type="number"
                min="10"
                max="5000"
                value={locationSettings.radiusMeters}
                onChange={(e) =>
                  setLocationSettings({ ...locationSettings, radiusMeters: parseInt(e.target.value) || 100 })
                }
              />
              <p className="text-xs text-[var(--neu-text-secondary)] mt-1">{t("radiusRange")}</p>
            </div>

            <div className="flex items-center gap-4 p-4 bg-[var(--neu-bg)] rounded-lg">
              <div className="flex-1">
                <label className="block text-sm font-medium text-[var(--neu-text)] mb-1">
                  {t("geofenceMode")}
                </label>
                <p className="text-sm text-[var(--neu-text-secondary)]">
                  {locationSettings.strictGeofence ? t("strictDescription") : t("lenientDescription")}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm ${!locationSettings.strictGeofence ? "font-medium" : ""}`}>
                  {t("lenient")}
                </span>
                <button
                  onClick={() =>
                    setLocationSettings({
                      ...locationSettings,
                      strictGeofence: !locationSettings.strictGeofence,
                    })
                  }
                  className={`
                    relative w-14 h-7 rounded-full transition-colors duration-200
                    ${locationSettings.strictGeofence ? "bg-green-500" : "bg-gray-300"}
                  `}
                >
                  <span
                    className={`
                      absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform duration-200
                      ${locationSettings.strictGeofence ? "translate-x-7" : "translate-x-0"}
                    `}
                  />
                </button>
                <span className={`text-sm ${locationSettings.strictGeofence ? "font-medium text-green-600" : ""}`}>
                  {t("strict")}
                </span>
              </div>
            </div>

            <div className="flex justify-end">
              <NeuButton
                onClick={handleSaveLocationSettings}
                disabled={isSaving}
                className="flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t("saving")}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {t("saveSettings")}
                  </>
                )}
              </NeuButton>
            </div>
          </div>
        </NeuCardContent>
      </NeuCard>

      {/* Email Settings */}
      <NeuCard>
        <NeuCardHeader>
          <NeuCardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            {t("emailTitle")}
          </NeuCardTitle>
        </NeuCardHeader>
        <NeuCardContent>
          <div className="space-y-6">
            <div className="p-4 bg-[var(--neu-bg)] rounded-lg space-y-3">
              <h4 className="font-medium text-[var(--neu-text)]">{t("smtpConfig")}</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-[var(--neu-text-secondary)]">{t("host")}</span>
                  <p className="font-mono">{emailSettings.smtpHost || t("notConfigured")}</p>
                </div>
                <div>
                  <span className="text-[var(--neu-text-secondary)]">{t("port")}</span>
                  <p className="font-mono">{emailSettings.smtpPort}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-[var(--neu-text-secondary)]">{t("sender")}</span>
                  <p className="font-mono">{emailSettings.smtpUser || t("notConfigured")}</p>
                </div>
              </div>
              <p className="text-xs text-[var(--neu-text-secondary)]">{t("smtpNote")}</p>
            </div>

            <div className="flex items-center justify-between p-4 bg-[var(--neu-bg)] rounded-lg">
              <div>
                <h4 className="font-medium text-[var(--neu-text)]">{t("testEmail")}</h4>
                <p className="text-sm text-[var(--neu-text-secondary)]">{t("testEmailDescription")}</p>
              </div>
              <NeuButton
                variant="outline"
                onClick={handleTestEmail}
                disabled={isTestingEmail}
              >
                {isTestingEmail ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t("sending")}
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    {t("sendTest")}
                  </>
                )}
              </NeuButton>
            </div>

            <div className="flex items-center justify-between p-4 bg-[var(--neu-bg)] rounded-lg">
              <div>
                <h4 className="font-medium text-[var(--neu-text)]">{t("autoPayslip")}</h4>
                <p className="text-sm text-[var(--neu-text-secondary)]">{t("autoPayslipDescription")}</p>
              </div>
              <button
                onClick={() =>
                  setEmailSettings({
                    ...emailSettings,
                    autoSendPayslip: !emailSettings.autoSendPayslip,
                  })
                }
                className={`
                  relative w-14 h-7 rounded-full transition-colors duration-200
                  ${emailSettings.autoSendPayslip ? "bg-green-500" : "bg-gray-300"}
                `}
              >
                <span
                  className={`
                    absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform duration-200
                    ${emailSettings.autoSendPayslip ? "translate-x-7" : "translate-x-0"}
                  `}
                />
              </button>
            </div>

            {emailSettings.autoSendPayslip && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <p className="text-sm text-green-700">{t("autoPayslipEnabled")}</p>
                </div>
              </div>
            )}
          </div>
        </NeuCardContent>
      </NeuCard>
    </div>
  );
}
