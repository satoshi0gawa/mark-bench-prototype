import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { checkGeneratedSecrets } from './check-generated-secrets.mjs';

const directory = await mkdtemp(join(tmpdir(), 'mark-bench-secret-check-'));
const secret = 'test-secret-value-123456';

try {
  await writeFile(
    join(directory, 'safe.html'),
    '<p>公開可能な生成物</p><code>X-MICROCMS-API-KEY</code>',
  );
  await checkGeneratedSecrets(directory, { secrets: { MICROCMS_API_KEY: secret } });

  await writeFile(join(directory, 'unsafe.js'), `const leaked = ${JSON.stringify(secret)};`);
  await assert.rejects(
    () => checkGeneratedSecrets(directory, { secrets: { MICROCMS_API_KEY: secret } }),
    (error) => {
      assert.match(error.message, /value from MICROCMS_API_KEY/);
      assert.doesNotMatch(error.message, new RegExp(secret));
      return true;
    },
  );

  await writeFile(join(directory, 'unsafe.js'), 'const key = process.env.MICROCMS_API_KEY;');
  await assert.rejects(() => checkGeneratedSecrets(directory, { secrets: {} }), /forbidden credential marker/);
} finally {
  await rm(directory, { recursive: true, force: true });
}

console.log('Generated-secret scanner validation passed: public header names are allowed, while exact values and environment credential markers are rejected.');
