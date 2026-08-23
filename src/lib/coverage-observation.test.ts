import {execFileSync} from 'node:child_process';
import {mkdirSync, mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {
    publishCoverageInputObservation,
    resolveCurrentCoverageInputs
} from './coverage-observation.ts';
import {coverageInputKey} from './coverage-identity.ts';

const roots: string[] = [];

function git(projectRoot: string, args: string[]): void {
    execFileSync('git', args, {
        cwd: projectRoot,
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'pipe']
    });
}

function fixture(): {projectRoot: string; cacheRoot: string} {
    const projectRoot = mkdtempSync(resolve(tmpdir(), 'edugraph-coverage-observation-'));
    roots.push(projectRoot);
    const files: Record<string, string> = {
        'src/spec/ccss/grade.ts': 'target spec',
        'src/generators/demo/spec.ts': "import {capability} from './helpers.ts'; export const spec = capability;",
        'src/generators/demo/helpers.ts': 'export const capability = 1;',
        'src/generators/demo/generator.ts':
            'class DemoGenerator implements ProblemGenerator<DemoProblem> {}',
        'src/visuals/views/demo/spec.ts': 'view spec',
        'src/types/problems.ts': "export interface ViewTypeMap { 'demo': DemoProblem }",
        'public/coverage/ccss-tree.json': JSON.stringify({tree: {}, standardsMap: {}}),
        'package.json': JSON.stringify({
            dependencies: {'edugraph-ts': 'https://example.test/edugraph-ts.tgz'}
        }),
        'package-lock.json': JSON.stringify({
            packages: {
                'node_modules/edugraph-ts': {
                    version: '1.0.0',
                    resolved: 'https://example.test/edugraph-ts.tgz',
                    integrity: 'sha512-exact'
                }
            }
        }),
        '.gitignore': 'temp/\n'
    };
    for (const [path, content] of Object.entries(files)) {
        mkdirSync(resolve(projectRoot, path, '..'), {recursive: true});
        writeFileSync(resolve(projectRoot, path), content, 'utf-8');
    }
    git(projectRoot, ['init']);
    git(projectRoot, ['add', '.']);
    git(projectRoot, ['-c', 'user.name=Test', '-c', 'user.email=test@example.com', 'commit', '-m', 'baseline']);
    return {projectRoot, cacheRoot: resolve(projectRoot, 'temp', 'coverage-core')};
}

afterEach(() => {
    for (const root of roots.splice(0)) rmSync(root, {recursive: true, force: true});
});

describe('coverage input observation', () => {
    it('skips semantic discovery for clean and output-only implementation deltas', async () => {
        const {projectRoot, cacheRoot} = fixture();
        const firstUsage = vi.fn(async () => 'usage-a');
        const first = await resolveCurrentCoverageInputs({
            projectRoot,
            root: cacheRoot,
            sourceRef: 'main',
            sourceSha: 'a'.repeat(40),
            ontologyUsageSha256: firstUsage
        });
        expect(first.reused_observation).toBe(false);
        expect(firstUsage).toHaveBeenCalledOnce();
        publishCoverageInputObservation(cacheRoot, first.observation);

        const cleanUsage = vi.fn(async () => 'unused');
        const clean = await resolveCurrentCoverageInputs({
            projectRoot,
            root: cacheRoot,
            sourceRef: 'release',
            sourceSha: 'b'.repeat(40),
            ontologyUsageSha256: cleanUsage
        });
        expect(clean.reused_observation).toBe(true);
        expect(cleanUsage).not.toHaveBeenCalled();
        expect(coverageInputKey(clean.inputs)).toBe(coverageInputKey(first.inputs));
        expect(clean.inputs.repository.ref).toBe('release');
        publishCoverageInputObservation(cacheRoot, clean.observation);

        writeFileSync(
            resolve(projectRoot, 'src', 'generators', 'demo', 'generator.ts'),
            'class DemoGenerator implements ProblemGenerator<DemoProblem> { changed = true; }'
        );
        const implementationUsage = vi.fn(async () => 'unused');
        const implementation = await resolveCurrentCoverageInputs({
            projectRoot,
            root: cacheRoot,
            sourceRef: 'working-tree',
            sourceSha: 'working-tree',
            ontologyUsageSha256: implementationUsage
        });
        expect(implementation.reused_observation).toBe(true);
        expect(implementationUsage).not.toHaveBeenCalled();
    });

    it('reconstructs for semantic, structural, selection, and ontology changes', async () => {
        const {projectRoot, cacheRoot} = fixture();
        const initial = await resolveCurrentCoverageInputs({
            projectRoot,
            root: cacheRoot,
            sourceRef: 'main',
            sourceSha: 'a'.repeat(40),
            ontologyUsageSha256: async () => 'usage-a'
        });
        publishCoverageInputObservation(cacheRoot, initial.observation);

        writeFileSync(
            resolve(projectRoot, 'src', 'generators', 'demo', 'generator.ts'),
            'class DemoGenerator implements ProblemGenerator<ChangedProblem> {}'
        );
        const typeUsage = vi.fn(async () => 'usage-b');
        expect((await resolveCurrentCoverageInputs({
            projectRoot,
            root: cacheRoot,
            sourceRef: 'working-tree',
            sourceSha: 'working-tree',
            ontologyUsageSha256: typeUsage
        })).reused_observation).toBe(false);
        expect(typeUsage).toHaveBeenCalledOnce();

        const selectionUsage = vi.fn(async () => 'usage-a');
        expect((await resolveCurrentCoverageInputs({
            projectRoot,
            root: cacheRoot,
            sourceRef: 'main',
            sourceSha: 'a'.repeat(40),
            grade: '2',
            ontologyUsageSha256: selectionUsage
        })).reused_observation).toBe(false);
        expect(selectionUsage).toHaveBeenCalledOnce();

        const dependency = 'https://example.test/edugraph-ts-v2.tgz';
        writeFileSync(resolve(projectRoot, 'package.json'), JSON.stringify({
            dependencies: {'edugraph-ts': dependency}
        }));
        writeFileSync(resolve(projectRoot, 'package-lock.json'), JSON.stringify({
            packages: {
                'node_modules/edugraph-ts': {
                    version: '2.0.0',
                    resolved: dependency,
                    integrity: 'sha512-v2'
                }
            }
        }));
        const ontologyUsage = vi.fn(async () => 'usage-a');
        expect((await resolveCurrentCoverageInputs({
            projectRoot,
            root: cacheRoot,
            sourceRef: 'main',
            sourceSha: 'a'.repeat(40),
            ontologyUsageSha256: ontologyUsage
        })).reason).toBe('ontology provenance changed');
        expect(ontologyUsage).toHaveBeenCalledOnce();
    });

    it('reconstructs when a new authored coverage input is added', async () => {
        const {projectRoot, cacheRoot} = fixture();
        const initial = await resolveCurrentCoverageInputs({
            projectRoot,
            root: cacheRoot,
            sourceRef: 'main',
            sourceSha: 'a'.repeat(40),
            ontologyUsageSha256: async () => 'usage-a'
        });
        publishCoverageInputObservation(cacheRoot, initial.observation);

        writeFileSync(
            resolve(projectRoot, 'src', 'spec', 'ccss', 'new-target.ts'),
            'new target spec'
        );
        const usage = vi.fn(async () => 'usage-b');
        const result = await resolveCurrentCoverageInputs({
            projectRoot,
            root: cacheRoot,
            sourceRef: 'working-tree',
            sourceSha: 'working-tree',
            ontologyUsageSha256: usage
        });

        expect(result.reused_observation).toBe(false);
        expect(result.reason).toBe('coverage input changed: src/spec/ccss/new-target.ts');
        expect(usage).toHaveBeenCalledOnce();
    });

    it('fails closed when a recorded semantic input is ignored by Git', async () => {
        const {projectRoot, cacheRoot} = fixture();
        writeFileSync(
            resolve(projectRoot, '.gitignore'),
            'temp/\nsrc/generators/demo/ignored.ts\n'
        );
        writeFileSync(
            resolve(projectRoot, 'src', 'generators', 'demo', 'ignored.ts'),
            'export const ignoredCapability = 1;'
        );
        writeFileSync(
            resolve(projectRoot, 'src', 'generators', 'demo', 'spec.ts'),
            "import {ignoredCapability} from './ignored.ts'; export const spec = ignoredCapability;"
        );
        const initial = await resolveCurrentCoverageInputs({
            projectRoot,
            root: cacheRoot,
            sourceRef: 'working-tree',
            sourceSha: 'working-tree',
            ontologyUsageSha256: async () => 'usage-a'
        });
        expect(initial.observation).toBeNull();
        publishCoverageInputObservation(cacheRoot, initial.observation);

        const usage = vi.fn(async () => 'usage-a');
        const result = await resolveCurrentCoverageInputs({
            projectRoot,
            root: cacheRoot,
            sourceRef: 'working-tree',
            sourceSha: 'working-tree',
            ontologyUsageSha256: usage
        });
        expect(result.reused_observation).toBe(false);
        expect(result.reason).toBe('coverage observation is missing or unsupported');
        expect(usage).toHaveBeenCalledOnce();
    });
});
