/*
 * US-004 View and Edit User Profile Details — /profile (protected route).
 *
 * Loads GET /api/user/profile, shows read-only account metadata alongside an
 * editable form (display name, email, phone), and submits PUT
 * /api/user/profile with the optimistic-lock `version` and the session-bound
 * CSRF token. On success the form and summary are refreshed from the server
 * response. Field errors are linked via aria-describedby (FormField) and the
 * overall outcome is announced through a polite live region.
 */
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { AuthHeader } from "../organisms/AuthHeader";
import { Footer } from "../organisms/Footer";
import { FormField } from "../molecules/FormField";
import { getProfile, updateProfile } from "../../lib/api-client";
import { clearSession, getSessionToken } from "../../lib/session";
import { validateProfileForm, type ProfileFormValues } from "../../lib/profile-validation";
import type { EditableProfileField, ProfileDetailsResponse } from "../../types/profile.types";

type FieldErrors = Partial<Record<EditableProfileField, string>>;
type Status = { kind: "success" | "error"; message: string } | null;

function toFormValues(profile: ProfileDetailsResponse): ProfileFormValues {
  return {
    displayName: profile.displayName ?? "",
    email: profile.email,
    phoneNumber: profile.phoneNumber ?? "",
  };
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

const FIELD_ORDER: EditableProfileField[] = ["displayName", "email", "phoneNumber"];

export function ProfileTemplate() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileDetailsResponse | null>(null);
  const [values, setValues] = useState<ProfileFormValues>({ displayName: "", email: "", phoneNumber: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<Status>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const applyProfile = useCallback((next: ProfileDetailsResponse) => {
    setProfile(next);
    setValues(toFormValues(next));
  }, []);

  const handleUnauthorized = useCallback(() => {
    clearSession();
    navigate("/login", { replace: true });
  }, [navigate]);

  const load = useCallback(async () => {
    const token = getSessionToken();
    if (!token) {
      handleUnauthorized();
      return;
    }
    setLoading(true);
    setLoadError(null);
    const result = await getProfile(token);
    if (result.ok) {
      applyProfile(result.data);
    } else if (result.status === 401 || result.status === 403) {
      handleUnauthorized();
      return;
    } else {
      setLoadError(result.body.message ?? "We couldn't load your profile. Please try again.");
    }
    setLoading(false);
  }, [applyProfile, handleUnauthorized]);

  useEffect(() => {
    void load();
  }, [load]);

  const focusFirstError = (fieldErrors: FieldErrors) => {
    const first = FIELD_ORDER.find((field) => fieldErrors[field]);
    if (first) document.getElementById(`profile-${first}`)?.focus();
  };

  const setField = (field: EditableProfileField) => (value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profile || saving) return;
    setStatus(null);

    const clientErrors = validateProfileForm(values);
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length > 0) {
      setStatus({ kind: "error", message: "Please correct the highlighted fields." });
      focusFirstError(clientErrors);
      return;
    }

    const token = getSessionToken();
    if (!token) {
      handleUnauthorized();
      return;
    }

    setSaving(true);
    const result = await updateProfile(token, profile.csrfToken, {
      displayName: values.displayName.trim() === "" ? null : values.displayName.trim(),
      email: values.email.trim(),
      phoneNumber: values.phoneNumber.trim() === "" ? null : values.phoneNumber.trim(),
      version: profile.version,
    });
    setSaving(false);

    if (result.ok) {
      applyProfile(result.data);
      setErrors({});
      setStatus({ kind: "success", message: "Your profile has been updated." });
      return;
    }

    if (result.status === 401) {
      handleUnauthorized();
      return;
    }

    const body = result.body;
    if (body.fieldErrors) {
      const serverErrors: FieldErrors = {};
      for (const field of FIELD_ORDER) {
        if (body.fieldErrors[field]) serverErrors[field] = body.fieldErrors[field];
      }
      setErrors(serverErrors);
      focusFirstError(serverErrors);
    }

    if (body.error_code === "PROFILE_VERSION_CONFLICT") {
      setStatus({
        kind: "error",
        message:
          "Your profile was changed elsewhere (for example in another tab). Reload to see the latest details, then re-apply your changes.",
      });
    } else if (body.error_code === "RATE_LIMITED") {
      setStatus({ kind: "error", message: "Too many requests. Please wait a moment and try again." });
    } else {
      setStatus({ kind: "error", message: body.message ?? "We couldn't save your profile. Please try again." });
    }
  };

  const dirty =
    profile !== null &&
    (values.displayName !== (profile.displayName ?? "") ||
      values.email !== profile.email ||
      values.phoneNumber !== (profile.phoneNumber ?? ""));

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ fontFamily: "'Inter','SF Pro Text','Roboto',sans-serif", backgroundColor: "#F5F5F5" }}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 z-[100] px-4 py-2 rounded-md bg-[#1A73E8] text-white text-sm font-medium"
      >
        Skip to main content
      </a>

      <AuthHeader userName={profile?.displayName || profile?.username || ""} userEmail={profile?.email ?? ""} />

      <main id="main-content" className="flex-1 flex flex-col" style={{ paddingTop: "64px" }}>
        <div className="flex-1 flex flex-col gap-6 px-6 py-6 w-full max-w-[800px] mx-auto">
          <h1 style={{ color: "#212121" }}>Profile</h1>

          {/* Polite live region: loading / save outcome announcements */}
          <div aria-live="polite" role="status" className="sr-only">
            {loading ? "Loading your profile…" : status?.message ?? ""}
          </div>

          {loading && (
            <p className="flex items-center gap-2 text-sm" style={{ color: "#616161" }}>
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              Loading your profile…
            </p>
          )}

          {!loading && loadError && (
            <div role="alert" className="flex flex-col gap-3 rounded-lg border border-[#D32F2F] bg-white p-4">
              <p className="text-sm" style={{ color: "#B71C1C" }}>{loadError}</p>
              <button
                type="button"
                onClick={() => void load()}
                className="self-start px-4 py-2 rounded-md bg-[#1A73E8] text-white text-sm font-semibold min-h-[44px] focus:outline-none focus:ring-[3px] focus:ring-[rgba(26,115,232,0.4)]"
              >
                Try again
              </button>
            </div>
          )}

          {!loading && profile && (
            <>
              <section aria-labelledby="account-details-heading" className="rounded-lg border border-[#E0E0E0] bg-white p-6">
                <h2 id="account-details-heading" className="text-base font-semibold mb-4" style={{ color: "#212121" }}>
                  Account details
                </h2>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  {[
                    ["Username", profile.username],
                    ["Account status", profile.status],
                    ["Member since", formatDate(profile.registrationTimestamp)],
                    ["Last login", formatDate(profile.lastLoginAt)],
                    ["Profile last updated", formatDate(profile.profileUpdatedAt)],
                  ].map(([term, detail]) => (
                    <div key={term} className="flex flex-col">
                      <dt style={{ color: "#616161" }}>{term}</dt>
                      <dd className="font-medium" style={{ color: "#212121" }}>{detail}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-4 text-xs" style={{ color: "#616161" }}>
                  These details are managed by the system and can't be edited here.
                </p>
              </section>

              <section aria-labelledby="edit-profile-heading" className="rounded-lg border border-[#E0E0E0] bg-white p-6">
                <h2 id="edit-profile-heading" className="text-base font-semibold mb-4" style={{ color: "#212121" }}>
                  Edit profile
                </h2>

                {status && (
                  <div
                    className="mb-4 flex items-start gap-2 rounded-md p-3 text-sm"
                    style={{
                      backgroundColor: status.kind === "success" ? "#E8F5E9" : "#FFEBEE",
                      color: status.kind === "success" ? "#1B5E20" : "#B71C1C",
                    }}
                    data-testid="profile-status"
                  >
                    {status.kind === "success" ? (
                      <CheckCircle2 size={16} aria-hidden="true" />
                    ) : (
                      <AlertCircle size={16} aria-hidden="true" />
                    )}
                    <span>{status.message}</span>
                  </div>
                )}

                <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4" aria-labelledby="edit-profile-heading">
                  <FormField
                    id="profile-displayName"
                    label="Display name"
                    value={values.displayName}
                    onChange={setField("displayName")}
                    error={errors.displayName}
                    autoComplete="name"
                    required={false}
                    hint="Optional. Up to 100 characters."
                  />
                  <FormField
                    id="profile-email"
                    label="Email"
                    type="email"
                    value={values.email}
                    onChange={setField("email")}
                    error={errors.email}
                    autoComplete="email"
                    hint="Used to sign in and for account notifications."
                  />
                  <FormField
                    id="profile-phoneNumber"
                    label="Phone number"
                    type="tel"
                    value={values.phoneNumber}
                    onChange={setField("phoneNumber")}
                    error={errors.phoneNumber}
                    autoComplete="tel"
                    required={false}
                    hint="Optional. 7–15 digits, optional leading +."
                  />

                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={saving}
                      aria-disabled={saving}
                      className="inline-flex items-center gap-2 px-5 py-2 rounded-md bg-[#1A73E8] hover:bg-[#1557B0] text-white text-sm font-semibold min-h-[44px] disabled:opacity-70 focus:outline-none focus:ring-[3px] focus:ring-[rgba(26,115,232,0.4)]"
                    >
                      {saving && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
                      {saving ? "Saving…" : "Save changes"}
                    </button>
                    <button
                      type="button"
                      disabled={!dirty || saving}
                      onClick={() => {
                        setValues(toFormValues(profile));
                        setErrors({});
                        setStatus(null);
                      }}
                      className="px-5 py-2 rounded-md border border-[#1A73E8] text-[#1A73E8] text-sm font-semibold min-h-[44px] disabled:opacity-50 focus:outline-none focus:ring-[3px] focus:ring-[rgba(26,115,232,0.4)]"
                    >
                      Discard changes
                    </button>
                    {status?.kind === "error" && status.message.startsWith("Your profile was changed elsewhere") && (
                      <button
                        type="button"
                        onClick={() => {
                          setStatus(null);
                          void load();
                        }}
                        className="px-5 py-2 rounded-md border border-[#616161] text-[#212121] text-sm font-semibold min-h-[44px] focus:outline-none focus:ring-[3px] focus:ring-[rgba(26,115,232,0.4)]"
                      >
                        Reload latest
                      </button>
                    )}
                  </div>
                </form>
              </section>
            </>
          )}
        </div>
        <Footer />
      </main>
    </div>
  );
}
