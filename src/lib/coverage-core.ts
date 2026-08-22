import {randomUUID} from 'node:crypto';
import {
    existsSync,
    mkdirSync,
    readFileSync,
    renameSync,
    rmSync,
    writeFileSync
} from 'node:fs';
import {resolve} from 'node:path';
import {
    coverageCoreInputKey,
    toCoverageCoreInputIdentity,
    type CoverageCoreInputIdentity,
    type CoverageInputIdentity
} from './coverage-identity.ts';
import {digestContent} from './content-identity.ts';
import type {WorkCounters} from './work-counters.ts';
import type {
    CoverageData,
    CoverageMetadata,
    StandardCoverage,
    StandardsTreeData,
    BacklogTask
} from '../standards-explorer/types.ts';

export const COVERAGE_CORE_SCHEMA_VERSION = 1;
export const COVERAGE_CORE_MANIFEST_SCHEMA_VERSION = 1;

export type CoverageCoreMetadata = Omit<CoverageMetadata, 'generated_at'>;

export interface CoverageCoreData {
    metadata: CoverageCoreMetadata;
    coverage: Record<string, StandardCoverage>;
    tasks: BacklogTask[];
}

export interface CoverageCoreArtifact {
    schema_version: number;
    core_input_key: string;
    inputs: CoverageCoreInputIdentity;
    tree: StandardsTreeData;
    coverage: CoverageCoreData;
}

interface CoverageCoreManifest {
    schema_version: number;
    core_input_key: string;
    core_sha256: string;
    core_bytes: number;
    complete: true;
}

export interface ResolvedCoverageCore {
    artifact: CoverageCoreArtifact;
    reused: boolean;
    directory: string;
}

const json = (value: unknown): string => `${JSON.stringify(value, null, 2)}\n`;

export function toCoverageCoreData(coverage: CoverageData): CoverageCoreData {
    const {generated_at: _generatedAt, ...metadata} = coverage.metadata;
    return {
        metadata,
        coverage: coverage.coverage,
        tasks: coverage.tasks
    };
}

export function projectCoverageData(
    core: CoverageCoreData,
    generatedAt: string,
    ontologyVersion: string = core.metadata.ontology_version
): CoverageData {
    return {
        metadata: {
            generated_at: generatedAt,
            ...core.metadata,
            ontology_version: ontologyVersion
        },
        coverage: core.coverage,
        tasks: core.tasks
    };
}

function artifactDirectory(root: string, key: string): string {
    if (!/^[a-f\d]{64}$/.test(key)) throw new Error(`Invalid coverage core input key: ${key}.`);
    return resolve(root, key);
}

export function readCoverageCoreArtifact(options: {
    root: string;
    key: string;
    expectedInputs?: CoverageCoreInputIdentity;
    counters?: WorkCounters;
}): CoverageCoreArtifact | null {
    const directory = artifactDirectory(options.root, options.key);
    if (!existsSync(directory)) return null;
    const corePath = resolve(directory, 'core.json');
    const manifestPath = resolve(directory, 'manifest.json');
    if (!existsSync(corePath) || !existsSync(manifestPath)) {
        throw new Error(`Coverage core ${options.key} is incomplete at ${directory}.`);
    }

    const coreBytes = readFileSync(corePath);
    const manifestBytes = readFileSync(manifestPath);
    options.counters?.add('coverage_core.files_read', 2);
    options.counters?.add('coverage_core.bytes_read', coreBytes.byteLength + manifestBytes.byteLength);
    const manifest = JSON.parse(manifestBytes.toString('utf-8')) as CoverageCoreManifest;
    const digest = digestContent(coreBytes);
    if (manifest.schema_version !== COVERAGE_CORE_MANIFEST_SCHEMA_VERSION
        || manifest.complete !== true
        || manifest.core_input_key !== options.key
        || manifest.core_sha256 !== digest.sha256
        || manifest.core_bytes !== digest.bytes) {
        throw new Error(`Coverage core ${options.key} failed manifest or content integrity verification.`);
    }

    const artifact = JSON.parse(coreBytes.toString('utf-8')) as CoverageCoreArtifact;
    if (artifact.schema_version !== COVERAGE_CORE_SCHEMA_VERSION
        || artifact.core_input_key !== options.key
        || coverageCoreInputKey(artifact.inputs) !== options.key) {
        throw new Error(`Coverage core ${options.key} has an unsupported or inconsistent payload.`);
    }
    if (options.expectedInputs
        && coverageCoreInputKey(options.expectedInputs) !== coverageCoreInputKey(artifact.inputs)) {
        throw new Error(`Coverage core ${options.key} does not match the expected inputs.`);
    }
    return artifact;
}

function writeCoverageCoreArtifact(options: {
    root: string;
    artifact: CoverageCoreArtifact;
    counters?: WorkCounters;
}): string {
    const {root, artifact, counters} = options;
    const destination = artifactDirectory(root, artifact.core_input_key);
    mkdirSync(root, {recursive: true});
    const stage = resolve(root, `${artifact.core_input_key}.stage-${process.pid}-${randomUUID()}`);
    mkdirSync(stage);
    const coreContent = json(artifact);
    const digest = digestContent(coreContent);
    const manifest: CoverageCoreManifest = {
        schema_version: COVERAGE_CORE_MANIFEST_SCHEMA_VERSION,
        core_input_key: artifact.core_input_key,
        core_sha256: digest.sha256,
        core_bytes: digest.bytes,
        complete: true
    };
    writeFileSync(resolve(stage, 'core.json'), coreContent, 'utf-8');
    writeFileSync(resolve(stage, 'manifest.json'), json(manifest), 'utf-8');
    counters?.add('coverage_core.files_written', 2);
    counters?.add('coverage_core.bytes_written', digest.bytes + Buffer.byteLength(json(manifest)));
    try {
        renameSync(stage, destination);
    } catch (error) {
        if (!existsSync(destination)) throw error;
        rmSync(stage, {recursive: true, force: true});
    } finally {
        if (existsSync(stage)) rmSync(stage, {recursive: true, force: true});
    }
    return destination;
}

export async function resolveCoverageCore(options: {
    root: string;
    inputs: CoverageInputIdentity;
    build: () => Promise<{tree: StandardsTreeData; coverage: CoverageData}>;
    counters?: WorkCounters;
}): Promise<ResolvedCoverageCore> {
    const coreInputs = toCoverageCoreInputIdentity(options.inputs);
    const key = coverageCoreInputKey(coreInputs);
    const existing = readCoverageCoreArtifact({
        root: options.root,
        key,
        expectedInputs: coreInputs,
        counters: options.counters
    });
    if (existing) {
        options.counters?.add('coverage_core.hits');
        return {artifact: existing, reused: true, directory: artifactDirectory(options.root, key)};
    }

    options.counters?.add('coverage_core.misses');
    const built = await options.build();
    const artifact: CoverageCoreArtifact = {
        schema_version: COVERAGE_CORE_SCHEMA_VERSION,
        core_input_key: key,
        inputs: coreInputs,
        tree: built.tree,
        coverage: toCoverageCoreData(built.coverage)
    };
    const directory = writeCoverageCoreArtifact({root: options.root, artifact, counters: options.counters});
    const verified = readCoverageCoreArtifact({
        root: options.root,
        key,
        expectedInputs: coreInputs,
        counters: options.counters
    });
    if (!verified) throw new Error(`Coverage core ${key} was not published.`);
    return {artifact: verified, reused: false, directory};
}
