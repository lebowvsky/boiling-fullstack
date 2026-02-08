import * as clack from '@clack/prompts';
import chalk from 'chalk';
import type { FrontendConfig, ProjectConfig, CliOptions, DbAdminTool, DbAdminConfig } from './types';
import {
  isValidProjectName,
  isValidServiceName,
  isValidPort,
  generatePassword,
  generateJwtSecret,
} from './utils/validation';
import { scaffold } from './scaffolder';
import { setVerbose, checkEnvironment } from './utils/shell';

function handleCancel(): never {
  clack.cancel('Operation cancelled.');
  process.exit(0);
}

export async function runCli(projectName?: string, options: CliOptions = { force: false, verbose: false }): Promise<void> {
  clack.intro(chalk.bgCyan.black(' boiling-fullstack '));

  setVerbose(options.verbose);
  await checkEnvironment();

  // --- Project name ---
  const nameResult = await clack.text({
    message: 'Project name:',
    placeholder: 'my-project',
    initialValue: projectName,
    validate(value) {
      const result = isValidProjectName(value);
      if (result !== true) return result;
    },
  });
  if (clack.isCancel(nameResult)) handleCancel();
  const finalProjectName = nameResult as string;

  // --- Number of frontends ---
  const frontendCountResult = await clack.text({
    message: 'Number of frontends (1-5):',
    defaultValue: '1',
    validate(value) {
      const n = parseInt(value, 10);
      if (isNaN(n) || n < 1 || n > 5) return 'Enter a number between 1 and 5';
    },
  });
  if (clack.isCancel(frontendCountResult)) handleCancel();
  const frontendCount = parseInt(frontendCountResult as string, 10);

  // --- Frontend configs ---
  const usedPorts: number[] = [5432];
  const usedServiceNames: string[] = ['backend', 'db'];
  const frontends: FrontendConfig[] = [];

  for (let i = 0; i < frontendCount; i++) {
    const defaultPort = 3000 + i * 10;
    const prefix = frontendCount > 1 ? `Frontend ${i + 1}` : 'Frontend';

    clack.log.step(chalk.cyan(`${prefix} configuration`));

    // Name
    const nameRes = await clack.text({
      message: `${prefix} - Service name:`,
      placeholder: frontendCount === 1 ? 'frontend' : `frontend-${i + 1}`,
      defaultValue: frontendCount === 1 ? 'frontend' : `frontend-${i + 1}`,
      validate(value) {
        const result = isValidServiceName(value, usedServiceNames);
        if (result !== true) return result;
      },
    });
    if (clack.isCancel(nameRes)) handleCancel();
    const serviceName = nameRes as string;
    usedServiceNames.push(serviceName);

    // Framework
    const frameworkRes = await clack.select<{ value: 'nuxt' | 'vue'; label: string; hint?: string }[], 'nuxt' | 'vue'>({
      message: `${prefix} - Framework:`,
      options: [
        { value: 'nuxt', label: 'Nuxt', hint: 'full-stack Vue framework' },
        { value: 'vue', label: 'Vue', hint: 'SPA with Vite' },
      ],
      initialValue: 'nuxt',
    });
    if (clack.isCancel(frameworkRes)) handleCancel();
    const framework = frameworkRes as 'nuxt' | 'vue';

    // Styling
    const stylingRes = await clack.select<{ value: 'css' | 'sass'; label: string; hint?: string }[], 'css' | 'sass'>({
      message: `${prefix} - Styling:`,
      options: [
        { value: 'css', label: 'Plain CSS' },
        { value: 'sass', label: 'Sass', hint: 'installs sass as dependency' },
      ],
      initialValue: 'css',
    });
    if (clack.isCancel(stylingRes)) handleCancel();
    const styling = stylingRes as 'css' | 'sass';

    // Port
    const portRes = await clack.text({
      message: `${prefix} - Port:`,
      defaultValue: String(defaultPort),
      validate(value) {
        const port = parseInt(value, 10);
        if (isNaN(port)) return 'Enter a valid number';
        const result = isValidPort(port, usedPorts);
        if (result !== true) return result;
      },
    });
    if (clack.isCancel(portRes)) handleCancel();
    const port = parseInt(portRes as string, 10);
    usedPorts.push(port);

    frontends.push({ name: serviceName, framework, styling, port });
  }

  // --- Backend port ---
  const backendPortRes = await clack.text({
    message: 'Backend port:',
    defaultValue: '3001',
    validate(value) {
      const port = parseInt(value, 10);
      if (isNaN(port)) return 'Enter a valid number';
      const result = isValidPort(port, usedPorts);
      if (result !== true) return result;
    },
  });
  if (clack.isCancel(backendPortRes)) handleCancel();
  const backendPort = parseInt(backendPortRes as string, 10);
  usedPorts.push(backendPort);

  // --- Database config ---
  clack.log.step(chalk.cyan('Database configuration'));

  const dbNameRes = await clack.text({
    message: 'Database name:',
    defaultValue: `${finalProjectName.replace(/-/g, '_')}_db`,
    validate(value) {
      if (!value) return 'Name is required';
    },
  });
  if (clack.isCancel(dbNameRes)) handleCancel();
  const dbName = dbNameRes as string;

  const dbUserRes = await clack.text({
    message: 'Database user:',
    defaultValue: 'postgres',
    validate(value) {
      if (!value) return 'User is required';
    },
  });
  if (clack.isCancel(dbUserRes)) handleCancel();
  const dbUser = dbUserRes as string;

  const defaultPassword = generatePassword();
  const dbPasswordRes = await clack.text({
    message: 'Database password:',
    defaultValue: defaultPassword,
    validate(value) {
      if (!value) return 'Password is required';
      if (value.length < 8) return 'Password must be at least 8 characters';
    },
  });
  if (clack.isCancel(dbPasswordRes)) handleCancel();
  const dbPassword = dbPasswordRes as string;

  // --- JWT Secret ---
  const jwtSecret = generateJwtSecret();

  // --- DB Admin tool ---
  clack.log.step(chalk.cyan('DB admin tool'));

  const dbAdminToolRes = await clack.select<{ value: DbAdminTool; label: string; hint?: string }[], DbAdminTool>({
    message: 'Database admin tool:',
    options: [
      { value: 'none', label: 'None' },
      { value: 'pgadmin', label: 'pgAdmin', hint: 'feature-rich interface' },
      { value: 'adminer', label: 'Adminer', hint: 'lightweight and fast' },
    ],
    initialValue: 'none',
  });
  if (clack.isCancel(dbAdminToolRes)) handleCancel();
  const dbAdminTool = dbAdminToolRes as DbAdminTool;

  let dbAdmin: DbAdminConfig | undefined;

  if (dbAdminTool !== 'none') {
    const defaultPort = dbAdminTool === 'pgadmin' ? 5050 : 8080;

    const dbAdminPortRes = await clack.text({
      message: `${dbAdminTool === 'pgadmin' ? 'pgAdmin' : 'Adminer'} port:`,
      defaultValue: String(defaultPort),
      validate(value) {
        const port = parseInt(value, 10);
        if (isNaN(port)) return 'Enter a valid number';
        const result = isValidPort(port, usedPorts);
        if (result !== true) return result;
      },
    });
    if (clack.isCancel(dbAdminPortRes)) handleCancel();
    const dbAdminPort = parseInt(dbAdminPortRes as string, 10);
    usedPorts.push(dbAdminPort);

    if (dbAdminTool === 'pgadmin') {
      const pgAdminEmailRes = await clack.text({
        message: 'pgAdmin email:',
        defaultValue: 'admin@admin.com',
        validate(value) {
          if (!value) return 'Email is required';
        },
      });
      if (clack.isCancel(pgAdminEmailRes)) handleCancel();
      const pgAdminEmail = pgAdminEmailRes as string;

      const defaultPgAdminPassword = generatePassword();
      const pgAdminPasswordRes = await clack.text({
        message: 'pgAdmin password:',
        defaultValue: defaultPgAdminPassword,
        validate(value) {
          if (!value) return 'Password is required';
          if (value.length < 8) return 'Password must be at least 8 characters';
        },
      });
      if (clack.isCancel(pgAdminPasswordRes)) handleCancel();
      const pgAdminPassword = pgAdminPasswordRes as string;

      dbAdmin = { tool: 'pgadmin', port: dbAdminPort, email: pgAdminEmail, password: pgAdminPassword };
    } else {
      dbAdmin = { tool: 'adminer', port: dbAdminPort };
    }
  }

  // --- Build config ---
  const config: ProjectConfig = {
    projectName: finalProjectName,
    frontends,
    backendPort,
    dbName,
    dbUser,
    dbPassword,
    jwtSecret,
    dbAdmin,
  };

  // --- Recap ---
  const frontendLines = config.frontends
    .map(
      (f, i) =>
        `  ${i + 1}. ${f.name} (${f.framework}, ${f.styling}, port ${f.port})`
    )
    .join('\n');

  const dbAdminLabel = config.dbAdmin
    ? `${config.dbAdmin.tool === 'pgadmin' ? 'pgAdmin' : 'Adminer'} (port ${config.dbAdmin.port})`
    : 'None';

  const recap = [
    `${chalk.bold('Project')}      : ${config.projectName}`,
    `${chalk.bold('Frontends')}    :`,
    frontendLines,
    `${chalk.bold('Backend')}      : port ${config.backendPort}`,
    `${chalk.bold('Database')}     :`,
    `  Name         : ${config.dbName}`,
    `  User         : ${config.dbUser}`,
    `  Password     : ${config.dbPassword}`,
    `${chalk.bold('DB Admin')}     : ${dbAdminLabel}`,
  ].join('\n');

  clack.note(recap, 'Summary');

  // --- Confirmation ---
  const confirmRes = await clack.confirm({
    message: 'Generate project?',
    initialValue: true,
  });
  if (clack.isCancel(confirmRes)) handleCancel();

  if (!confirmRes) {
    clack.outro('Generation cancelled.');
    return;
  }

  // --- Scaffold ---
  await scaffold(config, options);

  clack.note(`cd ${config.projectName}\nmake up`, 'Getting started');
  clack.outro(chalk.green('Project generated successfully!'));
}
