import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {describe, expect, it} from 'vitest';

function viewRootDeclarations(): string {
    const css = readFileSync(resolve(process.cwd(), 'src/tailwind.css'), 'utf-8');
    const rule = css.match(/#view\s*\{(?<declarations>[^}]*)\}/)?.groups?.declarations;
    if (!rule) throw new Error('Missing the shared #view capture-boundary rule.');
    return rule;
}

describe('view screenshot root', () => {
    it('shrink-wraps ordinary content up to the browser viewport', () => {
        const declarations = viewRootDeclarations();

        expect(declarations).toMatch(/\bwidth:\s*fit-content\s*;/);
        expect(declarations).toMatch(/\bmax-width:\s*100vw\s*;/);
    });
});
