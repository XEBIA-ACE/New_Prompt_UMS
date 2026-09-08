import { useState } from "react";
import { useNavigate } from "react-router";
import { Eye, EyeOff, ArrowRight, CheckCircle, AlertCircle } from "lucide-react";
import { FormField } from "../molecules/FormField";
import { PasswordStrengthBar, getStrength } from "../molecules/PasswordStrengthBar";
import { registerUser } from "../../lib/api-client";

/* ── Validation helpers ───────────────────────────────── */

/**
 * E.164-derived phone pattern: "+CountryCode-Number".
 * Starts with "+", followed by 1-3 digit country code, a dash, then 1-14 digits.
 * Implements FR-005 (P3).
 */
const PHONE_PATTERN = /^\+[1-9]\d{1,14}$/;

const validate = {
  username: (v: string) => {
    if (!v.trim()) return "Username is required.";
    if (!/^[a-zA-Z0-9]+$/.test(v)) return "Username must be alphanumeric.";
    if (v.length > 20) return "Username must be 20 characters or fewer.";
    return "";
  },
  email: (v: string) => {
    if (!v.trim()) return "Email address is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Enter a valid email address.";
    return "";
  },
  password: (v: string) => {
    if (!v) return "Password is required.";
    if (v.length < 8) return "Password must be at least 8 characters.";
    return "";
  },
  passwordConfirm: (v: string, password: string) => {
    if (!v) return "Please confirm your password.";
    if (v !== password) return "Passwords do not match.";
    return "";
  },
  phone: (v: string) => {
    if (!v.trim()) return "Phone number is required.";
    if (!PHONE_PATTERN.test(v))
      return "Phone must be in +CountryCode-Number format (e.g. +1-5551234567).";
    return "";
  },
};

/* ── Server field name → local field key ──────────────── */
const SERVER_FIELD_MAP: Record<string, "username" | "email" | "password" | "passwordConfirm" | "phone"> = {
  username: "username",
  emailAddress: "email",
  password: "password",
  passwordConfirmation: "passwordConfirm",
  phone: "phone",
};

/* ── Password input with show/hide toggle ─────────────── */
function PasswordInput({
  id,
  value,
  onChange,
  onBlur,
  hasError,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  hasError: boolean;
}) {
  const [show, setShow] = useState(false);

  const inputClass = [
    "w-full h-12 px-4 pr-12 rounded-md border text-sm text-[#212121] placeholder:text-[#9E9E9E] bg-white",
    "transition-all duration-150 outline-none",
    hasError
      ? "border-[#D32F2F] focus:border-[#D32F2F] focus:ring-[3px] focus:ring-[rgba(211,47,47,0.2)]"
      : "border-[#E0E0E0] focus:border-[#1A73E8] focus:ring-[3px] focus:ring-[rgba(26,115,232,0.2)]",
  ].join(" ");

  return (
    <div className="relative">
      <input
        id={id}
        type={show ? "text" : "password"}
        autoComplete="new-password"
        required
        placeholder="Min. 8 characters"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        aria-invalid={hasError}
        aria-describedby={`${id}-error ${id}-strength`}
        className={inputClass}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-[#9E9E9E] hover:text-[#212121] transition-colors"
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

/* ── Auth error banner ────────────────────────────────── */
function AuthErrorBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex items-start gap-2.5 px-4 py-3 rounded-md border"
      style={{
        backgroundColor: "#FFEBEE",
        borderColor: "#D32F2F",
      }}
    >
      <AlertCircle
        size={16}
        className="flex-shrink-0 mt-0.5"
        aria-hidden="true"
        style={{ color: "#D32F2F" }}
      />
      <p style={{ color: "#B71C1C", fontSize: "14px", lineHeight: "20px" }}>
        {message}
      </p>
    </div>
  );
}

/* ── Success banner ───────────────────────────────────── */
function SuccessBanner({ email }: { email: string }) {
  return (
    <div
      className="flex flex-col items-center gap-4 py-8 text-center"
      role="status"
      aria-live="polite"
    >
      <span
        className="inline-flex items-center justify-center w-16 h-16 rounded-full"
        style={{ backgroundColor: "rgba(56,142,60,0.1)" }}
      >
        <CheckCircle size={32} style={{ color: "#388E3C" }} />
      </span>
      <div className="flex flex-col gap-2">
        <h2 style={{ color: "#212121" }}>Account Created!</h2>
        <p style={{ color: "#9E9E9E", fontSize: "14px", lineHeight: "20px" }}>
          We've sent a verification code to{" "}
          <strong style={{ color: "#212121" }}>{email}</strong>.
          <br />
          Please check your inbox.
        </p>
      </div>
    </div>
  );
}

/* ── RegistrationForm ─────────────────────────────────── */
export function RegistrationForm() {
  const navigate = useNavigate();

  const [fields, setFields] = useState({
    username: "",
    email: "",
    password: "",
    passwordConfirm: "",
    phone: "",
  });
  const [errors, setErrors] = useState({
    username: "",
    email: "",
    password: "",
    passwordConfirm: "",
    phone: "",
  });
  const [touched, setTouched] = useState({
    username: false,
    email: false,
    password: false,
    passwordConfirm: false,
    phone: false,
  });
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const setField = (key: keyof typeof fields) => (v: string) => {
    setFields((prev) => ({ ...prev, [key]: v }));
    if (formError) setFormError("");
    if (touched[key]) {
      setErrors((prev) => ({
        ...prev,
        [key]:
          key === "passwordConfirm"
            ? validate.passwordConfirm(v, fields.password)
            : (validate as Record<string, (v: string) => string>)[key](v),
      }));
    }
  };

  const handleBlur = (key: keyof typeof fields) => () => {
    setTouched((prev) => ({ ...prev, [key]: true }));
    setErrors((prev) => ({
      ...prev,
      [key]:
        key === "passwordConfirm"
          ? validate.passwordConfirm(fields.passwordConfirm, fields.password)
          : (validate as Record<string, (v: string) => string>)[key](fields[key]),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    /* validate all fields */
    const nextErrors = {
      username: validate.username(fields.username),
      email: validate.email(fields.email),
      password: validate.password(fields.password),
      passwordConfirm: validate.passwordConfirm(fields.passwordConfirm, fields.password),
      phone: validate.phone(fields.phone),
    };
    setErrors(nextErrors);
    setTouched({
      username: true,
      email: true,
      password: true,
      passwordConfirm: true,
      phone: true,
    });
    setFormError("");

    const hasErrors = Object.values(nextErrors).some(Boolean);
    if (hasErrors) return;

    setLoading(true);
    try {
      const result = await registerUser({
        username: fields.username,
        emailAddress: fields.email,
        password: fields.password,
        passwordConfirmation: fields.passwordConfirm,
        phone: fields.phone || undefined,
      });

      if (result.ok) {
        /* Navigate to OTP screen, passing the email + userId via router state */
        navigate("/verify-otp", {
          state: { email: fields.email, userId: result.data.userId },
        });
        return;
      }

      const { status, body } = result;

      if (status === 422 && "isValid" in body && body.isValid === false) {
        const fieldUpdates: Partial<typeof errors> = {};
        body.fieldErrors.forEach((fieldError) => {
          const key = SERVER_FIELD_MAP[fieldError.fieldName];
          if (key) fieldUpdates[key] = fieldError.errorMessage;
        });
        setErrors((prev) => ({ ...prev, ...fieldUpdates }));
        return;
      }

      if (status === 422 && "violations" in body) {
        setErrors((prev) => ({ ...prev, password: body.violations.join(" ") }));
        return;
      }

      if (status === 409 && "error_code" in body && body.error_code === "USERNAME_UNAVAILABLE") {
        const hint = body.suggestion_hint ? ` ${body.suggestion_hint}` : "";
        setErrors((prev) => ({ ...prev, username: `${body.message}${hint}` }));
        return;
      }

      setFormError(
        "error" in body && body.error
          ? body.error
          : "Something went wrong. Please try again."
      );
    } catch {
      setFormError("Unable to reach the server. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const strengthScore = getStrength(fields.password).level;
  const isFormValid =
    !validate.username(fields.username) &&
    !validate.email(fields.email) &&
    !validate.password(fields.password) &&
    !validate.passwordConfirm(fields.passwordConfirm, fields.password) &&
    !validate.phone(fields.phone) &&
    strengthScore >= 1;

  return (
    /* Card container — 480px max-width, 40px padding, 8px radius */
    <div
      className="w-full mx-auto rounded-lg border border-[#E0E0E0] bg-white"
      style={{
        maxWidth: "480px",
        padding: "40px",
        boxShadow: "0px 2px 8px rgba(0,0,0,0.08)",
      }}
    >
      <>
        {/* H1 page title */}
        <h1 className="mb-2" style={{ color: "#212121" }}>
          Create Your Account
        </h1>
        <p className="mb-8" style={{ color: "#9E9E9E", fontSize: "14px", lineHeight: "20px" }}>
          Join AuthFlow today — free forever, no credit card needed.
        </p>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          {/* Form-level error banner */}
          {formError && <AuthErrorBanner message={formError} />}

          {/* Username */}
          <FormField
            id="reg-username"
            label="Username"
            type="text"
            placeholder="janesmith"
            value={fields.username}
            onChange={setField("username")}
            onBlur={handleBlur("username")}
            error={touched.username ? errors.username : ""}
            autoComplete="username"
          />

          {/* Email Address */}
          <FormField
            id="reg-email"
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            value={fields.email}
            onChange={setField("email")}
            onBlur={handleBlur("email")}
            error={touched.email ? errors.email : ""}
            autoComplete="email"
          />

          {/* Phone Number */}
          <FormField
            id="reg-phone"
            label="Phone Number"
            type="tel"
            placeholder="+1-5551234567"
            value={fields.phone}
            onChange={setField("phone")}
            onBlur={handleBlur("phone")}
            error={touched.phone ? errors.phone : ""}
            autoComplete="tel"
            hint="Format: +CountryCode-Number (e.g. +1-5551234567)"
          />

          {/* Password */}
          <div className="flex flex-col gap-0">
            <FormField
              id="reg-password"
              label="Password"
              value={fields.password}
              onChange={setField("password")}
              onBlur={handleBlur("password")}
              error={touched.password ? errors.password : ""}
            >
              <PasswordInput
                id="reg-password"
                value={fields.password}
                onChange={setField("password")}
                onBlur={handleBlur("password")}
                hasError={Boolean(touched.password && errors.password)}
              />
            </FormField>

            {/* Password strength bar */}
            <div id="reg-password-strength">
              <PasswordStrengthBar password={fields.password} />
            </div>
          </div>

          {/* Confirm Password */}
          <FormField
            id="reg-password-confirm"
            label="Confirm Password"
            value={fields.passwordConfirm}
            onChange={setField("passwordConfirm")}
            onBlur={handleBlur("passwordConfirm")}
            error={touched.passwordConfirm ? errors.passwordConfirm : ""}
          >
            <PasswordInput
              id="reg-password-confirm"
              value={fields.passwordConfirm}
              onChange={setField("passwordConfirm")}
              onBlur={handleBlur("passwordConfirm")}
              hasError={Boolean(touched.passwordConfirm && errors.passwordConfirm)}
            />
          </FormField>

          {/* Register button — primary, full-width */}
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
            aria-label={loading ? "Creating your account…" : "Register"}
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin"
                  width={16}
                  height={16}
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                </svg>
                Creating account…
              </>
            ) : (
              <>
                Register
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </>
            )}
          </button>

          {/* Secondary link — "Already have an account? Sign In" */}
          <p
            className="text-center"
            style={{ color: "#9E9E9E", fontSize: "14px", lineHeight: "20px" }}
          >
            Already have an account?{" "}
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
    </div>
  );
}
