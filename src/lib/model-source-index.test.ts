import {mkdirSync, mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {afterEach, describe, expect, it} from 'vitest';
import {ModelSourceIndex} from './model-source-index.ts';
import {createWorkCounters} from './work-counters.ts';

const roots: string[] = [];

function fixture(): string {
    const root = mkdtempSync(resolve(tmpdir(), 'edugraph-model-source-'));
    roots.push(root);
    const files: Record<string, string> = {
        'src/view/view.tsx': `
            import {helper} from '../shared/helper.ts';
            import './style.css';
            export const icon = '/icons/cube.svg';
            export const countIcon = (name: string) => \`/icons/counting/\${name}\`;
            void helper;
        `,
        'src/shared/helper.ts': `export {value} from './value.ts';`,
        'src/shared/value.ts': 'export const value = 1;',
        'src/view/style.css': `@import './theme.css'; .x { background: url('/icons/dot.svg'); }`,
        'src/view/theme.css': '.x { color: red; }',
        'public/icons/cube.svg': '<svg/>',
        'public/icons/dot.svg': '<svg/>',
        'public/icons/counting/circle.svg': '<svg/>',
        'public/icons/counting/square.svg': '<svg/>',
        'public/icons/unrelated/clock.svg': '<svg/>',
        'src/lib/pipeline.ts': `export const pipeline = true;`
    };
    for (const [path, content] of Object.entries(files)) {
        mkdirSync(resolve(root, path, '..'), {recursive: true});
        writeFileSync(resolve(root, path), content, 'utf-8');
    }
    return root;
}

function chainFixture(count: number): {root: string; entry: string} {
    const root = mkdtempSync(resolve(tmpdir(), 'edugraph-model-source-chain-'));
    roots.push(root);
    for (let index = 0; index < count; index++) {
        const next = index + 1 < count ? `import './file-${index + 1}.ts';\n` : '';
        const path = resolve(root, 'src', `file-${index}.ts`);
        mkdirSync(resolve(path, '..'), {recursive: true});
        writeFileSync(path, `${next}export const value${index} = ${index};\n`, 'utf-8');
    }
    return {root, entry: resolve(root, 'src', 'file-0.ts')};
}

afterEach(() => {
    for (const root of roots.splice(0)) rmSync(root, {recursive: true, force: true});
});

describe('ModelSourceIndex', () => {
    it('follows only inherent local code, style, and public-asset dependencies', () => {
        const root = fixture();
        const index = new ModelSourceIndex(root);
        expect(index.dependencies([resolve(root, 'src/view/view.tsx')])
            .map(path => path.replace(root, '').replaceAll('\\', '/'))).toEqual([
            '/public/icons/counting/circle.svg',
            '/public/icons/counting/square.svg',
            '/public/icons/cube.svg',
            '/public/icons/dot.svg',
            '/src/shared/helper.ts',
            '/src/shared/value.ts',
            '/src/view/style.css',
            '/src/view/theme.css',
            '/src/view/view.tsx'
        ]);
    });

    it('can exclude presentation assets from semantic model indexing', () => {
        const root = fixture();
        const index = new ModelSourceIndex(root, {includeAssets: false});
        expect(index.dependencies([resolve(root, 'src/view/view.tsx')])
            .some(path => path.includes('public'))).toBe(false);
    });

    it('counts each cached source parse once', () => {
        const root = fixture();
        const counters = createWorkCounters();
        const index = new ModelSourceIndex(root, {includeAssets: false, counters});
        const entry = resolve(root, 'src/view/view.tsx');
        index.dependencies([entry]);
        const reads = counters.get('model_source.files_read');
        const bytes = counters.get('model_source.bytes_read');
        index.dependencies([entry]);
        expect(counters.get('model_source.files_read')).toBe(reads);
        expect(counters.get('model_source.bytes_read')).toBe(bytes);
        expect(reads).toBe(5);
        expect(bytes).toBeGreaterThan(0);
    });

    it('keeps import-closure parsing work linear in reachable files', () => {
        const run = (count: number) => {
            const {root, entry} = chainFixture(count);
            const counters = createWorkCounters();
            const index = new ModelSourceIndex(root, {includeAssets: false, counters});
            expect(index.dependencies([entry])).toHaveLength(count);
            return counters.get('model_source.files_read');
        };
        expect(run(20)).toBe(run(10) * 2);
    });
});
