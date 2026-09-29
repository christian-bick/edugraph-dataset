import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {getCliOption} from '../lib/cli.ts';
import {datasetOutDir, isUnionSpec, resolveDatasetDir} from '../lib/dataset-paths.ts';
import {readDatasetSnapshot} from '../lib/dataset-store.ts';
import {auditPublishedImages, auditSnapshotImages, formatDatasetImageAudit} from '../lib/dataset-image-audit.ts';

try {
    const spec = getCliOption(process.argv.slice(2), 'spec');
    if (!spec) throw new Error('Usage: npm run audit:images -- --spec=<module|union>');
    const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
    const datasetDir = datasetOutDir(root, resolveDatasetDir(spec));
    const audit = isUnionSpec(spec)
        ? auditPublishedImages(datasetDir)
        : auditSnapshotImages(readDatasetSnapshot(datasetDir));
    console.log(formatDatasetImageAudit(audit));
    if (audit.issues.length > 0) process.exitCode = 1;
} catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
}
