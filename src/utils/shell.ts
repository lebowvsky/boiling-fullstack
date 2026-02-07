import execa from 'execa';
import chalk from 'chalk';

let verbose = false;

export function setVerbose(v: boolean): void {
  verbose = v;
}

export async function runCommand(
  command: string,
  args: string[],
  cwd: string
): Promise<void> {
  try {
    await execa(command, args, { cwd, stdio: verbose ? 'inherit' : 'ignore' });
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      throw new Error(
        `Commande "${command}" introuvable. Vérifiez qu'elle est installée et accessible dans votre PATH.`
      );
    }
    throw new Error(
      `Échec de la commande "${command} ${args.join(' ')}" : ${error.shortMessage || error.message}`
    );
  }
}

export async function checkCommand(cmd: string): Promise<boolean> {
  try {
    await execa(cmd, ['--version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

export async function checkEnvironment(): Promise<void> {
  const hasGit = await checkCommand('git');
  if (!hasGit) {
    throw new Error(
      'git est requis mais introuvable. Installez git avant de continuer.'
    );
  }

  const hasDocker = await checkCommand('docker');
  if (!hasDocker) {
    console.warn(
      chalk.yellow('⚠ docker non détecté. Le projet sera généré mais "make up" nécessite Docker.')
    );
  }
}

export async function gitInit(cwd: string): Promise<void> {
  await runCommand('git', ['init'], cwd);
}

export async function npmInstall(cwd: string): Promise<void> {
  await runCommand('npm', ['install'], cwd);
}
