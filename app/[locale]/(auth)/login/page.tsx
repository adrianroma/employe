"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { AuthUI } from "@/components/ui/auth-fuse";
import { LanguageSwitcher } from "@/components/ui/language-switcher";

interface LoginResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: {
    _id: string;
    name: string;
    email: string;
    role: "admin" | "employee";
    department: string;
    createdAt: string;
  };
}

export default function LoginPage() {
  const locale = useLocale();
  const tLogin = useTranslations("auth.login");
  const tSignIn = useTranslations("auth.signIn");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async (data: { email: string; password: string }) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result: LoginResponse = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error || tSignIn("loginFailed"));
        setIsLoading(false);
        return;
      }

      const userRole = result.data?.role;
      window.location.href = `/${locale}/${userRole === "admin" ? "admin" : "employee"}`;
    } catch (err) {
      setError(tSignIn("unexpectedError"));
      console.error("Login error:", err);
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      <div className="fixed top-4 right-4 z-50">
        <LanguageSwitcher />
      </div>

      <AuthUI
        onSignInSubmit={handleSignIn}
        isLoading={isLoading}
        error={error}
        signInContent={{
          quote: {
            text: tLogin("quote"),
            author: tLogin("quoteAuthor"),
          },
        }}
      />
    </div>
  );
}
