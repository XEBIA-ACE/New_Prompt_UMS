# Implementation Plan: c7bd1d68-37fb-59cc-ac57-24602b4ffc75

## Technical Context
- Codebase grounding snapshot (ae246fe2f5b81296)
- Accepted impact analysis (sha256:4d638b68f28195d9374f145948354b944b03b81d2503abca60f42fcabbc866cb)
- Implement only against Accepted impact analysis (revision 2) (fingerprint sha256:4d638b68f28195d9374f145948354b944b03b81d2503abca60f42fcabbc866cb)
- Resolve or explicitly accept the following implementation-readiness items:
  - Candidate verification flagged a possibly better-matching alternative that was not selected: OtpController (2958) -- review before accepting.
  - Candidate verification found the selected focus object implausible for this requirement: The requirement concerns adding an OTP_MAX_ATTEMPTS configuration constant for brute-force protection in the OTP verification service layer, which is unrelated to the selected Accordion Typescript Function, a UI component. The OtpController Typescript Class in the candidates list is clearly more semantically aligned with OTP verification and configuration concerns than Accordion.
  - No CAST structural evidence for OTP configuration files, OTP service/controller, or otp_requests table was provided, so OTP_MAX_ATTEMPTS behaviour cannot be structurally validated.
  - No pre-existing implementation was found for this requirement; scope is derived solely from the requirement text, not from measured code evidence.
  - No-match classification: Initial classification (net-new capability) has a noted caveat: The requirement is fairly generic configuration for OTP throttling and many systems implement similar limits under different names, so its absence based only on these specific search terms is not entirely certain. However, there is no concrete evidence from the given information that this codebase already has such a constant or equivalent setting under another identifier.
  - No-match consistency check raised a caveat about this classification: The requirement is fairly generic configuration for OTP throttling and many systems implement similar limits under different names, so its absence based only on these specific search terms is not entirely certain. However, there is no concrete evidence from the given information that this codebase already has such a constant or equivalent setting under another identifier.
  - Requirement detail is incomplete (see evidence_gaps); no conflicting existing implementation was found
  - Searched 4 term(s) derived from this requirement (OTP_MAX_ATTEMPTS, otp verification, brute force protection, max attempts) against Cast; none resolved to an existing code object.
  - Which components will need to be built to implement each acceptance criterion, since no existing implementation was found?

## Contract Changes
- No material API, event, or data contract change is evidenced.

## Security and Quality
- Preserve the security controls evidenced by ae246fe2f5b81296
- Verify the changed user flow against the stated accessibility criteria

## Verification Plan
- **S2-AC1**: Given the OTP configuration module exists, when OTP_MAX_ATTEMPTS is imported by the OTP service layer, then it resolves to the integer value 5 by default.
- **S2-AC2**: Given the OTP configuration is loaded, when the application starts without an explicit OTP_MAX_ATTEMPTS environment variable, then the constant defaults to 5.
- **S2-AC3**: Given an environment variable OTP_MAX_ATTEMPTS is set to a different value (e.g., 3 or 10), when the OTP configuration is loaded, then the constant resolves to that overridden value.
- **S2-AC4**: Given the OTP service layer requires OTP_MAX_ATTEMPTS, when the constant is imported, then no runtime errors occur and the value is accessible as a number.
- **IMPACT**: Verify acceptance criterion: Given the OTP configuration module exists, when OTP_MAX_ATTEMPTS is imported by the OTP service layer, then it resolves to the integer value 5 by default.
- **IMPACT**: Verify acceptance criterion: Given the OTP configuration is loaded, when the application starts without an explicit OTP_MAX_ATTEMPTS environment variable, then the constant defaults to 5.
- **IMPACT**: Verify acceptance criterion: Given an environment variable OTP_MAX_ATTEMPTS is set to a different value (e.g., 3 or 10), when the OTP configuration is loaded, then the constant resolves to that overridden value.
- **IMPACT**: Verify acceptance criterion: Given the OTP service layer requires OTP_MAX_ATTEMPTS, when the constant is imported, then no runtime errors occur and the value is accessible as a number.