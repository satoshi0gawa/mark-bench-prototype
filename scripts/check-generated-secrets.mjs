import { readFile, readdir } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const TEXT_EXTENSIONS = new Set(['.css', '.html', '.js', '.json', '.map', '.svg', '.txt', '.xml']);
const FORBIDDEN_MARKERS = ['MICROCMS_API_KEY'];

const isUsableSecret = (value) => {
  const normalized = String(value ?? '').trim();
  return normalized.length >= 8 && !/^(?:your-|example|replace-me)/i.test(normalized);
};

const collectTextFiles = async (directory) => {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collectTextFiles(path));
    if (entry.isFile() && TEXT_EXTENSIONS.has(extname(entry.name).toLowerCase())) files.push(path);
  }
  return files;
};

export const checkGeneratedSecrets = async (outputDirectory, options = {}) => {
  const output = resolve(outputDirectory);
  const secrets = options.secrets || {
    MICROCMS_API_KEY: process.env.MICROCMS_API_KEY,
  };
  const exactSecrets = Object.entries(secrets).filter(([, value]) => isUsableSecret(value));
  const leaks = [];
  const files = await collectTextFiles(output);

  for (const file of files) {
    const source = await readFile(file, 'utf8');
    for (const marker of FORBIDDEN_MARKERS) {
      if (source.includes(marker)) leaks.push(`${file}: forbidden credential marker ${marker}`);
    }
    for (const [name, value] of exactSecrets) {
      if (source.includes(String(value).trim())) leaks.push(`${file}: value from ${name}`);
    }
  }

  if (leaks.length) {
    throw new Error(`Generated output contains secret material:\n${leaks.map((leak) => `- ${leak}`).join('\n')}`);
  }

  return { files: files.length, secrets: exactSecrets.length };
};

const isDirectRun = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) {
  const target = resolve(process.cwd(), process.argv[2] || 'dist');
  const result = await checkGeneratedSecrets(target);
  console.log(`Secret scan passed: ${result.files} generated text files checked in ${target}.`);
}
