import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { type RollupOptions } from 'rollup';
import typescript from 'rollup-plugin-typescript2';

export default {
	input: 'index.ts',
	output: {
		file: 'dist/index.js',
	},
	plugins: [
		commonjs(),
		nodeResolve(),
		json(),
		typescript({ tsconfig: 'tsconfig.node.json' }),
	],
} satisfies RollupOptions;
