import path from 'path';
import fs from 'fs-extra';
import * as clack from '@clack/prompts';
import chalk from 'chalk';
import type { ProjectConfig, CliOptions } from './types';
import { copyAndRenderDir } from './utils/template';
import { gitInit } from './utils/shell';

function getTemplatesDir(): string {
  return path.resolve(__dirname, '..', 'templates');
}

export async function scaffold(config: ProjectConfig, options: CliOptions): Promise<void> {
  const s = clack.spinner();
  const projectDir = path.resolve(process.cwd(), config.projectName);
  const templatesDir = getTemplatesDir();

  if (await fs.pathExists(projectDir)) {
    if (options.force) {
      await fs.remove(projectDir);
    } else {
      throw new Error(
        `Directory "${config.projectName}" already exists. Use --force to overwrite.`
      );
    }
  }

  try {
    await fs.ensureDir(projectDir);

    // Frontends
    for (const fe of config.frontends) {
      s.start(`Generating ${chalk.cyan(fe.name)} (${fe.framework})...`);
      await copyAndRenderDir(
        path.join(templatesDir, 'frontend', fe.framework),
        path.join(projectDir, fe.name),
        { name: fe.name, styling: fe.styling, useShadcn: fe.useShadcn }
      );
      if (fe.framework === 'vue' && fe.useShadcn) {
        await copyAndRenderDir(
          path.join(templatesDir, 'frontend', 'vue-shadcn'),
          path.join(projectDir, fe.name),
          { name: fe.name, styling: fe.styling, useShadcn: fe.useShadcn }
        );
      }
      s.stop(`${chalk.cyan(fe.name)} created`);
    }

    // Backend
    s.start(`Generating ${chalk.cyan('backend')} (NestJS)...`);
    await copyAndRenderDir(
      path.join(templatesDir, 'backend', 'nestjs'),
      path.join(projectDir, 'backend'),
      { projectName: config.projectName, backendPort: config.backendPort }
    );
    s.stop(`${chalk.cyan('backend')} created`);

    // Root files
    s.start('Generating root files...');
    await copyAndRenderDir(
      path.join(templatesDir, 'root'),
      projectDir,
      { ...config }
    );
    s.stop('Root files created');

    // Git init
    s.start('Initializing git repository...');
    await gitInit(projectDir);
    s.stop('Git repository initialized');
  } catch (error) {
    s.stop(chalk.red('Error'));
    if (await fs.pathExists(projectDir)) {
      await fs.remove(projectDir);
    }
    throw error;
  }
}
