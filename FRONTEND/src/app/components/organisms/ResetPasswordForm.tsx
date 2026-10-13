import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { ArrowRight, AlertCircle, CheckCircle, KeyRound } from "lucide-react";
import { FormField } from "../molecules/FormField";
import { PasswordInput } from "../molecules/PasswordInput";
import { PasswordStrengthBar } from "../molecules/PasswordStrengthBar";
import { resetPassword } from "../../lib/api-client";

/* ── Validation helpers ───────────────────────────────── */
const validate = {
  password: (v: string) => {
    if (!v) return "Password is required.";
    if (v.length < 8) return "Password must be at least 8 characters.";
    return "";
  },
};

/* ── Auth error banner ────────────────────────────────── */
function AuthErrorBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex items-start gap-2.5 px-4 py-3 rounded-md border"
      style={{ backgroundColor: "#FFEBEE", borderColor: "#D32F2F" }}
    >
      <AlertCircle
        size={16}
        className="flex-shrink-0 mt-0.5"
        aria-hidden="true"
        style={{ color: "#D32F2F" }}
      />
      <p style={{ color: "#B71C1C", fontSize: "14px", lineHeight: "20px" }}>{message}</p>
    </div>
  );
}

/* ── Success banner ───────────────────────────────────── */
function SuccessBanner() {
  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center" role="status" aria-live="polite">
      <span
        className="inline-flex items-center justify-center w-16 h-16 rounded-full"
        style={{ backgroundColor: "rgba(56,142,60,0.1)" }}
      >
        <CheckCircle size={32} style={{ color: "#388E3C" }} />
      </span>
      <div className="flex flex-col gap-2">
        <h2 style={{ color: "#212121" }}>Password Reset</h2>
        <p style={{ color: "#9E9E9E", fontSize: "14px", lineHeight: "20px" }}>
          Your password has been updated. Redirecting you to sign in…
        </p>
      </div>
    </div>
  );
}

/* ── Backend error_code → user-facing message ─────────── */
function messageForError(
  body: { error?: string; error_code?: string; message?: string; violations?: string[] }
): string {
  switch (body.error_code) {
    case "TOKEN_NOT_FOUND":
      return "This password reset link is invalid. Please request a new one.";
    case "TOKEN_EXPIRED":
      return "This password reset link has expired. Please request a new one.";
    case "PASSWORD_POLICY_VIOLATION":
      return (body.violations ?? []).join(" ");
    default:
      return body.error || body.message || "Something went wrong. Please try again.";
  }
}

/* ── ResetPasswordForm ─────────────────────────────────── */
export function ResetPasswordForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const recoveryToken = searchParams.get("token") ?? "";

  const [fields, setFields] = useState({ password: "", passwordConfirm: "" });
  const [errors, setErrors] = useState({ password: "", passwordConfirm: "" });
  const [touched, setTouched] = useState({ password: false, passwordConfirm: false });
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [succeeded, setSucceeded] = useState(false);

  const clientValidate: Record<keyof typeof fields, (v: string) => string> = {
    ...validate,
    passwordConfirm: (v: string) => {
      if (!v) return "Please confirm your password.";
      if (v !== fields.password) return "Passwords do not match.";
      return "";
    },
  };

  const setField = (key: keyof typeof fields) => (v: string) => {
    setFields((prev) => ({ ...prev, [key]: v }));
    if (formError) setFormError("");
    if (touched[key]) setErrors((prev) => ({ ...prev, [key]: clientValidate[key](v) }));
  };

  const handleBlur = (key: keyof typeof fields) => () => {
    setTouched((prev) => ({ ...prev, [key]: true }));
    setErrors((prev) => ({ ...prev, [key]: clientValidate[key](fields[key]) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nextErrors = {
      password: validate.password(fields.password),
      passwordConfirm: clientValidate.passwordConfirm(fields.passwordConfirm),
    };
    setErrors(nextErrors);
    setTouched({ password: true, passwordConfirm: true });
    setFormError("");

    if (Object.values(nextErrors).some(Boolean)) return;

    setLoading(true);
    try {
      const result = await resetPassword({
        recovery_token: recoveryToken,
        new_password: fields.password,
      });

      if (result.ok) {
        setSucceeded(true);
        setTimeout(() => navigate("/login"), 2000);
        return;
      }

      setFormError(messageForError(result.body));
    } catch {
      setFormError("Unable to reach the server. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const passwordError = touched.password ? errors.password : "";
  const passwordConfirmError = touched.passwordConfirm ? errors.passwordConfirm : "";

  return (
    <div
      className="w-full mx-auto rounded-lg border border-[#E0E0E0] bg-white"
      style={{ maxWidth: "480px", padding: "40px", boxShadow: "0px 2px 8px rgba(0,0,0,0.08)" }}
    >
      {succeeded ? (
        <SuccessBanner />
      ) : !recoveryToken ? (
        <>
          <AuthErrorBanner message="This password reset link is invalid or incomplete. Please request a new one from the login page." />
          <p className="text-center mt-6" style={{ color: "#9E9E9E", fontSize: "14px", lineHeight: "20px" }}>
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="font-medium hover:underline underline-offset-2 transition-colors"
              style={{ color: "#1A73E8", fontSize: "14px" }}
            >
              Back to Sign In
            </button>
          </p>
        </>
      ) : (
        <>
          <div className="flex flex-col items-center gap-1 text-center mb-8">
            <span
              className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3"
              style={{ backgroundColor: "rgba(26,115,232,0.08)" }}
              aria-hidden="true"
            >
              <KeyRound size={26} style={{ color: "#1A73E8" }} />
            </span>
            <h1 style={{ color: "#212121" }}>Set a New Password</h1>
            <p style={{ color: "#9E9E9E", fontSize: "14px", lineHeight: "20px" }}>
              Enter and confirm your new password below.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            {formError && <AuthErrorBanner message={formError} />}

            <div className="flex flex-col gap-0">
              <FormField
                id="reset-password"
                label="New Password"
                value={fields.password}
                onChange={setField("password")}
                onBlur={handleBlur("password")}
                error={passwordError}
              >
                <PasswordInput
                  id="reset-password"
                  autoComplete="new-password"
                  placeholder="Min. 8 characters"
                  value={fields.password}
                  onChange={setField("password")}
                  onBlur={handleBlur("password")}
                  hasError={Boolean(passwordError)}
                />
              </FormField>

              <div id="reset-password-strength">
                <PasswordStrengthBar password={fields.password} />
              </div>
            </div>

            <FormField
              id="reset-password-confirm"
              label="Confirm New Password"
              value={fields.passwordConfirm}
              onChange={setField("passwordConfirm")}
              onBlur={handleBlur("passwordConfirm")}
              error={passwordConfirmError}
            >
              <PasswordInput
                id="reset-password-confirm"
                autoComplete="new-password"
                placeholder="Min. 8 characters"
                value={fields.passwordConfirm}
                onChange={setField("passwordConfirm")}
                onBlur={handleBlur("passwordConfirm")}
                hasError={Boolean(passwordConfirmError)}
              />
            </FormField>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 flex items-center justify-center gap-2 rounded-md text-sm font-semibold text-white transition-colors duration-150 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[rgba(26,115,232,0.4)] group mt-1 disabled:cursor-not-allowed"
              style={{
                backgroundColor: loading ? "#9E9E9E" : "#1A73E8",
                boxShadow: loading ? "none" : "0px 2px 4px rgba(0,0,0,0.1)",
                letterSpacing: "0.5px",
              }}
              onMouseEnter={(e) => {
                if (!loading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#1557B0";
              }}
              onMouseLeave={(e) => {
                if (!loading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#1A73E8";
              }}
              aria-label={loading ? "Updating password…" : "Reset Password"}
            >
              {loading ? (
                <>
                  <svg className="animate-spin" width={16} height={16} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                  </svg>
                  Updating password…
                </>
              ) : (
                <>
                  Reset Password
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </>
              )}
            </button>

            <p className="text-center" style={{ color: "#9E9E9E", fontSize: "14px", lineHeight: "20px" }}>
              Remembered your password?{" "}
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="font-medium hover:underline underline-offset-2 transition-colors"
                style={{ color: "#1A73E8", fontSize: "14px" }}
              >
                Sign In
              </button>
            </p>
          </form>
        </>
      )}
    </div>
  );
}
