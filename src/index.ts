#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { runCli } from './cli';
import type { CliOptions } from './types';

const { version } = require('../package.json');

const program = new Command();

program
  .name('boiling')
  .description('Scaffold a fullstack project with Docker, NestJS backend, and Vue/Nuxt frontends')
  .version(version)
  .argument('[project-name]', 'Project name')
  .option('-f, --force', 'Overwrite existing directory', false)
  .option('-v, --verbose', 'Show shell command output', false)
  .action(async (projectName: string | undefined, opts: { force: boolean; verbose: boolean }) => {
    try {
      const options: CliOptions = { force: opts.force, verbose: opts.verbose };
      await runCli(projectName, options);
    } catch (error: any) {
      console.error(chalk.red(`\nError: ${error.message}`));
      process.exit(1);
    }
  });

process.on('unhandledRejection', (reason: any) => {
  console.error(chalk.red(`\nUnexpected error: ${reason?.message || reason}`));
  process.exit(1);
});

program.parse();
