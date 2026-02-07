import path from 'path';
import fs from 'fs-extra';
import ejs from 'ejs';

export async function renderTemplateFile(
  templatePath: string,
  outputPath: string,
  data: Record<string, unknown>
): Promise<void> {
  const template = await fs.readFile(templatePath, 'utf-8');
  const rendered = ejs.render(template, data, { filename: templatePath });
  await fs.ensureDir(path.dirname(outputPath));
  await fs.writeFile(outputPath, rendered);
}

export async function copyAndRenderDir(
  templateDir: string,
  outputDir: string,
  data: Record<string, unknown>
): Promise<void> {
  const files = await getAllFiles(templateDir);

  for (const filePath of files) {
    const relativePath = path.relative(templateDir, filePath);
    let outputName = relativePath;

    const isEjs = outputName.endsWith('.ejs');
    if (isEjs) {
      outputName = outputName.slice(0, -4);
    }

    // Rename gitignore → .gitignore (npm strips dotfiles on publish)
    outputName = outputName.replace(/(^|\/)gitignore$/, '$1.gitignore');

    const outputPath = path.join(outputDir, outputName);

    if (isEjs) {
      await renderTemplateFile(filePath, outputPath, data);
    } else {
      await fs.ensureDir(path.dirname(outputPath));
      await fs.copy(filePath, outputPath);
    }
  }
}

async function getAllFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await getAllFiles(fullPath)));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}
