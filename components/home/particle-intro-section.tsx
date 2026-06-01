"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

const ParticleTextEffect = dynamic(
  () => import("@/components/ui/particle-text-effect").then((m) => ({ default: m.ParticleTextEffect })),
  { ssr: false }
);

// Feature names stay in English — they are animated as canvas text (technical brand terms)
const PROJECT_WORDS = [
  "Gruas Bermejo",
  "GPS Check-In",
  "Payroll Engine",
  "Manage Leaves",
  "Role Access",
  "HR Platform",
  "Track Hours",
  "Admin Panel",
];

export default function ParticleIntroSection() {
  const t = useTranslations("home.intro");

  const WORD_DESCRIPTIONS: Record<string, string> = {
    "Gruas Bermejo":     t("words.gruasBermejo"),
    "GPS Check-In":   t("words.gpsCheckIn"),
    "Payroll Engine": t("words.payrollEngine"),
    "Manage Leaves":  t("words.manageLeaves"),
    "Role Access":    t("words.roleAccess"),
    "HR Platform":    t("words.hrPlatform"),
    "Track Hours":    t("words.trackHours"),
    "Admin Panel":    t("words.adminPanel"),
  };

  return (
    <section className="relative w-full px-4 py-20 md:py-32">
      {/* ── Headings ── */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.65 }}
        className="mb-12 text-center"
      >
        <span className="mb-4 inline-block rounded-full border border-[var(--neu-accent)]/30 bg-[var(--neu-accent)]/10 px-5 py-1.5 text-xs font-semibold uppercase tracking-widest text-[var(--neu-accent)]">
          {t("badge")}
        </span>
        <h1 className="text-4xl font-extrabold text-[var(--neu-text)] md:text-6xl lg:text-7xl">
          {t("heading")}{" "}
          <span className="bg-gradient-to-r from-[var(--neu-accent)] to-purple-400 bg-clip-text text-transparent">
            Gruas Bermejo
          </span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-[var(--neu-text-secondary)] md:text-xl">
          {t("description")}
        </p>
      </motion.div>

      {/* ── Canvas wrapper ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, delay: 0.2 }}
        className="mx-auto w-full max-w-6xl rounded-[2.5rem] border border-[var(--neu-accent)]/10 p-2 shadow-[0_0_80px_-20px_rgba(129,140,248,0.3)] mb-12"
        style={{
          background:
            "linear-gradient(135deg,rgba(129,140,248,0.12),rgba(99,102,241,0.05))",
        }}
      >
        <ParticleTextEffect
          words={PROJECT_WORDS}
          canvasWidth={1200}
          canvasHeight={450}
          intervalMs={3000}
        />
      </motion.div>

      {/* ── Feature pills ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mx-auto mt-8 flex max-w-3xl flex-wrap justify-center gap-2"
      >
        {PROJECT_WORDS.map((word) => (
          <span
            key={word}
            title={WORD_DESCRIPTIONS[word]}
            className="cursor-default rounded-full border border-[var(--neu-accent)]/20 px-3 py-1 text-xs font-medium text-[var(--neu-text-secondary)] transition-colors hover:border-[var(--neu-accent)]/50 hover:text-[var(--neu-accent)]"
            style={{ background: "rgba(129,140,248,0.06)" }}
          >
            {word}
          </span>
        ))}
      </motion.div>
    </section>
  );
}
