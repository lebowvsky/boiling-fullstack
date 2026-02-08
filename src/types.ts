export interface FrontendConfig {
  name: string;
  framework: 'nuxt' | 'vue';
  styling: 'css' | 'sass';
  port: number;
}

export interface ProjectConfig {
  projectName: string;
  frontends: FrontendConfig[];
  backendPort: number;
  dbName: string;
  dbUser: string;
  dbPassword: string;
  jwtSecret?: string;
  dbAdmin?: DbAdminConfig;
}

export type DbAdminTool = 'none' | 'pgadmin' | 'adminer';

export interface DbAdminConfig {
  tool: DbAdminTool;
  port: number;
  email?: string;    // pgAdmin uniquement
  password?: string; // pgAdmin uniquement
}

export interface CliOptions {
  force: boolean;
  verbose: boolean;
}

export type ValidationResult = true | string;
