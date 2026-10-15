import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { ProfileTemplate } from "./ProfileTemplate";
import type { ProfileDetailsResponse } from "../../types/profile.types";

const baseProfile: ProfileDetailsResponse = {
  username: "jane",
  email: "jane@example.test",
  displayName: "Jane Doe",
  phoneNumber: null,
  status: "active",
  registrationTimestamp: "2026-01-01T00:00:00.000Z",
  lastLoginAt: "2026-10-15T09:00:00.000Z",
  profileUpdatedAt: null,
  version: 1,
  csrfToken: "csrf-abc",
};

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

const fetchMock = vi.fn();

function renderProfile() {
  return render(
    <MemoryRouter initialEntries={["/profile"]}>
      <Routes>
        <Route path="/profile" element={<ProfileTemplate />} />
        <Route path="/login" element={<p>Login page</p>} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  localStorage.setItem("ums_session_token", "session-token");
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

describe("ProfileTemplate", () => {
  // US-004-ac-1: authenticated user navigates to Profile and sees current information
  test("[US-004-ac-1] loads GET /api/user/profile with the session token and shows the current profile", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, baseProfile));
    renderProfile();

    expect(await screen.findByLabelText(/Display name/)).toHaveValue("Jane Doe");
    expect(screen.getByLabelText(/^Email/)).toHaveValue("jane@example.test");
    expect(screen.getByLabelText(/Phone number/)).toHaveValue("");
    const details = screen.getByRole("region", { name: "Account details" });
    expect(within(details).getByText("jane")).toBeInTheDocument();
    expect(within(details).getByText("active")).toBeInTheDocument();

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/user/profile");
    expect(init.method).toBe("GET");
    expect(init.headers.Authorization).toBe("Bearer session-token");
  });

  test("[US-004-ac-1] an expired session redirects to login", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(401, { error_code: "SESSION_INVALID" }));
    renderProfile();
    expect(await screen.findByText("Login page")).toBeInTheDocument();
    expect(localStorage.getItem("ums_session_token")).toBeNull();
  });

  test("[US-004-ac-1] a load failure is announced with a retry action", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(500, { error: "boom" }))
      .mockResolvedValueOnce(jsonResponse(200, baseProfile));
    renderProfile();
    expect(await screen.findByRole("alert")).toHaveTextContent(/couldn't load your profile/i);
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByLabelText(/Display name/)).toHaveValue("Jane Doe");
  });

  // US-004-ac-2: user edits fields, submits, and sees the saved information
  test("[US-004-ac-2] submits PUT /api/user/profile with CSRF + version and shows the saved values", async () => {
    const saved = {
      ...baseProfile,
      displayName: "Jane Q. Doe",
      phoneNumber: "+15550102000",
      version: 2,
      profileUpdatedAt: "2026-10-15T10:00:00.000Z",
      csrfToken: "csrf-abc",
    };
    fetchMock.mockResolvedValueOnce(jsonResponse(200, baseProfile)).mockResolvedValueOnce(jsonResponse(200, saved));
    renderProfile();

    const user = userEvent.setup();
    const displayName = await screen.findByLabelText(/Display name/);
    await user.clear(displayName);
    await user.type(displayName, "Jane Q. Doe");
    await user.type(screen.getByLabelText(/Phone number/), "+15550102000");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByTestId("profile-status")).toHaveTextContent("Your profile has been updated.");
    expect(screen.getByRole("status")).toHaveTextContent("Your profile has been updated.");
    expect(screen.getByLabelText(/Display name/)).toHaveValue("Jane Q. Doe");
    expect(screen.getByLabelText(/Phone number/)).toHaveValue("+15550102000");

    const [url, init] = fetchMock.mock.calls[1];
    expect(url).toBe("/api/user/profile");
    expect(init.method).toBe("PUT");
    expect(init.headers["X-CSRF-Token"]).toBe("csrf-abc");
    expect(init.headers.Authorization).toBe("Bearer session-token");
    expect(JSON.parse(init.body)).toEqual({
      displayName: "Jane Q. Doe",
      email: "jane@example.test",
      phoneNumber: "+15550102000",
      version: 1,
    });
  });

  test("[US-004-ac-2] invalid input is blocked client-side with accessible field errors", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, baseProfile));
    renderProfile();
    const user = userEvent.setup();
    const email = await screen.findByLabelText(/^Email/);
    await user.clear(email);
    await user.type(email, "not-an-email");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    const error = await screen.findByText("Enter a valid email address.");
    expect(email).toHaveAttribute("aria-invalid", "true");
    expect(email).toHaveAttribute("aria-describedby", error.closest("p")?.id);
    expect(email).toHaveFocus();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test("[US-004-ac-2] server field errors are mapped onto the matching inputs", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, baseProfile))
      .mockResolvedValueOnce(
        jsonResponse(409, {
          error_code: "EMAIL_ALREADY_IN_USE",
          message: "This email address is already in use by another account.",
          fieldErrors: { email: "This email address is already in use by another account." },
        })
      );
    renderProfile();
    const user = userEvent.setup();
    const email = await screen.findByLabelText(/^Email/);
    await user.clear(email);
    await user.type(email, "taken@example.test");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(email).toHaveAttribute("aria-invalid", "true"));
    expect(screen.getAllByText("This email address is already in use by another account.").length).toBeGreaterThan(0);
  });

  test("[US-004-ac-2] a version conflict explains the situation and offers to reload", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, baseProfile))
      .mockResolvedValueOnce(jsonResponse(409, { error_code: "PROFILE_VERSION_CONFLICT", currentVersion: 2 }))
      .mockResolvedValueOnce(jsonResponse(200, { ...baseProfile, displayName: "Changed elsewhere", version: 2 }));
    renderProfile();
    const user = userEvent.setup();
    const displayName = await screen.findByLabelText(/Display name/);
    await user.type(displayName, "!");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByTestId("profile-status")).toHaveTextContent(/changed elsewhere/i);
    await user.click(screen.getByRole("button", { name: "Reload latest" }));
    expect(await screen.findByLabelText(/Display name/)).toHaveValue("Changed elsewhere");
  });
});
