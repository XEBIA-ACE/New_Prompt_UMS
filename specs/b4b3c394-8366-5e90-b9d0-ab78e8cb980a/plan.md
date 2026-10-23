# Implementation Plan: b4b3c394-8366-5e90-b9d0-ab78e8cb980a

## Technical Context
- Codebase grounding snapshot (ae246fe2f5b81296)
- unresolved reference (component:AccordionItem_fragment_1)
- unresolved reference (component:EmailDeliveryPort)
- unresolved reference (component:SendGridEmailAdapter)
- unresolved reference (component:constructor)
- unresolved reference (component:createApp)
- unresolved reference (component:createDeletionRouter)
- unresolved reference (component:createPasswordRouter)
- unresolved reference (component:	{main_sources}	/New_Prompt_UMS-develop/BACKEND/src/adapters/email-delivery.port.ts)
- Accepted impact analysis (sha256:235d885f17ea45cbd85af6271796c4508ec0368d47a595afa4cadeab1bf0b4d5)
- Implement only against Accepted impact analysis (revision 1) (fingerprint sha256:235d885f17ea45cbd85af6271796c4508ec0368d47a595afa4cadeab1bf0b4d5)
- Resolve or explicitly accept the following implementation-readiness items:
  - Candidate verification could not confidently judge the selected focus object for this requirement
  - Candidate verification was uncertain about the selected focus object: The requirement is about configuring SendGrid MFA templates and types, and EmailDeliveryPort as an interface is involved in email dispatch, but the facts don’t state whether this interface actually carries template configuration or MFA-specific options.
  - EmailDeliveryPort remains the central abstraction for transactional email sending in the measured transactions.
  - How is the MFA setting-change flow currently wired to EmailDeliveryPort, if at all?
  - Is there an existing typed template configuration object or enum that will be extended for MFA templates?
  - No CAST evidence about environment variable usage, dotenv configuration, or secret management for SendGrid.
  - No configuration or code paths specific to MFA setting-change notifications are visible in the measured facts.
  - No structural indication of TypeScript enums or types modeling email templates, beyond the EmailDeliveryPort interface definition.
  - No-match classification (all acceptance criteria unmapped): Initial classification (net-new capability) has a noted caveat: The requirement is about configuring a specific SendGrid template and types for MFA notifications, but many systems with SendGrid already centralize template IDs and email configuration under more generic names; those generic configuration/typing constructs might exist under other terms even if 'EmailDeliveryPort', 'sendgrid', and 'MFA template' don’t appear.
  - Requirement traceability incomplete for S4-AC1, S4-AC2, S4-AC3, S4-AC4, S4-AC5
  - Where are SendGrid API keys and template IDs currently configured (environment vs. code)?
  - sendTransactional (1028) is the primary method used to dispatch emails for OTP and password recovery flows, as shown by the transaction graphs.

## Contract Changes
- POST api/v1/auth/password-recovery/ — change required
- POST api/v1/otp/send/ — change required
- Email content and delivery for password recovery and OTP send flows are affected via EmailDeliveryPort and sendTransactional, but no database tables are directly involved per CAST data. — change required

## Security and Quality
- Changes to EmailDeliveryPort and SendGridEmailAdapter must preserve correct use of SendGrid and avoid introducing hard-coded secrets or template IDs, especially for MFA-related notifications, although current CAST facts do not confirm how secrets are handled.
- Validate credential and personal-data handling against the Jira requirement
- Validate credential and personal-data handling against the story's acceptance criteria
- Preserve the availability, reliability, and observability constraints grounded by ae246fe2f5b81296

## Verification Plan
- **S4-AC1**: Given the backend is started with an environment variable defined for the MFA setting-change SendGrid template ID, when the email dispatch service is initialized, then it loads this MFA template ID from the environment (via dotenv) and exposes it through its configuration or types for use by calling code.
- **S4-AC2**: Given the email dispatch service is asked to send an MFA setting-change notification through EmailDeliveryPort with valid input parameters, when it composes the SendGrid request, then it selects the dedicated MFA template (using the configured template ID) rather than reusing registration or account deletion templates.
- **S4-AC3**: Given the codebase type definitions or configuration objects for email templates, when a developer references the MFA template in strongly-typed code, then TypeScript (or equivalent typing) recognizes the MFA template as a distinct, type-safe option (e.g., via an enum member or typed config entry) and rejects invalid template keys at compile time.
- **S4-AC4**: Given the SendGrid API key and MFA template ID are provided via environment variables, when the codebase is scanned or reviewed, then there are no hard-coded SendGrid secrets or template IDs related to MFA notifications checked into source control.
- **S4-AC5**: Given the application is started without the MFA template ID environment variable, when the email dispatch service initializes or when an MFA email send is attempted, then the behavior clearly fails fast or surfaces a configuration error in logs without crashing unrelated profile or authentication flows, allowing operators to detect and remedy the misconfiguration.
- **IMPACT**: Regression tests should cover api/v1/auth/password-recovery/ and api/v1/otp/send/ transactions to ensure email sending via sendTransactional remains correct when adding MFA template configuration, but CAST does not show existing tests.