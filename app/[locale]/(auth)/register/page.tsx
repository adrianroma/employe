"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AuthUI } from "@/components/ui/auth-fuse";

interface RegisterResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: {
    _id: string;
    name: string;
    email: string;
    role: string;
    department: string;
    createdAt: string;
  };
}

export default function RegisterPage() {
  const locale = useLocale();
  const tRegister = useTranslations("auth.register");
  const tSignUp = useTranslations("auth.signUp");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async (data: { name: string; email: string; password: string; department?: string }) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result: RegisterResponse = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error || tSignUp("registrationFailed"));
        setIsLoading(false);
        return;
      }

      window.location.href = `/${locale}/login`;
    } catch (err) {
      setError(tSignUp("unexpectedError"));
      console.error("Registration error:", err);
      setIsLoading(false);
    }
  };

  return (
    <AuthUI
      onSignUpSubmit={handleSignUp}
      isLoading={isLoading}
      error={error}
      signUpContent={{
        quote: {
          text: tRegister("quote"),
          author: tRegister("quoteAuthor"),
        },
      }}
    />
  );
}
