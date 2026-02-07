import execa from 'execa';

export async function runCommand(
  command: string,
  args: string[],
  cwd: string
): Promise<void> {
  await execa(command, args, { cwd, stdio: 'ignore' });
}

export async function gitInit(cwd: string): Promise<void> {
  await runCommand('git', ['init'], cwd);
}

export async function npmInstall(cwd: string): Promise<void> {
  await runCommand('npm', ['install'], cwd);
}
