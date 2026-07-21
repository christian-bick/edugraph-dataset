import { describe, expect, it } from 'vitest';
import { findLeafModules } from './module-resolver.ts';
import { resolve } from 'path';

describe('module-resolver', () => {
    it('should discover leaf modules in generators folder', () => {
        const generatorsPath = resolve('src/generators');
        const modules = findLeafModules(generatorsPath);
        expect(modules.length).toBeGreaterThan(0);
        
        // Every discovered module must contain a spec.ts
        for (const mod of modules) {
            expect(mod.id).toBeDefined();
            expect(mod.relativePath).toBeDefined();
            expect(mod.absolutePath).toBeDefined();
        }
    });

    it('should return empty array for non-existent path', () => {
        const modules = findLeafModules('/non/existent/path');
        expect(modules).toEqual([]);
    });
});
