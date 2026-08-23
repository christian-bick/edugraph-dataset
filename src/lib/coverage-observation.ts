import {randomUUID} from 'node:crypto';
import {
    existsSync,
    mkdirSync,
    readFileSync,
    renameSync,
    rmSync,
    writeFileSync
} from 'node:fs';
import {dirname, extname, resolve} from 'node:path';
import {
    buildCoverageInputIdentity,
    COVERAGE_INPUT_SCHEMA_VERSION,
    COVERAGE_PRODUCER_EPOCH,
    coverageRepositorySnapshot,
    resolveOntologyProvenance,
    type CoverageInputIdentity,
    type CoverageRepositoryFileRecord,
    type CoverageRepositorySnapshot,
    type CoverageSelectionIdentity,
    type OntologyProvenance
} from './coverage-identity.ts';
import {digestFile, digestIdentity, radixSortUtf8} from './content-identity.ts';
import {
    captureGitInputObservation,
    inspectGitInputObservation,
    type GitInputObservation
} from './git-observation.ts';
import {canonicalStandardsIdentity} from './standards-source.ts';
import {
    getViewToProblemTypeMapFromPath,
    readGeneratorProblemTypeFromPath
} from './type-parser.ts';
import type {WorkCounters} from './work-counters.ts';

export const COVERAGE_OBSERVATION_SCHEMA_VERSION = 1;

export interface CoverageInputObservation {
    schema_version: number;
    inputs: CoverageInputIdentity;
    repository: CoverageRepositorySnapshot;
    workspace: GitInputObservation;
}

export interface ResolvedCoverageInputs {
    inputs: CoverageInputIdentity;
    observation: CoverageInputObservation | null;
    reused_observation: boolean;
    reason: string;
}

const json = (value: unknown): string => `${JSON.stringify(value, null, 2)}\n`;
const normalizePath = (path: string): string => path.replaceAll('\\', '/');

function selection(options: {
    grade?: string;
    excludeHighSchool?: boolean;
    knownAssetsSha256?: string;
}): CoverageSelectionIdentity {
    return {
        grade: options.grade ?? null,
        exclude_high_school: options.excludeHighSchool ?? false,
        known_assets_sha256: options.knownAssetsSha256 ?? null
    };
}

function observationKey(value: CoverageSelectionIdentity): string {
    return digestIdentity({
        schema_version: COVERAGE_OBSERVATION_SCHEMA_VERSION,
        coverage_input_schema: COVERAGE_INPUT_SCHEMA_VERSION,
        producer_epoch: COVERAGE_PRODUCER_EPOCH,
        selection: value
    });
}

function observationPath(root: string, value: CoverageSelectionIdentity): string {
    return resolve(root, '.observations', `${observationKey(value)}.json`);
}

function inputFiles(repository: CoverageRepositorySnapshot): Record<string, string> {
    return Object.fromEntries(radixSortUtf8(Object.keys(repository.files))
        .map(path => [path, digestIdentity(repository.files[path])]));
}

function canonicalViewProblemTypes(path: string): Record<string, string> {
    const raw = getViewToProblemTypeMapFromPath(path);
    return Object.fromEntries(radixSortUtf8(Object.keys(raw)).map(viewId => [viewId, raw[viewId]]));
}

function currentFileRecord(
    absolutePath: string,
    previous: CoverageRepositoryFileRecord
): CoverageRepositoryFileRecord | null {
    if (!existsSync(absolutePath)) return null;
    const record: CoverageRepositoryFileRecord = {};
    if (previous.content) record.content = digestFile(absolutePath);
    if (previous.generator_problem_type) {
        record.generator_problem_type = {
            generator: previous.generator_problem_type.generator,
            sha256: digestIdentity(readGeneratorProblemTypeFromPath(absolutePath))
        };
    }
    if (previous.view_problem_types_sha256) {
        record.view_problem_types_sha256 = digestIdentity(canonicalViewProblemTypes(absolutePath));
    }
    return record;
}

function isPotentialCoverageInput(path: string): boolean {
    if (path.endsWith('.test.ts') || path.endsWith('.test.tsx')) return false;
    if (path.startsWith('src/spec/ccss/')) return extname(path) === '.ts';
    if (path.startsWith('src/generators/')) {
        return path.endsWith('/spec.ts') || path.endsWith('/generator.ts');
    }
    if (path.startsWith('src/visuals/views/')) return path.endsWith('/spec.ts');
    return path === 'src/types/problems.ts';
}

function sameOntologyProvenance(
    previous: CoverageInputIdentity['ontology'],
    current: OntologyProvenance
): boolean {
    const {semantic_usage_sha256: _usage, ...previousProvenance} = previous;
    return digestIdentity(previousProvenance) === digestIdentity(current);
}

function readObservation(
    root: string,
    currentSelection: CoverageSelectionIdentity
): CoverageInputObservation | null {
    const path = observationPath(root, currentSelection);
    if (!existsSync(path)) return null;
    try {
        const value = JSON.parse(readFileSync(path, 'utf-8')) as CoverageInputObservation;
        if (value.schema_version !== COVERAGE_OBSERVATION_SCHEMA_VERSION
            || value.inputs.schema_version !== COVERAGE_INPUT_SCHEMA_VERSION
            || value.inputs.producer_epoch !== COVERAGE_PRODUCER_EPOCH
            || digestIdentity(value.inputs.selection) !== digestIdentity(currentSelection)
            || value.inputs.repository.content_sha256 !== value.repository.content_sha256
            || digestIdentity(value.workspace.input_files) !== digestIdentity(inputFiles(value.repository))) {
            return null;
        }
        return value;
    } catch {
        return null;
    }
}

function captureObservation(options: {
    projectRoot: string;
    inputs: CoverageInputIdentity;
    repository: CoverageRepositorySnapshot;
}): CoverageInputObservation | null {
    const workspace = captureGitInputObservation(
        options.projectRoot,
        inputFiles(options.repository)
    );
    return workspace ? {
        schema_version: COVERAGE_OBSERVATION_SCHEMA_VERSION,
        inputs: options.inputs,
        repository: options.repository,
        workspace
    } : null;
}

/**
 * Resolves coverage inputs from a proven-clean local observation before model
 * discovery. A miss reconstructs the complete semantic identity; callers only
 * publish the returned observation after their coverage operation succeeds.
 */
export async function resolveCurrentCoverageInputs(options: {
    projectRoot: string;
    root: string;
    sourceRef: string;
    sourceSha: string;
    grade?: string;
    excludeHighSchool?: boolean;
    knownAssetsSha256?: string;
    rebuildGraph?: boolean;
    ontologyUsageSha256: () => Promise<string>;
    counters?: WorkCounters;
}): Promise<ResolvedCoverageInputs> {
    const currentSelection = selection(options);
    const standards = canonicalStandardsIdentity(options.projectRoot);
    const ontology = resolveOntologyProvenance(options.projectRoot);
    const previous = options.rebuildGraph ? null : readObservation(options.root, currentSelection);
    let missReason = options.rebuildGraph
        ? 'authoritative coverage reconstruction requested'
        : 'coverage observation is missing or unsupported';

    if (previous) {
        if (digestIdentity(previous.inputs.standards) !== digestIdentity(standards)) {
            missReason = 'canonical standards identity changed';
        } else if (!sameOntologyProvenance(previous.inputs.ontology, ontology)) {
            missReason = 'ontology provenance changed';
        } else {
            const inspection = inspectGitInputObservation({
                projectRoot: options.projectRoot,
                previous: previous.workspace,
                potentialRoots: [
                    'src/spec/ccss',
                    'src/generators',
                    'src/visuals/views',
                    'src/types/problems.ts'
                ],
                isPotentialInput: isPotentialCoverageInput,
                isIgnoredInput: path =>
                    path in previous.workspace.input_files || isPotentialCoverageInput(path),
                currentIdentity: (absolutePath, path) => {
                    const oldRecord = previous.repository.files[normalizePath(path)];
                    if (!oldRecord) {
                        return existsSync(absolutePath)
                            ? digestIdentity({new_coverage_input: digestFile(absolutePath)})
                            : null;
                    }
                    const record = currentFileRecord(absolutePath, oldRecord);
                    return record ? digestIdentity(record) : null;
                },
                inputName: 'coverage input'
            });
            options.counters?.add('coverage_observation.candidate_files', inspection.candidate_files);
            options.counters?.add(
                'coverage_observation.relevant_files_checked',
                inspection.relevant_files_checked
            );
            if (inspection.clean) {
                const inputs = buildCoverageInputIdentity({
                    projectRoot: options.projectRoot,
                    sourceRef: options.sourceRef,
                    sourceSha: options.sourceSha,
                    standards,
                    ontology,
                    ontologyUsageSha256: previous.inputs.ontology.semantic_usage_sha256,
                    grade: options.grade,
                    excludeHighSchool: options.excludeHighSchool,
                    knownAssetsSha256: options.knownAssetsSha256,
                    repositoryContentSha256: previous.repository.content_sha256
                });
                options.counters?.add('coverage_observation.hits');
                return {
                    inputs,
                    observation: captureObservation({
                        projectRoot: options.projectRoot,
                        inputs,
                        repository: previous.repository
                    }),
                    reused_observation: true,
                    reason: inspection.reason
                };
            }
            missReason = inspection.reason;
        }
    }

    options.counters?.add('coverage_observation.misses');
    const repository = coverageRepositorySnapshot(options.projectRoot);
    const inputs = buildCoverageInputIdentity({
        projectRoot: options.projectRoot,
        sourceRef: options.sourceRef,
        sourceSha: options.sourceSha,
        standards,
        ontology,
        ontologyUsageSha256: await options.ontologyUsageSha256(),
        grade: options.grade,
        excludeHighSchool: options.excludeHighSchool,
        knownAssetsSha256: options.knownAssetsSha256,
        repositoryContentSha256: repository.content_sha256
    });
    return {
        inputs,
        observation: captureObservation({
            projectRoot: options.projectRoot,
            inputs,
            repository
        }),
        reused_observation: false,
        reason: missReason
    };
}

export function publishCoverageInputObservation(
    root: string,
    observation: CoverageInputObservation | null
): void {
    if (!observation) return;
    const destination = observationPath(root, observation.inputs.selection);
    mkdirSync(dirname(destination), {recursive: true});
    const stage = `${destination}.stage-${process.pid}-${randomUUID()}`;
    const previous = `${destination}.previous-${process.pid}-${randomUUID()}`;
    writeFileSync(stage, json(observation), 'utf-8');
    let movedPrevious = false;
    try {
        if (existsSync(destination)) {
            renameSync(destination, previous);
            movedPrevious = true;
        }
        renameSync(stage, destination);
        if (movedPrevious) rmSync(previous, {force: true});
    } catch (error) {
        if (movedPrevious && !existsSync(destination) && existsSync(previous)) {
            renameSync(previous, destination);
        }
        throw error;
    } finally {
        rmSync(stage, {force: true});
        rmSync(previous, {force: true});
    }
}
