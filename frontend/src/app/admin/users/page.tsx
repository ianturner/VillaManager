"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faPlus, faSave, faSignOutAlt, faTrash, faEye, faEyeSlash, faChevronLeft } from "@fortawesome/free-solid-svg-icons";
import { ThemeProvider } from "@/components/ThemeProvider";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSelect from "@/components/LanguageSelect";
import AdminSelect from "@/components/AdminSelect";
import {
  AuthError,
  PermissionError,
  clearToken,
  createAdminUser,
  deleteAdminUser,
  getAdminUserProperties,
  getAdminUsers,
  getStoredToken,
  getStoredUser,
  updateAdminUser,
  type UserAdminDto,
  type UserPropertySummary
} from "@/lib/adminApi";
import { resolveLocalizedText } from "@/lib/i18n";
import { useTranslations } from "@/lib/i18n/useLanguage";
import { isSupportedLanguage, supportedLanguages } from "@/lib/i18n/languages";
import { useAdminSessionRefresh } from "@/lib/useAdminSessionRefresh";

type UserDraft = UserAdminDto & {
  password?: string;
  isNew?: boolean;
};

export default function AdminUsersPage() {
  const router = useRouter();
  const { language, setLanguage, t } = useTranslations();
  const searchParams = useSearchParams();
  const token = useMemo(() => getStoredToken(), []);
  useAdminSessionRefresh({
    onExpired: () => {
      clearToken();
      router.push("/admin/login");
    }
  });
  const [currentUser, setCurrentUser] = useState<ReturnType<typeof getStoredUser>>(null);
  const hasAppliedPreferredLanguage = useRef(false);
  useEffect(() => {
    setCurrentUser(getStoredUser());
  }, []);
  useEffect(() => {
    if (hasAppliedPreferredLanguage.current) {
      return;
    }
    if (!currentUser?.preferredLanguage) {
      return;
    }
    if (typeof window !== "undefined") {
      const hasOverride = window.sessionStorage.getItem("languageOverride") === "1";
      if (hasOverride) {
        hasAppliedPreferredLanguage.current = true;
        return;
      }
    }
    if (searchParams?.get("lang")) {
      hasAppliedPreferredLanguage.current = true;
      return;
    }
    if (!isSupportedLanguage(currentUser.preferredLanguage)) {
      return;
    }
    setLanguage(currentUser.preferredLanguage);
    hasAppliedPreferredLanguage.current = true;
  }, [currentUser?.preferredLanguage, searchParams, setLanguage]);
  const isAdmin = useMemo(() => {
    const roles = (currentUser?.roles ?? []).map((role) => role.toLowerCase());
    return roles.includes("admin");
  }, [currentUser]);
  const canManageUsers = useMemo(() => {
    const roles = (currentUser?.roles ?? []).map((role) => role.toLowerCase());
    return roles.some((role) =>
      ["admin", "property-owner", "property_owner", "propertyowner", "owner"].includes(role)
    );
  }, [currentUser]);

  const [users, setUsers] = useState<UserDraft[]>([]);
  const [properties, setProperties] = useState<UserPropertySummary[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingById, setIsSavingById] = useState<Record<string, boolean>>({});
  const [expandedById, setExpandedById] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastFadeOut, setToastFadeOut] = useState(false);
  const toastTimeoutRef = useRef<number | null>(null);
  const roleOptions = useMemo(
    () => [
      { value: "admin", label: t("admin.roles.admin") },
      { value: "property-owner", label: t("admin.roles.property-owner") },
      { value: "property-manager", label: t("admin.roles.property-manager") },
      { value: "agent", label: t("admin.roles.agent") }
    ],
    [t]
  );

  const loadUsers = async () => {
    if (!token) {
      router.push("/admin/login");
      return;
    }
    if (!canManageUsers) {
      setError(t("admin.users.errors.permission"));
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const usersData = await getAdminUsers(token);
      setUsers(usersData.map((user) => ({ ...user, password: "" })));
      setExpandedById((prev) => {
        if (Object.keys(prev).length > 0) {
          return prev;
        }
        const next: Record<string, boolean> = {};
        usersData.forEach((user) => {
          next[user.id] = false;
        });
        return next;
      });
    } catch (err) {
      if (err instanceof AuthError) {
        router.push("/admin/login");
        return;
      }
      if (err instanceof PermissionError) {
        setError(t("admin.users.errors.permission"));
      } else {
        setError(err instanceof Error ? err.message : t("admin.users.errors.load"));
      }
      setIsLoading(false);
      return;
    }

    try {
      const propertiesData = await getAdminUserProperties(token);
      setProperties(propertiesData);
    } catch (err) {
      if (err instanceof AuthError) {
        router.push("/admin/login");
        return;
      }
      if (err instanceof PermissionError) {
        setError(t("admin.users.errors.permission"));
      } else {
        setError(err instanceof Error ? err.message : t("admin.users.errors.loadProperties"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser) {
      return;
    }
    loadUsers();
  }, [currentUser, token]);

  useEffect(() => {
    if (!toastMessage) {
      return;
    }
    setToastFadeOut(false);
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = window.setTimeout(() => {
      setToastFadeOut(true);
      toastTimeoutRef.current = null;
      window.setTimeout(() => {
        setToastMessage(null);
        setToastFadeOut(false);
      }, 500);
    }, 3000);
  }, [toastMessage]);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        window.clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const updateUser = (id: string, updater: (user: UserDraft) => UserDraft) => {
    setUsers((prev) => prev.map((user) => (user.id === id ? updater(user) : user)));
  };

  const handleAddUser = () => {
    const newId = `new-${Date.now()}`;
    setUsers((prev) => [
      ...prev,
      {
        id: newId,
        username: "",
        displayName: "",
        roles: ["property-manager"],
        propertyIds: [],
        disabled: false,
        preferredLanguage: null,
        password: "",
        isNew: true
      }
    ]);
    setExpandedById((prev) => ({ ...prev, [newId]: true }));
  };

  const handleSaveUser = async (user: UserDraft) => {
    if (!token) {
      router.push("/admin/login");
      return;
    }

    if (!user.username.trim() || !user.displayName.trim()) {
      setError(t("admin.users.errors.requiredName"));
      return;
    }

    if (user.isNew && !user.password) {
      setError(t("admin.users.errors.requiredPassword"));
      return;
    }

    setIsSavingById((prev) => ({ ...prev, [user.id]: true }));
    setError("");
    try {
      if (user.isNew) {
        const created = await createAdminUser(token, {
          username: user.username.trim(),
          displayName: user.displayName.trim(),
          roles: user.roles,
          propertyIds: user.propertyIds,
          email: user.email ?? null,
          phone: user.phone ?? null,
          whatsapp: user.whatsapp ?? null,
          viber: user.viber ?? null,
          preferredLanguage: user.preferredLanguage ?? null,
          password: user.password ?? "",
          disabled: user.disabled
        });
        setUsers((prev) =>
          prev.map((item) =>
            item.id === user.id ? { ...created, password: "" } : item
          )
        );
      } else {
        const updated = await updateAdminUser(token, user.id, {
          username: user.username.trim(),
          displayName: user.displayName.trim(),
          roles: user.roles,
          propertyIds: user.propertyIds,
          email: user.email ?? null,
          phone: user.phone ?? null,
          whatsapp: user.whatsapp ?? null,
          viber: user.viber ?? null,
          preferredLanguage: user.preferredLanguage ?? null,
          disabled: user.disabled,
          password: user.password?.trim() ? user.password.trim() : undefined
        });
        setUsers((prev) =>
          prev.map((item) =>
            item.id === user.id ? { ...updated, password: "" } : item
          )
        );
      }
      setToastMessage(t("admin.toast.userSaved"));
    } catch (err) {
      if (err instanceof AuthError) {
        router.push("/admin/login");
        return;
      }
      if (err instanceof PermissionError) {
        setError(t("admin.users.errors.permission"));
      } else {
        setError(err instanceof Error ? err.message : t("admin.users.errors.save"));
      }
    } finally {
      setIsSavingById((prev) => ({ ...prev, [user.id]: false }));
    }
  };

  const handleDeleteUser = async (user: UserDraft) => {
    if (user.roles.map((role) => role.toLowerCase()).includes("admin")) {
      return;
    }
    if (!token) {
      router.push("/admin/login");
      return;
    }
    if (user.isNew) {
      setUsers((prev) => prev.filter((item) => item.id !== user.id));
      return;
    }
    setIsSavingById((prev) => ({ ...prev, [user.id]: true }));
    try {
      await deleteAdminUser(token, user.id);
      setUsers((prev) => prev.filter((item) => item.id !== user.id));
      setToastMessage(t("admin.toast.userDeleted"));
    } catch (err) {
      if (err instanceof AuthError) {
        router.push("/admin/login");
        return;
      }
      if (err instanceof PermissionError) {
        setError(t("admin.users.errors.permission"));
      } else {
        setError(err instanceof Error ? err.message : t("admin.users.errors.delete"));
      }
    } finally {
      setIsSavingById((prev) => ({ ...prev, [user.id]: false }));
    }
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem("languageOverride");
    }
    clearToken();
    router.push("/admin/login");
  };

  return (
    <ThemeProvider>
      <section className="admin-stack">
        {toastMessage ? (
          <div
            className={`admin-toast${toastFadeOut ? " admin-toast--fade-out" : ""}`}
            role="status"
            aria-live="polite"
          >
            {toastMessage}
          </div>
        ) : null}
        <header className="admin-header">
          <div className="admin-header-icon">
              <button type="button" className="admin-secondary" onClick={() => router.push("/admin")}>
                <FontAwesomeIcon icon={faChevronLeft} />
              </button>
          </div>
          <div>
            <h1>{t("admin.userManagement.title")}</h1>
            <p className="muted">{t("admin.userManagement.subtitle")}</p>
          </div>
          <div className="admin-header-actions">
            {canManageUsers ? (
              <button type="button" className="admin-primary" onClick={handleAddUser}>
                <FontAwesomeIcon icon={faPlus} /> {t("admin.addUser")}
              </button>
            ) : null}
            <button type="button" className="admin-danger" onClick={handleLogout}>
              <FontAwesomeIcon icon={faSignOutAlt} /> {t("admin.logout")}
            </button>
            <LanguageSelect />
            <ThemeToggle />
          </div>
        </header>

        {error ? <p className="admin-error">{error}</p> : null}

        {isLoading ? (
          <p className="muted">{t("admin.users.loading")}</p>
        ) : (
          <div className="admin-grid">
            {(() => {
              const currentUserId = currentUser?.id;
              const orderedUsers = currentUserId
                ? [
                    ...users.filter((user) => user.id === currentUserId),
                    ...users.filter((user) => user.id !== currentUserId)
                  ]
                : users;
              return orderedUsers.map((user) => {
              const isAdminUser = user.roles.map((role) => role.toLowerCase()).includes("admin");
              const isSaving = isSavingById[user.id] ?? false;
              const isExpanded = expandedById[user.id] ?? false;
              return (
                <section key={user.id} className="card admin-card">
                  <div className="admin-card-header">
                    <h2>{user.displayName || t("admin.users.newUser")}</h2>
                    <h3>{t(`admin.roles.${user.roles[0]}`)}</h3>
                    <h4>
                      {currentUser?.id === user.id ? (
                        <span className="admin-user-tag">{t("admin.users.you")}</span>
                      ) : null}
                    </h4>
                    <h4>
                      {user.propertyIds
                        .map((id) => properties.find((property) => property.id === id)?.name ?? "")
                        .map((name) => resolveLocalizedText(name, language))
                        .join(", ")}
                    </h4>
                    {user.disabled ? (
                      <span className="admin-status archived">{t("admin.users.disabled")}</span>
                    ) : null}
                    <div className="admin-card-controls">
                      <button
                        type="button"
                        className="admin-secondary admin-card-toggle"
                        onClick={() =>
                          setExpandedById((prev) => ({ ...prev, [user.id]: !isExpanded }))
                        }
                      >
                        {isExpanded ? <FontAwesomeIcon icon={faEyeSlash} /> : <FontAwesomeIcon icon={faEye} />}{" "}
                        {isExpanded ? t("admin.actions.hide") : t("admin.actions.show")}
                      </button>
                    </div>
                  </div>
                  {isExpanded ? (
                    <>
                      <div className="admin-form">
                        <div className="admin-form admin-form-inline admin-user-name-row">
                          <label className="admin-field">
                            <span>{t("admin.users.fields.username")}</span>
                            <input
                              className="admin-input-name-short"
                              value={user.username}
                              onChange={(event) =>
                                updateUser(user.id, (current) => ({
                                  ...current,
                                  username: event.target.value
                                }))
                              }
                              required
                            />
                          </label>
                          <label className="admin-field">
                            <span>{t("admin.users.fields.displayName")}</span>
                            <input
                              className="admin-input-name"
                              value={user.displayName}
                              onChange={(event) =>
                                updateUser(user.id, (current) => ({
                                  ...current,
                                  displayName: event.target.value
                                }))
                              }
                              required
                            />
                          </label>
                        </div>
                        <div className="admin-user-detail-grid">
                          <div className="admin-nested-card">
                            <div className="admin-list">
                              <h4>{t("admin.users.sections.role")}</h4>
                              <div className="admin-form admin-form-inline">
                                {roleOptions.map((role) => (
                                  <label key={role.value} className="admin-field admin-checkbox">
                                    <input
                                      type="radio"
                                      name={`role-${user.id}`}
                                      checked={user.roles[0] === role.value}
                                      disabled={
                                        (!isAdmin && role.value === "admin") ||
                                        (isAdminUser && !user.isNew)
                                      }
                                      onChange={() =>
                                        updateUser(user.id, (current) => ({
                                          ...current,
                                          roles: [role.value]
                                        }))
                                      }
                                    />
                                    <span>{role.label}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          </div>
                          {!isAdminUser ? (
                            <div className="admin-nested-card">
                              <div className="admin-list">
                                <h4>{t("admin.users.sections.propertyAccess")}</h4>
                                <div className="admin-form admin-form-inline">
                                  {properties.map((property) => (
                                    <label key={property.id} className="admin-field admin-checkbox">
                                      <input
                                        type="checkbox"
                                        checked={user.propertyIds.includes(property.id)}
                                        onChange={(event) =>
                                          updateUser(user.id, (current) => ({
                                            ...current,
                                            propertyIds: event.target.checked
                                              ? [...current.propertyIds, property.id]
                                              : current.propertyIds.filter((id) => id !== property.id)
                                          }))
                                        }
                                      />
                                      <span>{resolveLocalizedText(property.name, language)}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ) : null}
                          <div className="admin-nested-card">
                            <div className="admin-list">
                              <h4>{t("admin.users.sections.contact")}</h4>
                              <label className="admin-field">
                                <span>{t("admin.users.fields.email")}</span>
                                <input
                                  value={user.email ?? ""}
                                  onChange={(event) =>
                                    updateUser(user.id, (current) => ({
                                      ...current,
                                      email: event.target.value
                                    }))
                                  }
                                />
                              </label>
                              <label className="admin-field">
                                <span>{t("admin.users.fields.phone")}</span>
                                <input
                                  value={user.phone ?? ""}
                                  onChange={(event) =>
                                    updateUser(user.id, (current) => ({
                                      ...current,
                                      phone: event.target.value
                                    }))
                                  }
                                />
                              </label>
                              <label className="admin-field">
                                <span>{t("admin.preferredLanguage")}</span>
                                <AdminSelect
                                  value={user.preferredLanguage ?? ""}
                                  options={[
                                    { value: "", label: t("common.select") },
                                    ...supportedLanguages.map((language) => ({
                                      value: language.code,
                                      label: `${language.flag} ${language.label}`
                                    }))
                                  ]}
                                  onChange={(value) =>
                                    updateUser(user.id, (current) => ({
                                      ...current,
                                      preferredLanguage: value || null
                                    }))
                                  }
                                />
                              </label>
                              <label className="admin-field">
                                <span>{t("admin.users.fields.whatsapp")}</span>
                                <input
                                  value={user.whatsapp ?? ""}
                                  onChange={(event) =>
                                    updateUser(user.id, (current) => ({
                                      ...current,
                                      whatsapp: event.target.value
                                    }))
                                  }
                                />
                              </label>
                              <label className="admin-field">
                                <span>{t("admin.users.fields.viber")}</span>
                                <input
                                  value={user.viber ?? ""}
                                  onChange={(event) =>
                                    updateUser(user.id, (current) => ({
                                      ...current,
                                      viber: event.target.value
                                    }))
                                  }
                                />
                              </label>
                            </div>
                          </div>
                          <div className="admin-nested-card">
                            <div className="admin-list">
                              <h4>{t("admin.users.sections.other")}</h4>
                              {!isAdminUser ? (
                                <label className="admin-field admin-checkbox">
                                  <span>{t("admin.users.fields.accountDisabled")}</span>
                                  <input
                                    type="checkbox"
                                    checked={user.disabled}
                                    onChange={(event) =>
                                      updateUser(user.id, (current) => ({
                                        ...current,
                                        disabled: event.target.checked
                                      }))
                                    }
                                  />
                                </label>
                              ) : null}
                              <label className="admin-field">
                                <span>
                                  {user.isNew
                                    ? t("admin.users.fields.password")
                                    : t("admin.users.fields.resetPassword")}
                                </span>
                                <input
                                  className="admin-input-name-short"
                                  type="password"
                                  value={user.password ?? ""}
                                  placeholder={
                                    user.isNew
                                      ? t("admin.users.placeholders.newPassword")
                                      : t("admin.users.placeholders.resetPassword")
                                  }
                                  onChange={(event) =>
                                    updateUser(user.id, (current) => ({
                                      ...current,
                                      password: event.target.value
                                    }))
                                  }
                                />
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="admin-actions">
                        <button
                          type="button"
                          className="admin-primary"
                          disabled={isSaving}
                          onClick={() => handleSaveUser(user)}
                        >
                          <FontAwesomeIcon icon={faSave} /> {t("admin.users.actions.save")}
                        </button>
                        {isAdminUser ? (
                          <em className="muted">{t("admin.users.cannotDeleteAdmin")}</em>
                        ) : (
                          <button
                            type="button"
                            className="admin-danger"
                            disabled={isSaving}
                            onClick={() => handleDeleteUser(user)}
                          >
                            <FontAwesomeIcon icon={faTrash} /> {t("admin.users.actions.delete")}
                          </button>
                        )}
                      </div>
                    </>
                  ) : null}
                </section>
              );
              });
            })()}
          </div>
        )}
      </section>
    </ThemeProvider>
  );
}
