import {execFileSync} from 'node:child_process';
import {mkdtempSync, mkdirSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {afterEach, describe, expect, it} from 'vitest';
import {SourceContentIndex} from './content-identity.ts';
import {createDependencyGraphSnapshot} from './dependency-planner.ts';
import {
    captureDevelopmentInputObservation,
    inspectDevelopmentInputObservation
} from './development-observation.ts';

const temporaryRoots: string[] = [];

function git(projectRoot: string, args: string[]): void {
    execFileSync('git', args, {
        cwd: projectRoot,
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'pipe']
    });
}

function fixture() {
    const projectRoot = mkdtempSync(resolve(tmpdir(), 'edugraph-development-observation-'));
    temporaryRoots.push(projectRoot);
    const files: Record<string, string> = {
        'src/lib/matching.ts': 'export const matching = 1;\n',
        'src/generators/demo/generator.ts': 'export const generator = 1;\n',
        'src/spec/ccss/targets.ts': 'export const targets = [];\n',
        'docs/note.md': 'unrelated\n',
        'package.json': '{"dependencies":{"edugraph-ts":"v1"}}\n',
        'package-lock.json': '{"lockfileVersion":3,"packages":{}}\n',
        'config/external-semantics/ontology.json': '{"semantic_sha256":"ontology-a"}\n',
        '.gitignore': 'src/visuals/views/**/checklist.md\n'
    };
    for (const [path, content] of Object.entries(files)) {
        mkdirSync(resolve(projectRoot, path, '..'), {recursive: true});
        writeFileSync(resolve(projectRoot, path), content, 'utf-8');
    }
    git(projectRoot, ['init']);
    git(projectRoot, ['add', '.']);
    git(projectRoot, ['-c', 'user.name=Test', '-c', 'user.email=test@example.com', 'commit', '-m', 'baseline']);

    const sourceIndex = new SourceContentIndex(projectRoot);
    const source = sourceIndex.identities([resolve(projectRoot, 'src', 'generators', 'demo', 'generator.ts')])[0];
    const sourceId = `source:${source.path}`;
    const graph = createDependencyGraphSnapshot([
        {
            id: sourceId,
            kind: 'source-file',
            input_hash: source.sha256,
            dependencies: [],
            output: {content_hash: source.sha256, bytes: source.bytes}
        },
        {
            id: 'generator:demo',
            kind: 'generator-module',
            input_hash: 'demo',
            dependencies: [sourceId]
        }
    ]);
    const observation = captureDevelopmentInputObservation({
        projectRoot,
        specName: 'ccss',
        graph,
        sourceIndex,
        rendererEnvironment: 'canonical',
        entryFilesByNode: {
            'generator:demo': 'src/generators/demo/generator.ts'
        }
    });
    expect(observation).not.toBeNull();
    const inspect = () => inspectDevelopmentInputObservation({
        projectRoot,
        specName: 'ccss',
        previous: observation,
        rendererEnvironment: 'canonical'
    });
    return {projectRoot, inspect, observation: observation!};
}

afterEach(() => {
    for (const path of temporaryRoots.splice(0)) rmSync(path, {recursive: true, force: true});
});

describe('development input observation', () => {
    it('proves clean and unrelated working-tree changes without rebuilding the graph', () => {
        const {projectRoot, inspect, observation} = fixture();
        expect(observation.entry_files_by_node).toEqual({
            'generator:demo': 'src/generators/demo/generator.ts'
        });
        expect(inspect()).toMatchObject({clean: true, relevant_files_checked: 0});

        writeFileSync(resolve(projectRoot, 'docs', 'note.md'), 'changed but unrelated\n', 'utf-8');
        expect(inspect()).toMatchObject({clean: true, candidate_files: 1, relevant_files_checked: 0});
    });

    it('detects relevant dirty and committed byte changes', () => {
        const {projectRoot, inspect} = fixture();
        const generatorPath = resolve(projectRoot, 'src', 'generators', 'demo', 'generator.ts');
        writeFileSync(generatorPath, 'export const generator = 2;\n', 'utf-8');
        expect(inspect()).toMatchObject({
            clean: false,
            reason: 'graph input changed: src/generators/demo/generator.ts',
            candidate_nodes: ['generator:demo']
        });

        git(projectRoot, ['add', 'src/generators/demo/generator.ts']);
        git(projectRoot, ['-c', 'user.name=Test', '-c', 'user.email=test@example.com', 'commit', '-m', 'change']);
        expect(inspect()).toMatchObject({
            clean: false,
            reason: 'graph input changed: src/generators/demo/generator.ts'
        });
    });

    it('ignores machinery changes outside authored graph inputs', () => {
        const {projectRoot, inspect} = fixture();
        writeFileSync(resolve(projectRoot, 'src', 'lib', 'matching.ts'), 'export const matching = 2;\n');
        expect(inspect()).toMatchObject({
            clean: true,
            relevant_files_checked: 0
        });
    });

    it('fails closed for new and ignored discovery inputs', () => {
        const {projectRoot, inspect} = fixture();
        const generatorPath = resolve(projectRoot, 'src', 'generators', 'new', 'generator.ts');
        mkdirSync(resolve(generatorPath, '..'), {recursive: true});
        writeFileSync(generatorPath, 'export const generator = {};\n', 'utf-8');
        expect(inspect()).toMatchObject({
            clean: false,
            reason: 'graph input changed: src/generators/new/generator.ts'
        });

        rmSync(resolve(projectRoot, 'src', 'generators'), {recursive: true, force: true});
        const checklistPath = resolve(projectRoot, 'src', 'visuals', 'views', 'demo', 'checklist.md');
        mkdirSync(resolve(checklistPath, '..'), {recursive: true});
        writeFileSync(checklistPath, 'ignored checklist\n', 'utf-8');
        expect(inspect()).toMatchObject({
            clean: false,
            reason: 'ignored graph input cannot be observed: src/visuals/views/demo/checklist.md'
        });
    });
});
