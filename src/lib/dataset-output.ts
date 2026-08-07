import {
    cpSync,
    existsSync,
    mkdirSync,
    readFileSync,
    readdirSync,
    renameSync,
    rmSync,
    writeFileSync
} from 'node:fs';
import { basename, dirname, resolve } from 'node:path';

export interface DatasetRow {
    file_name: string;
    sample_key: string;
    generator: string;
    view: string;
    [key: string]: unknown;
}

export interface DatasetGenerationScope {
    generatorIds: string[];
    viewIds?: string[];
    fullDataset: boolean;
}

export interface DatasetTransaction {
    stagingDir: string;
    commit(): void;
    rollback(): void;
}

function readJsonLines(path: string): DatasetRow[] {
    if (!existsSync(path)) return [];
    return readFileSync(path, 'utf-8')
        .split('\n')
        .filter(line => line.trim() !== '')
        .map(line => JSON.parse(line) as DatasetRow);
}

function writeJsonLines(path: string, rows: DatasetRow[]): void {
    mkdirSync(dirname(path), { recursive: true });
    const content = rows.length > 0
        ? `${rows.map(row => JSON.stringify(row)).join('\n')}\n`
        : '';
    writeFileSync(path, content, 'utf-8');
}

function removeViews(moduleDir: string, viewIds: Set<string>): void {
    if (!existsSync(moduleDir)) return;
    const metadataPath = resolve(moduleDir, '.metadata.jsonl');
    const rows = readJsonLines(metadataPath);
    const removed = rows.filter(row => viewIds.has(row.view));
    const preserved = rows.filter(row => !viewIds.has(row.view));

    for (const row of removed) {
        const imagePath = resolve(moduleDir, basename(row.file_name));
        if (existsSync(imagePath)) rmSync(imagePath, { force: true });
    }

    if (preserved.length === 0) {
        rmSync(moduleDir, { recursive: true, force: true });
    } else {
        writeJsonLines(metadataPath, preserved);
    }
}

function clearScope(stagingDir: string, scope: DatasetGenerationScope): void {
    if (scope.fullDataset) return;
    const viewIds = scope.viewIds ? new Set(scope.viewIds) : null;

    for (const splitDirName of ['train', 'validation']) {
        for (const generatorId of scope.generatorIds) {
            const moduleDir = resolve(stagingDir, splitDirName, generatorId);
            if (viewIds) removeViews(moduleDir, viewIds);
            else rmSync(moduleDir, { recursive: true, force: true });
        }
    }
}

export function beginDatasetTransaction(
    datasetDir: string,
    scope: DatasetGenerationScope,
    transactionId = `${process.pid}-${Date.now()}`
): DatasetTransaction {
    const parentDir = dirname(datasetDir);
    const datasetName = basename(datasetDir);
    const stagingDir = resolve(parentDir, `.${datasetName}.staging-${transactionId}`);
    const backupDir = resolve(parentDir, `.${datasetName}.backup-${transactionId}`);

    rmSync(stagingDir, { recursive: true, force: true });
    rmSync(backupDir, { recursive: true, force: true });
    mkdirSync(parentDir, { recursive: true });

    if (!scope.fullDataset && existsSync(datasetDir)) {
        cpSync(datasetDir, stagingDir, { recursive: true });
    } else {
        mkdirSync(stagingDir, { recursive: true });
    }
    clearScope(stagingDir, scope);
    rmSync(resolve(stagingDir, 'validation-report.md'), { force: true });
    rmSync(resolve(stagingDir, 'validation-reports'), { recursive: true, force: true });

    let finished = false;
    return {
        stagingDir,
        commit() {
            if (finished) throw new Error('Dataset transaction is already finished.');
            let movedExisting = false;
            try {
                if (existsSync(datasetDir)) {
                    renameSync(datasetDir, backupDir);
                    movedExisting = true;
                }
                renameSync(stagingDir, datasetDir);
                finished = true;
                try {
                    rmSync(backupDir, { recursive: true, force: true });
                } catch {
                    // The new dataset is already committed. A locked backup is
                    // recoverable and can be cleaned by the next transaction.
                }
            } catch (error) {
                if (movedExisting && !existsSync(datasetDir) && existsSync(backupDir)) {
                    renameSync(backupDir, datasetDir);
                }
                throw error;
            }
        },
        rollback() {
            if (finished) return;
            rmSync(stagingDir, { recursive: true, force: true });
            rmSync(backupDir, { recursive: true, force: true });
            finished = true;
        }
    };
}

export function mergeModuleMetadata(moduleDir: string, rows: DatasetRow[]): void {
    const metadataPath = resolve(moduleDir, '.metadata.jsonl');
    const merged = new Map<string, DatasetRow>();
    for (const row of readJsonLines(metadataPath)) merged.set(row.sample_key, row);
    for (const row of rows) merged.set(row.sample_key, row);
    writeJsonLines(
        metadataPath,
        [...merged.values()].sort((a, b) => a.file_name.localeCompare(b.file_name))
    );
}

export function finalizeDatasetMetadata(datasetDir: string, splitDirName: string): void {
    const splitDir = resolve(datasetDir, splitDirName);
    if (!existsSync(splitDir)) return;

    const rows: DatasetRow[] = [];
    const modules = readdirSync(splitDir, { withFileTypes: true })
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name)
        .sort();

    for (const moduleName of modules) {
        const moduleRows = readJsonLines(resolve(splitDir, moduleName, '.metadata.jsonl'));
        rows.push(...moduleRows.map(row => ({
            ...row,
            file_name: `${moduleName}/${basename(row.file_name)}`
        })));
    }

    writeJsonLines(resolve(splitDir, 'metadata.jsonl'), rows);
}
