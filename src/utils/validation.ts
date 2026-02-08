import validateNpmPackageName from 'validate-npm-package-name';
import crypto from 'crypto';
import type { ValidationResult } from '../types';

const KEBAB_CASE_REGEX = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const RESERVED_SERVICE_NAMES = ['backend', 'db', 'pgadmin', 'adminer'];

export function isValidProjectName(name: string): ValidationResult {
  if (!name) return 'Project name is required';

  const result = validateNpmPackageName(name);
  if (!result.validForNewPackages) {
    const errors = [...(result.errors || []), ...(result.warnings || [])];
    return errors[0] || 'Invalid project name';
  }

  if (!KEBAB_CASE_REGEX.test(name)) {
    return 'Name must be in kebab-case (e.g. my-project)';
  }

  return true;
}

export function isValidServiceName(
  name: string,
  usedNames: string[]
): ValidationResult {
  if (!name) return 'Service name is required';

  if (!KEBAB_CASE_REGEX.test(name)) {
    return 'Name must be in kebab-case (e.g. my-frontend)';
  }

  if (RESERVED_SERVICE_NAMES.includes(name)) {
    return `Name "${name}" is reserved`;
  }

  if (usedNames.includes(name)) {
    return `Name "${name}" is already taken`;
  }

  return true;
}

export function isValidPort(
  port: number,
  usedPorts: number[]
): ValidationResult {
  if (!Number.isInteger(port)) return 'Port must be an integer';
  if (port < 1024 || port > 65535) return 'Port must be between 1024 and 65535';
  if (port === 5432) return 'Port 5432 is reserved for PostgreSQL';

  if (usedPorts.includes(port)) {
    return `Port ${port} is already in use`;
  }

  return true;
}

export function generatePassword(length = 16): string {
  return crypto.randomBytes(length).toString('base64url').slice(0, length);
}

export function generateJwtSecret(length = 32): string {
  return crypto.randomBytes(length).toString('hex');
}
