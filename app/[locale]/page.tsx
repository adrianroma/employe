"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import NeuralBackground from "@/components/ui/flow-field-background";
import ProjectRadarSection from "@/components/home/project-radar-section";
import ParticleIntroSection from "@/components/home/particle-intro-section";
import { FlickeringFooter } from "@/components/ui/flickering-footer";
import { BentoGrid, useAttendEaseBentoItems, useStatsBentoItems } from "@/components/ui/bento-grid";
import { Home as HomeIcon, BarChart3, LayoutGrid, User } from "lucide-react";
import { NavBar } from "@/components/ui/tube-light-navbar";
import { ScrollToTop } from "@/components/ui/scroll-to-top";
import { LanguageSwitcher } from "@/components/ui/language-switcher";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const t = useTranslations("home");
  const attendEaseBentoItems = useAttendEaseBentoItems();
  const statsBentoItems = useStatsBentoItems();

  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = [
    { name: t("nav.home"), url: "#", icon: HomeIcon },
    { name: t("nav.stats"), url: "#stats", icon: BarChart3 },
    { name: t("nav.features"), url: "#features", icon: LayoutGrid },
    { name: t("nav.portal"), url: "/login", icon: User },
  ];

  return (
    <div id="top" className="relative flex flex-col min-h-screen">
      {/* Navbar */}
      <NavBar items={navItems} />

      {/* Language switcher — top-right, above navbar */}
      <div className="fixed top-4 right-4 z-[60]">
        <LanguageSwitcher />
      </div>

      {/* Neural Background - Fixed behind all content */}
      <div className="fixed inset-0 z-0">
        <NeuralBackground
          color="#818cf8"
          trailOpacity={0.1}
          speed={0.8}
          particleCount={600}
        />
      </div>

      {/* Main Content */}
      <main className="relative z-10 flex flex-col flex-1">
        {/* Particle Text Intro Section (Hero) */}
        <ParticleIntroSection />

        {/* Stats Section - Bento Grid */}
        <section id="stats" className="px-4 py-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--neu-text)] mb-2">
              {t("stats.title")}
            </h2>
            <p className="text-[var(--neu-text-secondary)]">
              {t("stats.description")}
            </p>
          </div>
          <BentoGrid items={statsBentoItems} />
        </section>

        {/* Main Features - Bento Grid */}
        <section id="features" className="px-4 py-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--neu-text)] mb-2">
              {t("features.title")}
            </h2>
            <p className="text-[var(--neu-text-secondary)]">
              {t("features.description")}
            </p>
          </div>
          <BentoGrid items={attendEaseBentoItems} />
        </section>

        {/* Project Details Radar Section */}
        <ProjectRadarSection />

        {/* Footer */}
        <FlickeringFooter />
      </main>

      {/* Scroll to Top Button */}
      <ScrollToTop />
    </div>
  );
}
