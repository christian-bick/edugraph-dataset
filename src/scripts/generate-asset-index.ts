import { mkdirSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { buildAssetIndexBundle } from '../lib/asset-index-builder.ts';

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = process.argv.slice(2);
const readOption = (name: string): string | undefined =>
    args.find(arg => arg.startsWith(`--${name}=`))?.slice(name.length + 3);

const requireOption = (name: string): string => {
    const value = readOption(name);
    if (!value) throw new Error(`Missing required --${name}=<value>.`);
    return value;
};
const outputPath = resolve(PROJECT_ROOT, requireOption('output'));
const repository = readOption('repository') ?? 'christian-bick/edugraph-exercises';
const revision = requireOption('revision');

async function main(): Promise<void> {
    const { index } = await buildAssetIndexBundle({
        projectRoot: PROJECT_ROOT,
        repository,
        revision,
        requireMergedUnion: true,
    });

    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, `${JSON.stringify(index, null, 2)}\n`, 'utf-8');

    console.log(`Asset index: ${outputPath}`);
    console.log(`Dataset:     ${repository}@${revision}`);
    console.log(`Label sets:  ${index.label_sets.length}`);
    console.log(`Samples:     ${index.label_sets.reduce((sum, group) => sum + group.samples.length, 0)}`);
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
