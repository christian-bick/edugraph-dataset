import {copyFileSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {dirname, resolve, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {afterEach, describe, expect, it} from 'vitest';
import {collectDocumentation} from './docs-discovery.ts';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const fixtureRoot = resolve(projectRoot, 'temp/docs-discovery-fixtures');
const fixtures: string[] = [];

function fixture(): string {
    mkdirSync(fixtureRoot, {recursive: true});
    const root = mkdtempSync(resolve(fixtureRoot, 'gate-'));
    fixtures.push(root);
    return root;
}

function write(root: string, path: string, content: string): void {
    const destination = resolve(root, path);
    mkdirSync(dirname(destination), {recursive: true});
    writeFileSync(destination, content);
}

afterEach(() => {
    for (const root of fixtures.splice(0)) {
        if (!resolve(root).startsWith(`${fixtureRoot}${sep}`)) throw new Error('Unexpected fixture cleanup path');
        rmSync(root, {recursive: true, force: true});
    }
});

describe('documentation discovery', () => {
    it('tolerates missing documentation roots and consumers', () => {
        expect(collectDocumentation(fixture())).toEqual(new Map());
    });

    it('recursively collects Markdown from docs and skills, with stable repository-relative paths', () => {
        const root = fixture();
        const paths = [
            'docs/spec-general.md', 'docs/plan/nested/migration.md',
            '.agents/skills/review/SKILL.md', '.agents/skills/review/references/nested/EXAMPLE.MD',
            'DOCS.md', 'AGENTS.md', 'README.md',
        ];
        for (const path of paths) write(root, path, path);
        write(root, 'docs/plan/ignored.json', '{}');
        write(root, 'src/ignored.md', '# Outside authored documentation');
        const first = collectDocumentation(root);
        expect([...first.keys()].sort()).toEqual([...paths].sort());
        expect([...first]).toEqual([...collectDocumentation(root)]);
        for (const [path, content] of first) expect(content).toBe(path);
    });

    it('does not follow directory links or revisit a linked tree', () => {
        const root = fixture();
        write(root, 'docs/plan/real.md', '# Plan');
        symlinkSync(resolve(root, 'docs'), resolve(root, 'docs/plan/loop'), 'junction');
        expect([...collectDocumentation(root).keys()]).toEqual(['docs/plan/real.md']);
    });

    it('does not traverse a linked documentation root', () => {
        const root = fixture();
        write(root, 'other/example.md', '# Outside documentation');
        symlinkSync(resolve(root, 'other'), resolve(root, 'docs'), 'junction');
        expect(collectDocumentation(root)).toEqual(new Map());
    });
});

/** Runs the unmodified check:docs entry point against an isolated repository fixture. */
function runCheckDocs(root: string) {
    for (const path of ['src/scripts/validate-docs.ts', 'src/lib/docs-validator.ts', 'src/lib/docs-discovery.ts']) {
        mkdirSync(dirname(resolve(root, path)), {recursive: true});
        copyFileSync(resolve(projectRoot, path), resolve(root, path));
    }
    write(root, 'package.json', JSON.stringify({type: 'module'}));
    write(root, 'vite.config.js', 'export default {};');
    return spawnSync(process.execPath, [
        resolve(projectRoot, 'node_modules/vite-node/dist/cli.mjs'), 'src/scripts/validate-docs.ts'
    ], {cwd: root, encoding: 'utf8', timeout: 30_000});
}

function commandFixture(): string {
    const root = fixture();
    write(root, 'docs/README.md', '# References\n[Rules](spec-general.md)\n');
    write(root, 'docs/spec-general.md', '# Rules\n### SPEC-1 — Matching\n## Audit\nSPEC-1\n');
    write(root, 'docs/plan/nested/migration.md', '# Migration\nSee SPEC-1.\n');
    write(root, '.agents/skills/review/SKILL.md', '# Review\n[Guide](references/guide.md#steps)\n');
    write(root, '.agents/skills/review/references/guide.md', '# Guide\n## Steps\nSee SPEC-1.\n');
    return root;
}

describe('public check:docs command', () => {
    it('accepts nested plans and skill references without normative Audit sections', () => {
        const result = runCheckDocs(commandFixture());
        expect(result.error).toBeUndefined();
        expect(result.status, result.stdout + result.stderr).toBe(0);
        expect(result.stdout).toContain('Files Scanned:     5');
        expect(result.stdout).toContain('Documentation references valid');
    }, 35_000);

    it('fails through the command for a broken deeply nested plan link', () => {
        const root = commandFixture();
        write(root, 'docs/plan/nested/migration.md', '# Migration\n[missing](missing.md)\n');
        const result = runCheckDocs(root);
        expect(result.error).toBeUndefined();
        expect(result.status, result.stdout + result.stderr).toBe(1);
        expect(result.stderr).toContain('docs/plan/nested/migration.md: link target "missing.md" does not exist');
        expect(result.stderr).not.toContain('has no "## Audit"');
    }, 35_000);

    it('fails through the command for undefined rules and broken cross-file anchors in skill references', () => {
        const root = commandFixture();
        write(root, '.agents/skills/review/references/guide.md',
            '# Guide\n## Steps\nSee SPEC-999 and [plan](../../../../docs/plan/nested/migration.md#missing).\n');
        const result = runCheckDocs(root);
        expect(result.error).toBeUndefined();
        expect(result.status, result.stdout + result.stderr).toBe(1);
        expect(result.stderr).toContain('references/guide.md: cites rule SPEC-999');
        expect(result.stderr).toContain('unknown anchor "#missing" in docs/plan/nested/migration.md');
    }, 35_000);
});
