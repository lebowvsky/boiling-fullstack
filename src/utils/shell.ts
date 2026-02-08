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
        `Command "${command}" not found. Make sure it is installed and available in your PATH.`
      );
    }
    throw new Error(
      `Command "${command} ${args.join(' ')}" failed: ${error.shortMessage || error.message}`
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
      'git is required but was not found. Please install git before continuing.'
    );
  }

  const hasDocker = await checkCommand('docker');
  if (!hasDocker) {
    console.warn(
      chalk.yellow('⚠ docker not found. The project will be generated but "make up" requires Docker.')
    );
  }
}

export async function gitInit(cwd: string): Promise<void> {
  await runCommand('git', ['init'], cwd);
}

export async function npmInstall(cwd: string): Promise<void> {
  await runCommand('npm', ['install'], cwd);
}
