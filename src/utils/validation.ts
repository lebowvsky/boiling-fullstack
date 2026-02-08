import validateNpmPackageName from 'validate-npm-package-name';
import crypto from 'crypto';
import type { ValidationResult } from '../types';

const KEBAB_CASE_REGEX = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const RESERVED_SERVICE_NAMES = ['backend', 'db', 'pgadmin', 'adminer'];

export function isValidProjectName(name: string): ValidationResult {
  if (!name) return 'Le nom du projet est requis';

  const result = validateNpmPackageName(name);
  if (!result.validForNewPackages) {
    const errors = [...(result.errors || []), ...(result.warnings || [])];
    return errors[0] || 'Nom de projet invalide';
  }

  if (!KEBAB_CASE_REGEX.test(name)) {
    return 'Le nom doit être en kebab-case (ex: mon-projet)';
  }

  return true;
}

export function isValidServiceName(
  name: string,
  usedNames: string[]
): ValidationResult {
  if (!name) return 'Le nom du service est requis';

  if (!KEBAB_CASE_REGEX.test(name)) {
    return 'Le nom doit être en kebab-case (ex: mon-frontend)';
  }

  if (RESERVED_SERVICE_NAMES.includes(name)) {
    return `Le nom "${name}" est réservé`;
  }

  if (usedNames.includes(name)) {
    return `Le nom "${name}" est déjà utilisé`;
  }

  return true;
}

export function isValidPort(
  port: number,
  usedPorts: number[]
): ValidationResult {
  if (!Number.isInteger(port)) return 'Le port doit être un entier';
  if (port < 1024 || port > 65535) return 'Le port doit être entre 1024 et 65535';
  if (port === 5432) return 'Le port 5432 est réservé à PostgreSQL';

  if (usedPorts.includes(port)) {
    return `Le port ${port} est déjà utilisé`;
  }

  return true;
}

export function generatePassword(length = 16): string {
  return crypto.randomBytes(length).toString('base64url').slice(0, length);
}

export function generateJwtSecret(length = 32): string {
  return crypto.randomBytes(length).toString('hex');
}
