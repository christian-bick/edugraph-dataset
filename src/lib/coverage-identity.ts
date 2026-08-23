import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {
    digestIdentity,
    radixSortUtf8,
    SourceContentIndex
} from './content-identity.ts';
import {findLeafModules} from './module-resolver.ts';
import {
    getGeneratorProblemTypeFromPath,
    getViewToProblemTypeMapFromPath
} from './type-parser.ts';
import {
    canonicalStandardsIdentity,
    type CanonicalStandardsIdentity
} from './standards-source.ts';
import type {CoverageManifest} from '../standards-explorer/types.ts';
import {ModelSourceIndex} from './model-source-index.ts';

export const COVERAGE_INPUT_SCHEMA_VERSION = 5;
export const COVERAGE_PRODUCER_EPOCH = 'standards-coverage-v5';

export interface RepositoryProvenance {
    ref: string;
    sha: string;
    content_sha256: string;
}

export interface OntologyProvenance {
    package: 'edugraph-ts';
    version: string;
    dependency: string;
    resolved: string;
    integrity: string;
}

export interface CoverageSelectionIdentity {
    grade: string | null;
    exclude_high_school: boolean;
    known_assets_sha256: string | null;
}

export interface CoverageInputIdentity {
    schema_version: number;
    producer_epoch: string;
    repository: RepositoryProvenance;
    standards: CanonicalStandardsIdentity;
    ontology: OntologyProvenance & {semantic_usage_sha256: string};
    selection: CoverageSelectionIdentity;
}

export interface CoverageCoreInputIdentity {
    schema_version: number;
    producer_epoch: string;
    repository: Pick<RepositoryProvenance, 'content_sha256'>;
    standards: CanonicalStandardsIdentity;
    ontology: Pick<OntologyProvenance, 'package'> & {semantic_usage_sha256: string};
    selection: CoverageSelectionIdentity;
}

const isTypeScript = (path: string): boolean => path.endsWith('.ts') || path.endsWith('.tsx');

/** Authored capability specs and the local model code they inherently import. */
function capabilitySourceIdentities(
    projectRoot: string,
    sourceIndex: SourceContentIndex
) {
    const modelSources = new ModelSourceIndex(projectRoot);
    const specs = [
        ...findLeafModules(resolve(projectRoot, 'src', 'generators')),
        ...findLeafModules(resolve(projectRoot, 'src', 'visuals', 'views'))
    ].map(module => resolve(module.absolutePath, 'spec.ts'));
    return sourceIndex.identities(modelSources.dependencies(specs));
}

export function coverageRepositoryDigest(projectRoot: string): string {
    const sourceIndex = new SourceContentIndex(projectRoot);
    const targets = sourceIndex.identities(
        [resolve(projectRoot, 'src', 'spec', 'ccss')],
        {include: isTypeScript}
    );
    const capabilities = capabilitySourceIdentities(projectRoot, sourceIndex);
    const generatorProblemTypes = findLeafModules(resolve(projectRoot, 'src', 'generators'))
        .map(module => ({
            generator: module.id,
            problem_type: getGeneratorProblemTypeFromPath(
                resolve(module.absolutePath, 'generator.ts')
            )
        }));
    const rawViewProblemTypes = getViewToProblemTypeMapFromPath(
        resolve(projectRoot, 'src', 'types', 'problems.ts')
    );
    const viewProblemTypes = Object.fromEntries(radixSortUtf8(Object.keys(rawViewProblemTypes))
        .map(viewId => [viewId, rawViewProblemTypes[viewId]]));
    return digestIdentity({
        targets,
        capabilities,
        generator_problem_types: generatorProblemTypes,
        view_problem_types: viewProblemTypes
    });
}

export function resolveOntologyProvenance(projectRoot: string): OntologyProvenance {
    const packageJson = JSON.parse(readFileSync(resolve(projectRoot, 'package.json'), 'utf-8')) as {
        dependencies?: Record<string, string>;
    };
    const packageLock = JSON.parse(readFileSync(resolve(projectRoot, 'package-lock.json'), 'utf-8')) as {
        packages?: Record<string, {version?: string; resolved?: string; integrity?: string}>;
    };
    const dependency = packageJson.dependencies?.['edugraph-ts'];
    const installed = packageLock.packages?.['node_modules/edugraph-ts'];
    if (!dependency || !installed?.version || !installed.resolved || !installed.integrity) {
        throw new Error('Coverage requires exact edugraph-ts dependency, resolution, version, and integrity provenance.');
    }
    if (dependency !== installed.resolved) {
        throw new Error(
            `edugraph-ts dependency and lock resolution differ: ${dependency} !== ${installed.resolved}.`
        );
    }
    return {
        package: 'edugraph-ts',
        version: installed.version.startsWith('v') ? installed.version : `v${installed.version}`,
        dependency,
        resolved: installed.resolved,
        integrity: installed.integrity
    };
}

export function buildCoverageInputIdentity(options: {
    projectRoot: string;
    sourceRef: string;
    sourceSha: string;
    standards?: CanonicalStandardsIdentity;
    ontology?: OntologyProvenance;
    ontologyUsageSha256?: string;
    grade?: string;
    excludeHighSchool?: boolean;
    knownAssetsSha256?: string;
}): CoverageInputIdentity {
    return {
        schema_version: COVERAGE_INPUT_SCHEMA_VERSION,
        producer_epoch: COVERAGE_PRODUCER_EPOCH,
        repository: {
            ref: options.sourceRef,
            sha: options.sourceSha,
            content_sha256: coverageRepositoryDigest(options.projectRoot)
        },
        standards: options.standards ?? canonicalStandardsIdentity(options.projectRoot),
        ontology: {
            ...(options.ontology ?? resolveOntologyProvenance(options.projectRoot)),
            semantic_usage_sha256: options.ontologyUsageSha256
                ?? digestIdentity(options.ontology ?? resolveOntologyProvenance(options.projectRoot))
        },
        selection: {
            grade: options.grade ?? null,
            exclude_high_school: options.excludeHighSchool ?? false,
            known_assets_sha256: options.knownAssetsSha256 ?? null
        }
    };
}

export function toCoverageCoreInputIdentity(
    identity: CoverageInputIdentity
): CoverageCoreInputIdentity {
    return {
        schema_version: identity.schema_version,
        producer_epoch: identity.producer_epoch,
        repository: {
            content_sha256: identity.repository.content_sha256
        },
        standards: identity.standards,
        ontology: {
            package: identity.ontology.package,
            semantic_usage_sha256: identity.ontology.semantic_usage_sha256
        },
        selection: identity.selection
    };
}

export function coverageCoreInputKey(identity: CoverageCoreInputIdentity): string {
    return digestIdentity(identity);
}

export function coverageInputKey(identity: CoverageInputIdentity): string {
    return coverageCoreInputKey(toCoverageCoreInputIdentity(identity));
}

export function currentGitSha(projectRoot: string): string | null {
    try {
        return execFileSync('git', ['rev-parse', 'HEAD'], {
            cwd: projectRoot,
            encoding: 'utf-8',
            stdio: ['ignore', 'pipe', 'ignore']
        }).trim().toLowerCase();
    } catch {
        return null;
    }
}

export function repositoryProvenanceIssues(
    projectRoot: string,
    provenance: RepositoryProvenance
): string[] {
    const issues: string[] = [];
    const expectedContent = coverageRepositoryDigest(projectRoot);
    if (provenance.content_sha256 !== expectedContent) {
        issues.push(
            `Coverage repository content digest ${provenance.content_sha256} does not match ${expectedContent}.`
        );
    }
    if (/^[a-f\d]{40}$/i.test(provenance.sha)) {
        const head = currentGitSha(projectRoot);
        if (!head) issues.push('Coverage source SHA is immutable, but the current Git HEAD cannot be verified.');
        else if (head !== provenance.sha.toLowerCase()) {
            issues.push(`Coverage source SHA ${provenance.sha} does not match current Git HEAD ${head}.`);
        }
    } else if (provenance.sha !== 'working-tree') {
        issues.push(`Coverage source SHA must be a 40-character Git SHA or "working-tree": ${provenance.sha}.`);
    }
    return issues;
}

export function coverageManifestIdentityIssues(options: {
    projectRoot: string;
    manifest: CoverageManifest;
    ontology?: OntologyProvenance;
    ontologyUsageSha256?: string;
}): string[] {
    const {projectRoot, manifest} = options;
    const issues: string[] = [];
    if (manifest.schema_version !== 4) {
        return [`Unsupported coverage manifest schema: ${manifest.schema_version}.`];
    }
    if (!manifest.inputs || manifest.inputs.schema_version !== COVERAGE_INPUT_SCHEMA_VERSION) {
        return [`Unsupported coverage input schema: ${manifest.inputs?.schema_version ?? 'missing'}.`];
    }
    if (manifest.inputs.producer_epoch !== COVERAGE_PRODUCER_EPOCH) {
        issues.push(`Unsupported coverage producer epoch: ${manifest.inputs.producer_epoch}.`);
    }
    if (manifest.source_ref !== manifest.inputs.repository.ref
        || manifest.source_sha !== manifest.inputs.repository.sha) {
        issues.push('Coverage source_ref/source_sha do not mirror repository input provenance.');
    }
    if (manifest.ontology_version !== manifest.inputs.ontology.version) {
        issues.push('Coverage ontology_version does not mirror ontology input provenance.');
    }

    const recordedKey = coverageInputKey(manifest.inputs);
    if (manifest.core_input_key !== recordedKey) {
        issues.push(`Coverage core_input_key ${manifest.core_input_key} does not match recorded inputs ${recordedKey}.`);
    }

    const expected = buildCoverageInputIdentity({
        projectRoot,
        sourceRef: manifest.source_ref,
        sourceSha: manifest.source_sha,
        ontology: options.ontology,
        ontologyUsageSha256: options.ontologyUsageSha256,
        grade: manifest.inputs.selection.grade ?? undefined,
        excludeHighSchool: manifest.inputs.selection.exclude_high_school,
        knownAssetsSha256: manifest.inputs.selection.known_assets_sha256 ?? undefined
    });
    const expectedKey = coverageInputKey(expected);
    if (manifest.core_input_key !== expectedKey) {
        issues.push(`Coverage core_input_key ${manifest.core_input_key} does not match current inputs ${expectedKey}.`);
    }
    issues.push(...repositoryProvenanceIssues(projectRoot, manifest.inputs.repository));
    return issues;
}
