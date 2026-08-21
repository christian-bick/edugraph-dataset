import {mkdirSync, mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {describe, expect, it} from 'vitest';
import {
    buildCoverageInputIdentity,
    coverageManifestIdentityIssues,
    coverageInputKey,
    coverageRepositoryDigest,
    resolveOntologyProvenance
} from './coverage-identity.ts';
import type {StandardsProvenance} from './standards-source.ts';

const standards: StandardsProvenance = {
    provider: 'huggingface',
    repository: 'example/standards',
    revision: 'a'.repeat(40),
    files: [
        {path: 'standards.jsonl', sha256: 'b'.repeat(64), bytes: 12},
        {path: 'domain_groups.json', sha256: 'c'.repeat(64), bytes: 34}
    ]
};

function fixture() {
    const root = mkdtempSync(resolve(tmpdir(), 'edugraph-coverage-identity-'));
    mkdirSync(resolve(root, 'src'));
    writeFileSync(resolve(root, 'src', 'coverage.ts'), 'coverage');
    writeFileSync(resolve(root, 'src', 'coverage.test.ts'), 'test');
    writeFileSync(resolve(root, 'package.json'), JSON.stringify({
        dependencies: {'edugraph-ts': 'https://example.test/edugraph-ts.tgz'}
    }));
    writeFileSync(resolve(root, 'package-lock.json'), JSON.stringify({
        packages: {
            'node_modules/edugraph-ts': {
                version: '1.2.3',
                resolved: 'https://example.test/edugraph-ts.tgz',
                integrity: 'sha512-exact'
            }
        }
    }));
    writeFileSync(resolve(root, 'tsconfig.json'), '{}');
    writeFileSync(resolve(root, 'vite.config.js'), 'export default {}');
    return root;
}

describe('coverage input identity', () => {
    it('records exact repository, standards, ontology, and selection inputs', () => {
        const root = fixture();
        try {
            const identity = buildCoverageInputIdentity({
                projectRoot: root,
                sourceRef: 'main',
                sourceSha: 'd'.repeat(40),
                standards,
                grade: '2',
                excludeHighSchool: true,
                knownAssetsSha256: 'e'.repeat(64)
            });
            expect(identity).toMatchObject({
                schema_version: 1,
                producer_epoch: 'standards-coverage-v1',
                repository: {ref: 'main', sha: 'd'.repeat(40)},
                standards,
                ontology: {
                    package: 'edugraph-ts',
                    version: 'v1.2.3',
                    integrity: 'sha512-exact'
                },
                selection: {
                    grade: '2',
                    exclude_high_school: true,
                    known_assets_sha256: 'e'.repeat(64)
                }
            });
            expect(coverageInputKey(identity)).toMatch(/^[a-f\d]{64}$/);
        } finally {
            rmSync(root, {recursive: true, force: true});
        }
    });

    it('treats source refs as projections while retaining immutable source identity', () => {
        const root = fixture();
        try {
            const main = buildCoverageInputIdentity({
                projectRoot: root,
                sourceRef: 'main',
                sourceSha: 'd'.repeat(40),
                standards
            });
            const release = buildCoverageInputIdentity({
                projectRoot: root,
                sourceRef: 'v1.2.3',
                sourceSha: 'd'.repeat(40),
                standards
            });
            expect(coverageInputKey(main)).toBe(coverageInputKey(release));

            const differentCommit = buildCoverageInputIdentity({
                projectRoot: root,
                sourceRef: 'main',
                sourceSha: 'e'.repeat(40),
                standards
            });
            expect(coverageInputKey(differentCommit)).not.toBe(coverageInputKey(main));
        } finally {
            rmSync(root, {recursive: true, force: true});
        }
    });

    it('ignores tests but changes identity for runtime source changes', () => {
        const root = fixture();
        try {
            const initial = coverageRepositoryDigest(root);
            writeFileSync(resolve(root, 'src', 'coverage.test.ts'), 'changed test');
            expect(coverageRepositoryDigest(root)).toBe(initial);
            writeFileSync(resolve(root, 'src', 'coverage.ts'), 'changed runtime');
            expect(coverageRepositoryDigest(root)).not.toBe(initial);
        } finally {
            rmSync(root, {recursive: true, force: true});
        }
    });

    it('fails closed when ontology lock provenance is incomplete or inconsistent', () => {
        const root = fixture();
        try {
            const provenance = resolveOntologyProvenance(root);
            expect(provenance.version).toBe('v1.2.3');
            writeFileSync(resolve(root, 'package.json'), JSON.stringify({
                dependencies: {'edugraph-ts': 'https://example.test/different.tgz'}
            }));
            expect(() => resolveOntologyProvenance(root)).toThrow('dependency and lock resolution differ');
        } finally {
            rmSync(root, {recursive: true, force: true});
        }
    });

    it('rejects stale or internally inconsistent coverage manifests', () => {
        const root = fixture();
        try {
            const inputs = buildCoverageInputIdentity({
                projectRoot: root,
                sourceRef: 'working-tree',
                sourceSha: 'working-tree',
                standards
            });
            const manifest = {
                schema_version: 3,
                channel: 'preview' as const,
                source_ref: 'working-tree',
                source_sha: 'working-tree',
                generated_at: '2026-08-21T00:00:00.000Z',
                ontology_version: 'v1.2.3',
                core_input_key: coverageInputKey(inputs),
                inputs
            };
            expect(coverageManifestIdentityIssues({projectRoot: root, manifest, standards})).toEqual([]);

            writeFileSync(resolve(root, 'src', 'coverage.ts'), 'stale now');
            expect(coverageManifestIdentityIssues({projectRoot: root, manifest, standards}))
                .toEqual(expect.arrayContaining([
                    expect.stringContaining('does not match current inputs'),
                    expect.stringContaining('repository content digest')
                ]));
            expect(coverageManifestIdentityIssues({
                projectRoot: root,
                manifest: {...manifest, core_input_key: '0'.repeat(64)},
                standards
            })).toEqual(expect.arrayContaining([
                expect.stringContaining('does not match recorded inputs')
            ]));
        } finally {
            rmSync(root, {recursive: true, force: true});
        }
    });
});
