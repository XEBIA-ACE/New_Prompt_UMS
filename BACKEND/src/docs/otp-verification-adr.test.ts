/**
 * otp-verification-adr.test.ts
 *
 * Documentation-conformance checks for ADR 0001 (story
 * ede1d736-b91a-51a2-a0ed-2d2ef4314975). These tests only inspect the
 * decision artifact; they do not exercise OTP runtime behavior.
 *
 * Tasks: T014–T023 (verify S1-AC1..S1-AC5 and IMPACT).
 */

import fs from 'fs';
import path from 'path';

const REPO_ROOT = path.resolve(__dirname, '../../..');
const ADR_DIR = path.join(REPO_ROOT, 'DOCS', 'adr');
const ADR_FILE = '0001-otp-verification-open-decisions.md';
const ADR_PATH = path.join(ADR_DIR, ADR_FILE);
const STORY_ID = 'ede1d736-b91a-51a2-a0ed-2d2ef4314975';

const adr = fs.readFileSync(ADR_PATH, 'utf8');

/** Return the body of the `## Decision N: ...` section (up to the next `## `). */
function decisionSection(n: number): string {
  const match = adr.match(new RegExp(`^## Decision ${n}:[^\\n]*\\n([\\s\\S]*?)(?=^## )`, 'm'));
  if (!match) throw new Error(`Decision ${n} section not found in ${ADR_FILE}`);
  return match[1];
}

function chosenOption(section: string): string {
  const match = section.match(/^\*\*Chosen option:\*\*(.*)$/m);
  if (!match) throw new Error('Missing "**Chosen option:**" line');
  return match[1];
}

/**
 * The chosen-option line must reference exactly one numbered option and name
 * exactly one of the two `candidates` (index 0 = Option 1, index 1 = Option 2).
 */
function expectExactlyOneChosen(section: string, candidates: [string, string]): void {
  const line = chosenOption(section);
  const optionNumbers = new Set(Array.from(line.matchAll(/Option (\d)/g), (m) => m[1]));
  expect(optionNumbers.size).toBe(1);
  const [chosen] = Array.from(optionNumbers);
  expect(['1', '2']).toContain(chosen);
  expect(line).toContain(candidates[Number(chosen) - 1]);
}

function expectHeadings(section: string, headings: string[]): void {
  for (const h of headings) {
    expect(section).toContain(`**${h}**`);
  }
}

describe('ADR 0001 — OTP verification open decisions', () => {
  // [S1-AC1] / IMPACT (T014, T019) — FR-001, FR-002
  test('[S1-AC1] documents all four decisions, each with a chosen option and rationale', () => {
    expect(adr).toContain(STORY_ID);
    const titles = [
      /^## Decision 1: Error naming$/m,
      /^## Decision 2: Attempt counter ownership$/m,
      /^## Decision 3: Verified status representation$/m,
      /^## Decision 4: Verify-on-already-active behavior$/m,
    ];
    for (const t of titles) expect(adr).toMatch(t);

    for (const n of [1, 2, 3, 4]) {
      const section = decisionSection(n);
      expect(chosenOption(section).trim().length).toBeGreaterThan(0);
      expect(section).toMatch(/\*\*[^*\n]*[Rr]ationale\*\*/);
    }

    expect(adr).toMatch(/^## Sign-off$/m);
    expect(adr).toMatch(/^## Known Gaps \/ Open Questions$/m);
  });

  // [S1-AC2] / IMPACT (T015, T020) — FR-003, FR-004, FR-005
  test('[S1-AC2] error naming states one option, client impact and deprecation plan', () => {
    const section = decisionSection(1);
    expectExactlyOneChosen(section, ['spec-aligned error names', 'retain current error names']);
    expectHeadings(section, ['Impact analysis on existing clients', 'Deprecation / migration strategy']);
    expect(section).toMatch(/FRONTEND/);
    expect(section).toMatch(/No deprecation window|deprecation window .* is planned/);
  });

  // [S1-AC3] / IMPACT (T016, T021) — FR-006, FR-007, FR-008
  test('[S1-AC3] attempt counter ownership names one table, schema implications and rationale', () => {
    const section = decisionSection(2);
    expectExactlyOneChosen(section, ['in the `otp_requests` table', 'in the `users` table']);
    expect(chosenOption(section)).toMatch(/not in both/);
    expectHeadings(section, ['Schema implications', 'Rationale']);
    for (const consideration of ['Data locality', 'Maintainability', 'Reporting']) {
      expect(section).toContain(consideration);
    }
  });

  // [S1-AC4] / IMPACT (T017, T022) — FR-009, FR-010
  test('[S1-AC4] verified status names one model, schema implications and query performance', () => {
    const section = decisionSection(3);
    expectExactlyOneChosen(section, ['new status field', 'existing `invalidated_at` timestamp']);
    expectHeadings(section, ['Schema implications', 'Query performance considerations']);
    expect(section).toContain('uidx_otp_requests_active_per_user');
  });

  // [S1-AC5] / IMPACT (T018, T023) — FR-011, FR-012
  test('[S1-AC5] verify-on-already-active names one behavior with UX and security rationale', () => {
    const section = decisionSection(4);
    expectExactlyOneChosen(section, ['no-op success', 'an error response']);
    expectHeadings(section, ['API behavior mapping', 'User experience rationale', 'Security rationale']);
  });

  // FR-013 — artifact is discoverable by downstream stories (S3, S7, S8, S11)
  test('[S1-AC1] [FR-013] ADR is indexed in DOCS/adr and linked from the root README', () => {
    const index = fs.readFileSync(path.join(ADR_DIR, 'README.md'), 'utf8');
    const readme = fs.readFileSync(path.join(REPO_ROOT, 'README.md'), 'utf8');
    expect(index).toContain(`(${ADR_FILE})`);
    expect(readme).toContain(`DOCS/adr/${ADR_FILE}`);
    for (const story of ['S3', 'S7', 'S8', 'S11']) expect(adr).toContain(story);
  });

  // Grounding: the facts Decision 3 relies on exist in the schema.
  test('[S1-AC4] schema facts cited by the ADR exist in migration 004', () => {
    const migration = fs.readFileSync(
      path.join(REPO_ROOT, 'BACKEND', 'db', 'migrations', '004_create_otp_requests.sql'),
      'utf8',
    );
    expect(migration).toMatch(/invalidated_at\s+TEXT\s+NULL/);
    expect(migration).toMatch(/uidx_otp_requests_active_per_user[\s\S]*WHERE invalidated_at IS NULL/);
  });

  // All requirement IDs are preserved verbatim.
  test('[S1-AC1] traceability covers FR-001..FR-013', () => {
    for (let i = 1; i <= 13; i++) {
      expect(adr).toContain(`\`FR-${String(i).padStart(3, '0')}\``);
    }
  });
});
