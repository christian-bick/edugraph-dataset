import { existsSync, readdirSync } from 'fs';
import { join, resolve } from 'path';
import {radixSortUtf8} from './content-identity.ts';

export interface LeafModule {
    /** The leaf directory name / module identifier (e.g., 'arithmetic-ops-pairs' or 'ordering') */
    id: string;
    /** The path relative to baseDir (e.g., 'arithmetic/arithmetic-ops-pairs' or 'ordering') */
    relativePath: string;
    /** Absolute filesystem path */
    absolutePath: string;
    /** Category folder name if nested (e.g., 'arithmetic'), else null */
    category: string | null;
}

const leafModuleCache = new Map<string, readonly LeafModule[]>();

/**
 * Discovers all leaf modules in a base directory up to 1-level deep.
 * A directory is considered a leaf module if it contains a `spec.ts` file.
 */
export function findLeafModules(baseDir: string): LeafModule[] {
    const cacheKey = resolve(baseDir);
    const cached = leafModuleCache.get(cacheKey);
    if (cached) return [...cached];
    if (!existsSync(baseDir)) {
        leafModuleCache.set(cacheKey, []);
        return [];
    }

    const results: LeafModule[] = [];
    const entries = readdirSync(baseDir, { withFileTypes: true });

    for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const entryPath = join(baseDir, entry.name);

        if (existsSync(join(entryPath, 'spec.ts'))) {
            results.push({
                id: entry.name,
                relativePath: entry.name,
                absolutePath: entryPath,
                category: null
            });
        } else {
            const subEntries = readdirSync(entryPath, { withFileTypes: true });
            for (const sub of subEntries) {
                if (!sub.isDirectory()) continue;
                const subPath = join(entryPath, sub.name);
                if (existsSync(join(subPath, 'spec.ts'))) {
                    results.push({
                        id: sub.name,
                        relativePath: `${entry.name}/${sub.name}`,
                        absolutePath: subPath,
                        category: entry.name
                    });
                }
            }
        }
    }

    const byPath = new Map(results.map(module => [module.relativePath, module]));
    const stable = radixSortUtf8([...byPath.keys()]).map(path => byPath.get(path)!);
    leafModuleCache.set(cacheKey, stable);
    return [...stable];
}

/** Clears process-local discovery state for watch-mode invalidation and isolated tests. */
export function clearLeafModuleCache(): void {
    leafModuleCache.clear();
}
