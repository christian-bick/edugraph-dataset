import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {digestIdentity, hashSourceFiles} from './content-identity.ts';
import type {StandardsProvenance} from './standards-source.ts';
import type {CoverageManifest} from '../standards-explorer/types.ts';

export const COVERAGE_INPUT_SCHEMA_VERSION = 1;
export const COVERAGE_PRODUCER_EPOCH = 'standards-coverage-v1';

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
    standards: StandardsProvenance;
    ontology: OntologyProvenance;
    selection: CoverageSelectionIdentity;
}

const isRuntimeSource = (path: string): boolean =>
    !path.endsWith('.test.ts')
    && !path.endsWith('.test.tsx')
    && !path.endsWith('.it.test.ts')
    && !path.endsWith('.it.test.tsx')
    && !path.endsWith('checklist.md');

export function coverageRepositoryDigest(projectRoot: string): string {
    return hashSourceFiles(projectRoot, [
        resolve(projectRoot, 'package.json'),
        resolve(projectRoot, 'package-lock.json'),
        resolve(projectRoot, 'tsconfig.json'),
        resolve(projectRoot, 'vite.config.js'),
        resolve(projectRoot, 'src')
    ], {include: isRuntimeSource});
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
    standards: StandardsProvenance;
    ontology?: OntologyProvenance;
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
        standards: options.standards,
        ontology: options.ontology ?? resolveOntologyProvenance(options.projectRoot),
        selection: {
            grade: options.grade ?? null,
            exclude_high_school: options.excludeHighSchool ?? false,
            known_assets_sha256: options.knownAssetsSha256 ?? null
        }
    };
}

export function coverageInputKey(identity: CoverageInputIdentity): string {
    return digestIdentity(identity);
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
    standards: StandardsProvenance;
    ontology?: OntologyProvenance;
}): string[] {
    const {projectRoot, manifest, standards} = options;
    const issues: string[] = [];
    if (manifest.schema_version !== 3) {
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
        standards,
        ontology: options.ontology,
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
