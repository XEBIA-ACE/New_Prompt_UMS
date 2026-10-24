# Implementation Plan: ede1d736-b91a-51a2-a0ed-2d2ef4314975

## Technical Context
- Codebase grounding snapshot (ae246fe2f5b81296)
- Accepted impact analysis (sha256:7acc1b7741b2a8ed83692860834a20cbb5aac3325e7cb7af3915dedbda02e1ac)
- Implement only against Accepted impact analysis (revision 1) (fingerprint sha256:7acc1b7741b2a8ed83692860834a20cbb5aac3325e7cb7af3915dedbda02e1ac)
- Resolve or explicitly accept the following implementation-readiness items:
  - Candidate verification found the selected focus object implausible for this requirement: The requirement concerns OTP verification backend decisions about error handling, database schema, and verification status, while IdentityVerificationCard (id=2560, type=Typescript Function) appears to be a UI component unrelated to OTP verification logic or error contracts. None of the other candidates mention OTP either, so no clearly better match is evident.
  - No ADRs, design docs, or Jira comments are part of the CAST structural facts, so decision documentation status cannot be inferred.
  - No pre-existing implementation was found for this requirement; scope is derived solely from the requirement text, not from measured code evidence.
  - No-match classification: Initial classification (net-new capability) has a noted caveat: The requirement concerns OTP verification design decisions that many systems could already implement under different names, and only a single, very specific search term was tried that may not reflect typical OTP-related naming. However, there is no concrete evidence that this codebase already implements these specific decisions.
  - No-match consistency check raised a caveat about this classification: The requirement concerns OTP verification design decisions that many systems could already implement under different names, and only a single, very specific search term was tried that may not reflect typical OTP-related naming. However, there is no concrete evidence that this codebase already implements these specific decisions.
  - Requirement detail is incomplete (see evidence_gaps); no conflicting existing implementation was found
  - Searched 1 term(s) derived from this requirement (IdentityVerificationCard) against Cast; none resolved to an existing code object.
  - Which components will need to be built to implement each acceptance criterion, since no existing implementation was found?

## Contract Changes
- No material API, event, or data contract change is evidenced.

## Security and Quality
- Preserve the security controls evidenced by ae246fe2f5b81296
- Verify the changed user flow against the stated accessibility criteria

## Verification Plan
- **S1-AC1**: Given the team has reviewed the four open decisions (error naming, attempt counter ownership, verified status representation, verify-on-already-active behavior), when a consensus is reached on each decision, then the agreed approach is documented in a decision artifact (ADR, design doc, or Jira comment) with clear rationale for each choice.
- **S1-AC2**: Given the error naming decision, when the team chooses between breaking change (adopt spec error names) or backward compatibility (keep current names), then the choice is documented with impact analysis on existing clients and any deprecation plan if applicable.
- **S1-AC3**: Given the attempt counter ownership decision, when the team chooses between otp_requests table or users table, then the choice is documented with schema implications and rationale for the selected ownership model.
- **S1-AC4**: Given the verified status representation decision, when the team chooses between a new status field or using invalidated_at timestamp, then the choice is documented with schema implications and query performance considerations.
- **S1-AC5**: Given the verify-on-already-active behavior decision, when the team chooses between no-op success or error response, then the choice is documented with user experience and security rationale.
- **IMPACT**: Verify acceptance criterion: Given the team has reviewed the four open decisions (error naming, attempt counter ownership, verified status representation, verify-on-already-active behavior), when a consensus is reached on each decision, then the agreed approach is documented in a decision artifact (ADR, design doc, or Jira comment) with clear rationale for each choice.
- **IMPACT**: Verify acceptance criterion: Given the error naming decision, when the team chooses between breaking change (adopt spec error names) or backward compatibility (keep current names), then the choice is documented with impact analysis on existing clients and any deprecation plan if applicable.
- **IMPACT**: Verify acceptance criterion: Given the attempt counter ownership decision, when the team chooses between otp_requests table or users table, then the choice is documented with schema implications and rationale for the selected ownership model.
- **IMPACT**: Verify acceptance criterion: Given the verified status representation decision, when the team chooses between a new status field or using invalidated_at timestamp, then the choice is documented with schema implications and query performance considerations.
- **IMPACT**: Verify acceptance criterion: Given the verify-on-already-active behavior decision, when the team chooses between no-op success or error response, then the choice is documented with user experience and security rationale.