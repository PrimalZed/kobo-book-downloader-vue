import dotenv from 'dotenv';
import { expand } from 'dotenv-expand';
import fs from 'fs/promises';

const output = expand({
	...dotenv.config({ path: ['.env', '.env.production'], override: true, processEnv: {} }),
	processEnv: {}
});
if (!output.parsed) {
	console.error('dotenv parse failed', output.error);
	process.exit(1);
}

const bundledEnv = Object.entries(output.parsed!)
	.reduce(
		(acc, [key, value], index, source) => acc
			+ `${key}=${value}`
			+ (index !== source.length - 1 ? '\r\n' : ''),
		''
	);

await fs.writeFile('dist/.env', bundledEnv);
