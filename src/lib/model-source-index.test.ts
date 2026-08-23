import {mkdirSync, mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {afterEach, describe, expect, it} from 'vitest';
import {ModelSourceIndex} from './model-source-index.ts';

const roots: string[] = [];

function fixture(): string {
    const root = mkdtempSync(resolve(tmpdir(), 'edugraph-model-source-'));
    roots.push(root);
    const files: Record<string, string> = {
        'src/view/view.tsx': `
            import {helper} from '../shared/helper.ts';
            import './style.css';
            export const icon = '/icons/cube.svg';
            void helper;
        `,
        'src/shared/helper.ts': `export {value} from './value.ts';`,
        'src/shared/value.ts': 'export const value = 1;',
        'src/view/style.css': `@import './theme.css'; .x { background: url('/icons/dot.svg'); }`,
        'src/view/theme.css': '.x { color: red; }',
        'public/icons/cube.svg': '<svg/>',
        'public/icons/dot.svg': '<svg/>',
        'src/lib/pipeline.ts': `export const pipeline = true;`
    };
    for (const [path, content] of Object.entries(files)) {
        mkdirSync(resolve(root, path, '..'), {recursive: true});
        writeFileSync(resolve(root, path), content, 'utf-8');
    }
    return root;
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
            '/public/icons/cube.svg',
            '/public/icons/dot.svg',
            '/src/shared/helper.ts',
            '/src/shared/value.ts',
            '/src/view/style.css',
            '/src/view/theme.css',
            '/src/view/view.tsx'
        ]);
    });
});
