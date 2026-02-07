#!/usr/bin/env node

import { Command } from 'commander';
import { runCli } from './cli';

const program = new Command();

program
  .name('boiling')
  .description('Scaffold a fullstack project with Docker, NestJS backend, and Vue/Nuxt frontends')
  .version('0.1.0')
  .argument('[project-name]', 'Nom du projet')
  .action((projectName?: string) => {
    runCli(projectName);
  });

program.parse();
