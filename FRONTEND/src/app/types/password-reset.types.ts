export interface ResetPasswordRequest {
  recovery_token: string;
  new_password: string;
}

export interface ResetPasswordSuccessResponse {
  message: string;
}

export interface ResetPasswordTokenErrorResponse {
  error_code: "TOKEN_NOT_FOUND" | "TOKEN_EXPIRED";
  message: string;
}

export interface ResetPasswordPolicyErrorResponse {
  error_code: "PASSWORD_POLICY_VIOLATION";
  violations: string[];
}

export interface ResetPasswordGenericErrorResponse {
  error: string;
}

export type ResetPasswordErrorResponse =
  | ResetPasswordTokenErrorResponse
  | ResetPasswordPolicyErrorResponse
  | ResetPasswordGenericErrorResponse;
