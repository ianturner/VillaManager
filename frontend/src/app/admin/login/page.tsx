"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserLock } from "@fortawesome/free-solid-svg-icons";
import { ThemeProvider } from "@/components/ThemeProvider";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSelect from "@/components/LanguageSelect";
import { login, storeSession } from "@/lib/adminApi";
import { useTranslations } from "@/lib/i18n/useLanguage";

export default function AdminLoginPage() {
  const router = useRouter();
  const { t } = useTranslations();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem("languageOverride");
    }
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await login(username.trim(), password);
      storeSession(response);
      router.push("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ThemeProvider>
      <section className="admin-stack">
        <header className="admin-header">
        <div className="admin-header-icon"><FontAwesomeIcon icon={faUserLock} /></div>
          <div>
            <h1>{t("admin.property.title")}</h1>
            <p className="muted">{t("admin.login.subtitle")}</p>
          </div>
          <div className="admin-header-actions">
            <LanguageSelect />
            <ThemeToggle />
          </div>
        </header>
        <section className="card admin-card login-card">
          <form className="admin-form" onSubmit={handleSubmit}>
            <h2>{t("admin.login.title")}</h2>
            <h6>{t("admin.login.subtitle")}</h6>
            <label className="admin-field">
              <span>Username</span>
              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                required
              />
            </label>
            <label className="admin-field">
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </label>
            {error ? <p className="admin-error">{error}</p> : null}
            <button type="submit" className="admin-primary" disabled={isSubmitting}>
              {isSubmitting ? t("common.loading") : t("admin.login.submit")}
            </button>
          </form>
        </section>
      </section>
    </ThemeProvider>
  );
}
