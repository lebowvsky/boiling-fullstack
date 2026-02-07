import * as clack from '@clack/prompts';
import chalk from 'chalk';
import type { FrontendConfig, ProjectConfig } from './types';
import {
  isValidProjectName,
  isValidServiceName,
  isValidPort,
  generatePassword,
  generateJwtSecret,
} from './utils/validation';
import { scaffold } from './scaffolder';

function handleCancel(): never {
  clack.cancel('Opération annulée.');
  process.exit(0);
}

export async function runCli(projectName?: string): Promise<void> {
  clack.intro(chalk.bgCyan.black(' boiling-fullstack '));

  // --- Project name ---
  const nameResult = await clack.text({
    message: 'Nom du projet :',
    placeholder: 'mon-projet',
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
    message: 'Nombre de frontends (1-5) :',
    defaultValue: '1',
    validate(value) {
      const n = parseInt(value, 10);
      if (isNaN(n) || n < 1 || n > 5) return 'Entrez un nombre entre 1 et 5';
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

    clack.log.step(chalk.cyan(`Configuration ${prefix}`));

    // Name
    const nameRes = await clack.text({
      message: `${prefix} - Nom du service :`,
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
      message: `${prefix} - Framework :`,
      options: [
        { value: 'nuxt', label: 'Nuxt', hint: 'full-stack Vue framework' },
        { value: 'vue', label: 'Vue', hint: 'SPA avec Vite' },
      ],
      initialValue: 'nuxt',
    });
    if (clack.isCancel(frameworkRes)) handleCancel();
    const framework = frameworkRes as 'nuxt' | 'vue';

    // Styling
    const stylingRes = await clack.select<{ value: 'css' | 'sass'; label: string; hint?: string }[], 'css' | 'sass'>({
      message: `${prefix} - Styling :`,
      options: [
        { value: 'css', label: 'CSS natif' },
        { value: 'sass', label: 'Sass', hint: 'installe sass en dépendance' },
      ],
      initialValue: 'css',
    });
    if (clack.isCancel(stylingRes)) handleCancel();
    const styling = stylingRes as 'css' | 'sass';

    // Port
    const portRes = await clack.text({
      message: `${prefix} - Port :`,
      defaultValue: String(defaultPort),
      validate(value) {
        const port = parseInt(value, 10);
        if (isNaN(port)) return 'Entrez un nombre valide';
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
    message: 'Port du backend :',
    defaultValue: '3001',
    validate(value) {
      const port = parseInt(value, 10);
      if (isNaN(port)) return 'Entrez un nombre valide';
      const result = isValidPort(port, usedPorts);
      if (result !== true) return result;
    },
  });
  if (clack.isCancel(backendPortRes)) handleCancel();
  const backendPort = parseInt(backendPortRes as string, 10);
  usedPorts.push(backendPort);

  // --- Database config ---
  clack.log.step(chalk.cyan('Configuration de la base de données'));

  const dbNameRes = await clack.text({
    message: 'Nom de la base de données :',
    defaultValue: `${finalProjectName.replace(/-/g, '_')}_db`,
    validate(value) {
      if (!value) return 'Le nom est requis';
    },
  });
  if (clack.isCancel(dbNameRes)) handleCancel();
  const dbName = dbNameRes as string;

  const dbUserRes = await clack.text({
    message: 'Utilisateur de la base de données :',
    defaultValue: 'postgres',
    validate(value) {
      if (!value) return "L'utilisateur est requis";
    },
  });
  if (clack.isCancel(dbUserRes)) handleCancel();
  const dbUser = dbUserRes as string;

  const defaultPassword = generatePassword();
  const dbPasswordRes = await clack.text({
    message: 'Mot de passe de la base de données :',
    defaultValue: defaultPassword,
    validate(value) {
      if (!value) return 'Le mot de passe est requis';
      if (value.length < 8) return 'Le mot de passe doit faire au moins 8 caractères';
    },
  });
  if (clack.isCancel(dbPasswordRes)) handleCancel();
  const dbPassword = dbPasswordRes as string;

  // --- JWT Secret ---
  const jwtSecret = generateJwtSecret();

  // --- Build config ---
  const config: ProjectConfig = {
    projectName: finalProjectName,
    frontends,
    backendPort,
    dbName,
    dbUser,
    dbPassword,
    jwtSecret,
  };

  // --- Recap ---
  const frontendLines = config.frontends
    .map(
      (f, i) =>
        `  ${i + 1}. ${f.name} (${f.framework}, ${f.styling}, port ${f.port})`
    )
    .join('\n');

  const recap = [
    `${chalk.bold('Projet')}       : ${config.projectName}`,
    `${chalk.bold('Frontends')}    :`,
    frontendLines,
    `${chalk.bold('Backend')}      : port ${config.backendPort}`,
    `${chalk.bold('Base de données')}:`,
    `  Nom          : ${config.dbName}`,
    `  Utilisateur  : ${config.dbUser}`,
    `  Mot de passe : ${config.dbPassword}`,
  ].join('\n');

  clack.note(recap, 'Récapitulatif');

  // --- Confirmation ---
  const confirmRes = await clack.confirm({
    message: 'Générer le projet ?',
    initialValue: true,
  });
  if (clack.isCancel(confirmRes)) handleCancel();

  if (!confirmRes) {
    clack.outro('Génération annulée.');
    return;
  }

  // --- Scaffold ---
  await scaffold(config);

  clack.outro(chalk.green('Projet généré avec succès !'));
}
