import {randomUUID} from 'node:crypto';
import {
    copyFileSync,
    existsSync,
    mkdirSync,
    openSync,
    closeSync,
    readFileSync,
    readdirSync,
    renameSync,
    rmSync,
    writeFileSync
} from 'node:fs';
import {basename, dirname, resolve} from 'node:path';
import {digestContent, digestFile, digestIdentity, radixSortUtf8} from './content-identity.ts';
import {SPLIT_DIRS, type SampleSplit} from './generation.ts';

export const DATASET_STORE_SCHEMA_VERSION = 1;

export interface StoredDatasetRow {
    file_name: string;
    sample_key: string;
    generator: string;
    view: string;
    [key: string]: unknown;
}

export interface DatasetShardFile {
    name: string;
    sha256: string;
    bytes: number;
}

export interface DatasetShardReference {
    key: string;
    split: SampleSplit;
    generator: string;
    view: string;
    row_count: number;
}

interface DatasetShardManifest extends DatasetShardReference {
    schema_version: number;
    complete: true;
    rows: StoredDatasetRow[];
    files: Record<string, DatasetShardFile>;
}

interface DatasetGenerationManifest {
    schema_version: number;
    generation_id: string;
    complete: true;
    shards: Record<string, DatasetShardReference>;
    build_manifest: unknown;
}

interface DatasetPointer {
    schema_version: number;
    generation_id: string;
    generation_sha256: string;
    generation_bytes: number;
    complete: true;
}

export interface DatasetStoreScope {
    fullDataset: boolean;
    generatorIds: string[];
    viewIds?: string[];
    /** Exact generator/view execution units; takes precedence over cartesian filters. */
    pairKeys?: string[];
}

export interface DatasetStoreStats {
    shards_written: number;
    shards_reused: number;
    image_bytes_written: number;
    rows_read: number;
}

export interface DatasetIntegrityReport {
    files_verified: number;
    bytes_read: number;
    issues: string[];
}

export interface DatasetSnapshot {
    readonly datasetDir: string;
    readonly generationId: string | null;
    readonly buildManifest: unknown;
    readonly shardReferences: Readonly<Record<string, DatasetShardReference>>;
    rows(split: SampleSplit): StoredDatasetRow[];
    imagePath(split: SampleSplit, sampleKey: string): string;
    imageIdentity(split: SampleSplit, sampleKey: string): Readonly<{sha256: string; bytes: number}>;
}

export interface DatasetStoreTransaction {
    stagingDir: string;
    prepare(): DatasetSnapshot;
    commit(buildManifest: unknown): void;
    rollback(): void;
    stats(): Readonly<DatasetStoreStats>;
}

const json = (value: unknown): string => `${JSON.stringify(value, null, 2)}\n`;
const shardRefKey = (generator: string, view: string, split: SampleSplit): string =>
    `${generator}#${view}#${split}`;

function storeDir(datasetDir: string): string {
    return resolve(dirname(datasetDir), '.dataset-store', basename(datasetDir));
}

function generationPath(datasetDir: string, generationId: string): string {
    return resolve(storeDir(datasetDir), 'generations', `${generationId}.json`);
}

function shardDir(datasetDir: string, key: string): string {
    if (!/^[a-f\d]{64}$/.test(key)) throw new Error(`Invalid dataset shard key: ${key}.`);
    return resolve(storeDir(datasetDir), 'shards', key);
}

function readJsonLines(path: string): StoredDatasetRow[] {
    if (!existsSync(path)) return [];
    return readFileSync(path, 'utf-8')
        .split('\n')
        .filter(line => line.trim() !== '')
        .map(line => JSON.parse(line) as StoredDatasetRow);
}

function readLegacySplit(datasetDir: string, split: SampleSplit): StoredDatasetRow[] {
    const splitDir = resolve(datasetDir, SPLIT_DIRS[split]);
    const rootMetadata = resolve(splitDir, 'metadata.jsonl');
    if (existsSync(rootMetadata)) return readJsonLines(rootMetadata);
    if (!existsSync(splitDir)) return [];
    const modules = readdirSync(splitDir, {withFileTypes: true})
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name);
    return radixSortUtf8(modules)
        .flatMap(moduleName => readJsonLines(resolve(splitDir, moduleName, '.metadata.jsonl'))
            .map(row => ({...row, file_name: `${moduleName}/${row.file_name}`})));
}

function readShard(datasetDir: string, reference: DatasetShardReference): DatasetShardManifest {
    const directory = shardDir(datasetDir, reference.key);
    const path = resolve(directory, 'manifest.json');
    if (!existsSync(path)) throw new Error(`Dataset shard ${reference.key} is missing.`);
    const manifest = JSON.parse(readFileSync(path, 'utf-8')) as DatasetShardManifest;
    if (manifest.schema_version !== DATASET_STORE_SCHEMA_VERSION
        || manifest.complete !== true
        || manifest.key !== reference.key
        || manifest.split !== reference.split
        || manifest.generator !== reference.generator
        || manifest.view !== reference.view
        || manifest.row_count !== manifest.rows.length) {
        throw new Error(`Dataset shard ${reference.key} has an invalid manifest.`);
    }
    const expectedKey = digestIdentity({
        split: manifest.split,
        generator: manifest.generator,
        view: manifest.view,
        rows: manifest.rows,
        files: manifest.files
    });
    if (expectedKey !== reference.key) {
        throw new Error(`Dataset shard ${reference.key} failed manifest identity verification.`);
    }
    return manifest;
}

function verifyShardFiles(datasetDir: string, manifest: DatasetShardManifest): void {
    const directory = shardDir(datasetDir, manifest.key);
    for (const file of Object.values(manifest.files)) {
        const path = resolve(directory, file.name);
        if (!existsSync(path)) throw new Error(`Dataset shard ${manifest.key} is missing ${file.name}.`);
        const digest = digestFile(path);
        if (digest.sha256 !== file.sha256 || digest.bytes !== file.bytes) {
            throw new Error(`Dataset shard ${manifest.key} has a corrupt file: ${file.name}.`);
        }
    }
}

function snapshotFrom(
    datasetDir: string,
    generationId: string | null,
    buildManifest: unknown,
    references: Record<string, DatasetShardReference>
): DatasetSnapshot {
    const shardCache = new Map<string, DatasetShardManifest>();
    const rowsCache = new Map<SampleSplit, StoredDatasetRow[]>();
    const imagePaths = new Map<string, string>();
    const imageIdentities = new Map<string, DatasetShardFile>();
    const indexedSplits = new Set<SampleSplit>();
    const referencesBySplit = new Map<SampleSplit, DatasetShardReference[]>();
    for (const split of Object.keys(SPLIT_DIRS) as SampleSplit[]) {
        referencesBySplit.set(split, radixSortUtf8(Object.keys(references))
            .map(key => references[key])
            .filter(reference => reference.split === split));
    }
    const loadShard = (reference: DatasetShardReference): DatasetShardManifest => {
        const cached = shardCache.get(reference.key);
        if (cached) return cached;
        const manifest = readShard(datasetDir, reference);
        shardCache.set(reference.key, manifest);
        for (const row of manifest.rows) {
            const file = manifest.files[row.sample_key];
            if (!file) throw new Error(`Dataset shard ${reference.key} has no file for ${row.sample_key}.`);
            const lookup = `${reference.split}\0${row.sample_key}`;
            if (imagePaths.has(lookup)) throw new Error(`Duplicate dataset sample key: ${row.sample_key}.`);
            imagePaths.set(lookup, resolve(shardDir(datasetDir, reference.key), file.name));
            imageIdentities.set(lookup, file);
        }
        return manifest;
    };
    const indexSplit = (split: SampleSplit): void => {
        if (indexedSplits.has(split)) return;
        for (const reference of referencesBySplit.get(split) ?? []) loadShard(reference);
        indexedSplits.add(split);
    };
    return {
        datasetDir,
        generationId,
        buildManifest,
        shardReferences: references,
        rows(split) {
            const cached = rowsCache.get(split);
            if (cached) return cached;
            indexSplit(split);
            const rows = (referencesBySplit.get(split) ?? [])
                .flatMap(reference => shardCache.get(reference.key)!.rows);
            rowsCache.set(split, rows);
            return rows;
        },
        imagePath(split, sampleKey) {
            const lookup = `${split}\0${sampleKey}`;
            const cached = imagePaths.get(lookup);
            if (cached) return cached;
            indexSplit(split);
            const resolved = imagePaths.get(lookup);
            if (resolved) return resolved;
            throw new Error(`Dataset image is not indexed for ${sampleKey}.`);
        },
        imageIdentity(split, sampleKey) {
            const lookup = `${split}\0${sampleKey}`;
            indexSplit(split);
            const identity = imageIdentities.get(lookup);
            if (!identity) throw new Error(`Dataset image identity is not indexed for ${sampleKey}.`);
            return {sha256: identity.sha256, bytes: identity.bytes};
        }
    };
}

function legacySnapshot(datasetDir: string): DatasetSnapshot {
    const rowsBySplit = new Map<SampleSplit, StoredDatasetRow[]>();
    const pathsBySample = new Map<string, string>();
    for (const split of Object.keys(SPLIT_DIRS) as SampleSplit[]) {
        const rows = readLegacySplit(datasetDir, split);
        rowsBySplit.set(split, rows);
        for (const row of rows) {
            pathsBySample.set(`${split}\0${row.sample_key}`, resolve(datasetDir, SPLIT_DIRS[split], row.file_name));
        }
    }
    const buildManifestPath = resolve(datasetDir, 'manifest.json');
    return {
        datasetDir,
        generationId: null,
        buildManifest: existsSync(buildManifestPath)
            ? JSON.parse(readFileSync(buildManifestPath, 'utf-8'))
            : null,
        shardReferences: {},
        rows: split => rowsBySplit.get(split) ?? [],
        imagePath: (split, sampleKey) => {
            const path = pathsBySample.get(`${split}\0${sampleKey}`);
            if (!path) throw new Error(`Legacy dataset image is not indexed for ${sampleKey}.`);
            return path;
        },
        imageIdentity: (split, sampleKey) => {
            const path = pathsBySample.get(`${split}\0${sampleKey}`);
            if (!path) throw new Error(`Legacy dataset image identity is not indexed for ${sampleKey}.`);
            return digestFile(path);
        }
    };
}

export function readDatasetSnapshot(datasetDir: string): DatasetSnapshot {
    const pointerPath = resolve(datasetDir, 'current.json');
    if (!existsSync(pointerPath)) return legacySnapshot(datasetDir);
    const pointer = JSON.parse(readFileSync(pointerPath, 'utf-8')) as DatasetPointer;
    if (pointer.schema_version !== DATASET_STORE_SCHEMA_VERSION || pointer.complete !== true) {
        throw new Error(`Dataset pointer at ${datasetDir} is unsupported or incomplete.`);
    }
    const path = generationPath(datasetDir, pointer.generation_id);
    if (!existsSync(path)) throw new Error(`Dataset generation ${pointer.generation_id} is missing.`);
    const content = readFileSync(path);
    const digest = digestContent(content);
    if (digest.sha256 !== pointer.generation_sha256 || digest.bytes !== pointer.generation_bytes) {
        throw new Error(`Dataset generation ${pointer.generation_id} failed pointer integrity verification.`);
    }
    const generation = JSON.parse(content.toString('utf-8')) as DatasetGenerationManifest;
    if (generation.schema_version !== DATASET_STORE_SCHEMA_VERSION
        || generation.complete !== true
        || generation.generation_id !== pointer.generation_id) {
        throw new Error(`Dataset generation ${pointer.generation_id} is unsupported or incomplete.`);
    }
    return snapshotFrom(datasetDir, generation.generation_id, generation.build_manifest, generation.shards);
}

/** Verifies every live image exactly once; intended for release/audit gates, not cache-hit VQA. */
export function verifyDatasetSnapshotIntegrity(snapshot: DatasetSnapshot): DatasetIntegrityReport {
    let filesVerified = 0;
    let bytesRead = 0;
    const issues: string[] = [];
    for (const split of Object.keys(SPLIT_DIRS) as SampleSplit[]) {
        for (const row of snapshot.rows(split)) {
            try {
                const expected = snapshot.imageIdentity(split, row.sample_key);
                const actual = digestFile(snapshot.imagePath(split, row.sample_key));
                filesVerified++;
                bytesRead += actual.bytes;
                if (actual.sha256 !== expected.sha256 || actual.bytes !== expected.bytes) {
                    issues.push(`Image integrity mismatch for ${row.sample_key}.`);
                }
            } catch (error) {
                issues.push(error instanceof Error ? error.message : String(error));
            }
        }
    }
    return {files_verified: filesVerified, bytes_read: bytesRead, issues};
}

function selectedRows(stagingDir: string): Array<{split: SampleSplit; row: StoredDatasetRow}> {
    return (Object.keys(SPLIT_DIRS) as SampleSplit[]).flatMap(split =>
        readJsonLines(resolve(stagingDir, SPLIT_DIRS[split], 'metadata.jsonl'))
            .map(row => ({split, row}))
    );
}

function admitShard(options: {
    datasetDir: string;
    stagingDir: string;
    split: SampleSplit;
    generator: string;
    view: string;
    rows: StoredDatasetRow[];
    stats: DatasetStoreStats;
}): DatasetShardReference {
    const files: Record<string, DatasetShardFile> = {};
    const fileSources = new Map<string, string>();
    for (const row of options.rows) {
        const source = resolve(options.stagingDir, SPLIT_DIRS[options.split], row.file_name);
        if (!existsSync(source)) throw new Error(`Generated dataset image is missing: ${source}.`);
        const digest = digestFile(source);
        const name = basename(row.file_name);
        files[row.sample_key] = {name, sha256: digest.sha256, bytes: digest.bytes};
        fileSources.set(row.sample_key, source);
    }
    const key = digestIdentity({
        split: options.split,
        generator: options.generator,
        view: options.view,
        rows: options.rows,
        files
    });
    const reference: DatasetShardReference = {
        key,
        split: options.split,
        generator: options.generator,
        view: options.view,
        row_count: options.rows.length
    };
    const destination = shardDir(options.datasetDir, key);
    if (existsSync(destination)) {
        verifyShardFiles(options.datasetDir, readShard(options.datasetDir, reference));
        options.stats.shards_reused++;
        return reference;
    }

    const parent = dirname(destination);
    mkdirSync(parent, {recursive: true});
    const stage = resolve(parent, `${key}.stage-${process.pid}-${randomUUID()}`);
    mkdirSync(stage);
    try {
        for (const row of options.rows) {
            const file = files[row.sample_key];
            copyFileSync(fileSources.get(row.sample_key)!, resolve(stage, file.name));
            options.stats.image_bytes_written += file.bytes;
        }
        const manifest: DatasetShardManifest = {
            schema_version: DATASET_STORE_SCHEMA_VERSION,
            complete: true,
            ...reference,
            rows: options.rows,
            files
        };
        writeFileSync(resolve(stage, 'manifest.json'), json(manifest), 'utf-8');
        try {
            renameSync(stage, destination);
            options.stats.shards_written++;
        } catch (error) {
            if (!existsSync(destination)) throw error;
            options.stats.shards_reused++;
        }
    } finally {
        rmSync(stage, {recursive: true, force: true});
    }
    return reference;
}

export function beginDatasetStoreTransaction(
    datasetDir: string,
    scope: DatasetStoreScope,
    transactionId = `${process.pid}-${Date.now()}-${randomUUID().slice(0, 8)}`
): DatasetStoreTransaction {
    const parent = dirname(datasetDir);
    const stagingDir = resolve(parent, `.${basename(datasetDir)}.render-${transactionId}`);
    const pointerStage = resolve(parent, `.${basename(datasetDir)}.pointer-${transactionId}`);
    const backup = resolve(parent, `.${basename(datasetDir)}.backup-${transactionId}`);
    const lockPath = resolve(storeDir(datasetDir), 'writer.lock');
    mkdirSync(storeDir(datasetDir), {recursive: true});
    let lock: number;
    try {
        lock = openSync(lockPath, 'wx');
    } catch {
        throw new Error(`Another dataset writer holds ${lockPath}.`);
    }
    let previous: DatasetSnapshot;
    try {
        mkdirSync(stagingDir, {recursive: true});
        previous = readDatasetSnapshot(datasetDir);
        if (!scope.fullDataset
            && previous.generationId === null
            && (previous.rows('train').length > 0 || previous.rows('val').length > 0)) {
            throw new Error('A legacy dataset must be migrated with one full generation before scoped shard replacement.');
        }
    } catch (error) {
        rmSync(stagingDir, {recursive: true, force: true});
        closeSync(lock);
        rmSync(lockPath, {force: true});
        throw error;
    }
    const stats: DatasetStoreStats = {
        shards_written: 0,
        shards_reused: 0,
        image_bytes_written: 0,
        rows_read: 0
    };
    let candidate: DatasetSnapshot | null = null;
    let finished = false;
    const selectedGenerators = new Set(scope.generatorIds);
    const selectedViews = scope.viewIds ? new Set(scope.viewIds) : null;
    const selectedPairs = scope.pairKeys ? new Set(scope.pairKeys) : null;
    const isSelected = (reference: DatasetShardReference): boolean => scope.fullDataset
        || (selectedPairs
            ? selectedPairs.has(`${reference.generator}#${reference.view}`)
            : selectedGenerators.has(reference.generator)
            && (!selectedViews || selectedViews.has(reference.view)));

    const release = () => {
        try {
            closeSync(lock);
        } finally {
            rmSync(lockPath, {force: true});
        }
    };

    return {
        stagingDir,
        prepare() {
            if (candidate) return candidate;
            const references: Record<string, DatasetShardReference> = {};
            if (!scope.fullDataset) {
                for (const [key, reference] of Object.entries(previous.shardReferences)) {
                    if (!isSelected(reference)) references[key] = reference;
                }
            }
            const groups = new Map<string, {split: SampleSplit; generator: string; view: string; rows: StoredDatasetRow[]}>();
            for (const {split, row} of selectedRows(stagingDir)) {
                stats.rows_read++;
                const key = shardRefKey(row.generator, row.view, split);
                const group = groups.get(key);
                if (group) group.rows.push(row);
                else groups.set(key, {split, generator: row.generator, view: row.view, rows: [row]});
            }
            for (const key of radixSortUtf8([...groups.keys()])) {
                const group = groups.get(key)!;
                references[key] = admitShard({
                    datasetDir,
                    stagingDir,
                    split: group.split,
                    generator: group.generator,
                    view: group.view,
                    rows: group.rows,
                    stats
                });
            }
            stats.shards_reused += Object.keys(references).length - groups.size;
            candidate = snapshotFrom(datasetDir, null, null, references);
            return candidate;
        },
        commit(buildManifest) {
            if (finished) throw new Error('Dataset store transaction is already finished.');
            const prepared = this.prepare();
            const shardKeys = radixSortUtf8(Object.keys(prepared.shardReferences));
            const generationCore = {
                schema_version: DATASET_STORE_SCHEMA_VERSION,
                complete: true as const,
                shards: Object.fromEntries(shardKeys.map(key => [key, prepared.shardReferences[key]])),
                build_manifest: buildManifest
            };
            const generationId = digestIdentity(generationCore);
            const generation: DatasetGenerationManifest = {
                ...generationCore,
                generation_id: generationId
            };
            const generationContent = json(generation);
            const generationDigest = digestContent(generationContent);
            const generationsDir = resolve(storeDir(datasetDir), 'generations');
            mkdirSync(generationsDir, {recursive: true});
            const generationDestination = generationPath(datasetDir, generationId);
            if (!existsSync(generationDestination)) {
                const generationStage = `${generationDestination}.stage-${process.pid}-${randomUUID()}`;
                writeFileSync(generationStage, generationContent, 'utf-8');
                try {
                    renameSync(generationStage, generationDestination);
                } finally {
                    rmSync(generationStage, {force: true});
                }
            } else {
                const existingDigest = digestContent(readFileSync(generationDestination));
                if (existingDigest.sha256 !== generationDigest.sha256
                    || existingDigest.bytes !== generationDigest.bytes) {
                    throw new Error(`Dataset generation ${generationId} failed immutable identity verification.`);
                }
            }
            const pointer: DatasetPointer = {
                schema_version: DATASET_STORE_SCHEMA_VERSION,
                generation_id: generationId,
                generation_sha256: generationDigest.sha256,
                generation_bytes: generationDigest.bytes,
                complete: true
            };
            mkdirSync(pointerStage);
            writeFileSync(resolve(pointerStage, 'current.json'), json(pointer), 'utf-8');
            let movedExisting = false;
            try {
                if (existsSync(datasetDir)) {
                    renameSync(datasetDir, backup);
                    movedExisting = true;
                }
                renameSync(pointerStage, datasetDir);
                finished = true;
                try {
                    rmSync(backup, {recursive: true, force: true});
                } catch {
                    // The new pointer is committed; a locked legacy backup is harmless.
                }
            } catch (error) {
                if (movedExisting && !existsSync(datasetDir) && existsSync(backup)) {
                    renameSync(backup, datasetDir);
                }
                throw error;
            } finally {
                rmSync(pointerStage, {recursive: true, force: true});
                rmSync(stagingDir, {recursive: true, force: true});
                release();
            }
        },
        rollback() {
            if (finished) return;
            rmSync(stagingDir, {recursive: true, force: true});
            rmSync(pointerStage, {recursive: true, force: true});
            rmSync(backup, {recursive: true, force: true});
            finished = true;
            release();
        },
        stats: () => ({...stats})
    };
}
