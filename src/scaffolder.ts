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
        `Le dossier "${config.projectName}" existe déjà. Utilisez --force pour le remplacer.`
      );
    }
  }

  try {
    await fs.ensureDir(projectDir);

    // Frontends
    for (const fe of config.frontends) {
      s.start(`Génération de ${chalk.cyan(fe.name)} (${fe.framework})…`);
      await copyAndRenderDir(
        path.join(templatesDir, 'frontend', fe.framework),
        path.join(projectDir, fe.name),
        { name: fe.name, styling: fe.styling }
      );
      s.stop(`${chalk.cyan(fe.name)} créé`);
    }

    // Backend
    s.start(`Génération du ${chalk.cyan('backend')} (NestJS)…`);
    await copyAndRenderDir(
      path.join(templatesDir, 'backend', 'nestjs'),
      path.join(projectDir, 'backend'),
      { projectName: config.projectName, backendPort: config.backendPort }
    );
    s.stop(`${chalk.cyan('backend')} créé`);

    // Root files
    s.start('Génération des fichiers racine…');
    await copyAndRenderDir(
      path.join(templatesDir, 'root'),
      projectDir,
      { ...config }
    );
    s.stop('Fichiers racine créés');

    // Git init
    s.start('Initialisation du dépôt git…');
    await gitInit(projectDir);
    s.stop('Dépôt git initialisé');
  } catch (error) {
    s.stop(chalk.red('Erreur'));
    if (await fs.pathExists(projectDir)) {
      await fs.remove(projectDir);
    }
    throw error;
  }
}
