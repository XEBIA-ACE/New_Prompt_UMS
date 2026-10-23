/**
 * Repository scan backing FR-S4-AC4-001 / FR-S4-AC4-002: SendGrid API keys
 * and MFA template IDs must come only from the environment, never from
 * committed source or configuration.
 */

import fs from 'fs';
import path from 'path';

const BACKEND_ROOT = path.resolve(__dirname, '..', '..');
const REPO_ROOT = path.resolve(BACKEND_ROOT, '..');

const SENDGRID_API_KEY_PATTERN = /SG\.[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{16,}/;
const SENDGRID_TEMPLATE_ID_LITERAL_PATTERN = /d-[0-9a-f]{32}/;
const MFA_TEMPLATE_ASSIGNMENT_PATTERN = /MFA_SETTING_CHANGE_EMAIL_TEMPLATE_ID\s*[:=]\s*["']?d-[0-9a-f]{32}/;

function listFiles(dir: string, extensions: string[]): string[] {
  if (!fs.existsSync(dir)) {
    return [];
  }
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return entry.name === 'node_modules' || entry.name === 'dist' ? [] : listFiles(full, extensions);
    }
    return extensions.some((ext) => entry.name.endsWith(ext)) ? [full] : [];
  });
}

const isTestFile = (file: string): boolean => /\.(test|spec)\.ts$/.test(file);
const sourceFiles = listFiles(path.join(BACKEND_ROOT, 'src'), ['.ts']);
const committedConfigFiles = [
  path.join(BACKEND_ROOT, '.env.example'),
  path.join(REPO_ROOT, 'docker-compose.yml'),
  ...listFiles(path.join(REPO_ROOT, 'k8s'), ['.yaml', '.yml']),
].filter((file) => fs.existsSync(file));

function filesMatching(files: string[], pattern: RegExp): string[] {
  return files
    .filter((file) => pattern.test(fs.readFileSync(file, 'utf8')))
    .map((file) => path.relative(REPO_ROOT, file));
}

describe('SendGrid secret / MFA template scan', () => {
  // [b4b3c394-8366-5e90-b9d0-ab78e8cb980a-AC4] S4-AC4 / T015 — FR-S4-AC4-001, FR-S4-AC4-002
  test('[S4-AC4] no SendGrid API key literal exists in backend source or committed config', () => {
    expect(sourceFiles.length).toBeGreaterThan(0);
    expect(filesMatching([...sourceFiles, ...committedConfigFiles], SENDGRID_API_KEY_PATTERN)).toEqual([]);
  });

  // [b4b3c394-8366-5e90-b9d0-ab78e8cb980a-AC4] S4-AC4 / T015 — FR-S4-AC4-001, FR-S4-AC4-002
  test('[S4-AC4] no SendGrid template ID literal exists in backend application source', () => {
    const appSources = sourceFiles.filter((file) => !isTestFile(file));
    expect(filesMatching(appSources, SENDGRID_TEMPLATE_ID_LITERAL_PATTERN)).toEqual([]);
  });

  // [b4b3c394-8366-5e90-b9d0-ab78e8cb980a-AC4] S4-AC4 / T015 — FR-S4-AC4-001, FR-S4-AC4-002
  test('[S4-AC4] no real MFA template ID is committed to any configuration file', () => {
    expect(filesMatching(committedConfigFiles, MFA_TEMPLATE_ASSIGNMENT_PATTERN)).toEqual([]);
  });

  // [b4b3c394-8366-5e90-b9d0-ab78e8cb980a-AC4] S4-AC4 / T015 — FR-S4-AC4-001
  test('[S4-AC4] the MFA template ID and SendGrid API key are read from the environment', () => {
    const templateConfig = fs.readFileSync(path.join(BACKEND_ROOT, 'src/config/email-template.config.ts'), 'utf8');
    const appConfig = fs.readFileSync(path.join(BACKEND_ROOT, 'src/config/app.config.ts'), 'utf8');

    expect(templateConfig).toMatch(/env\[MFA_SETTING_CHANGE_TEMPLATE_ENV_KEY\]/);
    expect(templateConfig).toMatch(/env: NodeJS\.ProcessEnv = process\.env/);
    expect(appConfig).toMatch(/requireEnvString\('SENDGRID_API_KEY'\)/);
  });
});
