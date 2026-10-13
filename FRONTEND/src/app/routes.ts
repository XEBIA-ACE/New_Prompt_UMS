import { createBrowserRouter } from "react-router";
import { LandingTemplate }           from "./components/templates/LandingTemplate";
import { RegistrationTemplate }      from "./components/templates/RegistrationTemplate";
import { OtpVerificationTemplate }   from "./components/templates/OtpVerificationTemplate";
import { LoginTemplate }             from "./components/templates/LoginTemplate";
import { ResetPasswordTemplate }     from "./components/templates/ResetPasswordTemplate";
import { DashboardTemplate }         from "./components/templates/DashboardTemplate";
import { AccountDashboardTemplate }  from "./components/templates/AccountDashboardTemplate";
import { AccountDeletionTemplate }   from "./components/templates/AccountDeletionTemplate";
import { RequireAuth }               from "./components/RequireAuth";

export const router = createBrowserRouter([
  { path: "/",                Component: LandingTemplate          },
  { path: "/register",        Component: RegistrationTemplate     },
  { path: "/verify-otp",      Component: OtpVerificationTemplate  },
  { path: "/login",           Component: LoginTemplate            },
  { path: "/reset-password",  Component: ResetPasswordTemplate    },
  {
    Component: RequireAuth,
    children: [
      { path: "/dashboard",         Component: DashboardTemplate        },
      { path: "/account-dashboard", Component: AccountDashboardTemplate },
      { path: "/delete-account",    Component: AccountDeletionTemplate  },
    ],
  },
]);
