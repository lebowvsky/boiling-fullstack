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
}

export type ValidationResult = true | string;
