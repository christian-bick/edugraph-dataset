import {existsSync, readdirSync} from 'node:fs';
import {extname, relative, resolve} from 'node:path';
import {radixSortUtf8} from './content-identity.ts';

const ASSET_EXTENSIONS = new Set([
    '.avif', '.gif', '.jpeg', '.jpg', '.png', '.svg', '.webp'
]);
const TEMPLATE_EXPRESSION = /\$\{[^}]+\}/g;

const normalizePath = (path: string): string => path.replaceAll('\\', '/');

function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function templatePattern(reference: string): RegExp {
    let pattern = '^';
    let cursor = 0;
    for (const match of reference.matchAll(TEMPLATE_EXPRESSION)) {
        pattern += escapeRegExp(reference.slice(cursor, match.index));
        pattern += '[^/]+';
        cursor = match.index + match[0].length;
    }
    return new RegExp(`${pattern}${escapeRegExp(reference.slice(cursor))}$`);
}

function assetReferences(content: string): string[] {
    return radixSortUtf8([...new Set(
        [...content.matchAll(/\/icons\/[^'"`?#)\s]+/g)].map(match => match[0])
    )]);
}

export function isAssetLibraryPath(path: string): boolean {
    const normalized = normalizePath(path);
    return normalized.startsWith('public/icons/')
        && ASSET_EXTENSIONS.has(extname(normalized).toLowerCase());
}

/**
 * Record-addressed index of the public icon library. Literal references resolve
 * to one record; template references resolve conservatively to every matching
 * record so runtime selection remains an authored view concern.
 */
export class AssetLibraryIndex {
    private readonly root: string;
    private recordsByReference: Map<string, string> | null = null;

    constructor(projectRoot: string) {
        this.root = resolve(projectRoot, 'public', 'icons');
    }

    private records(): Map<string, string> {
        if (this.recordsByReference) return this.recordsByReference;
        const paths: string[] = [];
        const queue = [this.root];
        let cursor = 0;
        while (cursor < queue.length) {
            const directory = queue[cursor++];
            if (!existsSync(directory)) continue;
            for (const entry of readdirSync(directory, {withFileTypes: true})) {
                const path = resolve(directory, entry.name);
                if (entry.isDirectory()) queue.push(path);
                else if (entry.isFile() && ASSET_EXTENSIONS.has(extname(entry.name).toLowerCase())) {
                    paths.push(path);
                }
            }
        }
        this.recordsByReference = new Map(radixSortUtf8(paths).map(path => [
            `/icons/${normalizePath(relative(this.root, path))}`,
            path
        ]));
        return this.recordsByReference;
    }

    filesUsedBy(content: string): string[] {
        const references = assetReferences(content);
        if (references.length === 0) return [];
        const records = this.records();
        const selected = new Set<string>();
        for (const reference of references) {
            if (!reference.includes('${')) {
                const exact = records.get(reference);
                if (exact) selected.add(exact);
                continue;
            }
            const pattern = templatePattern(reference);
            for (const [candidate, path] of records) {
                if (pattern.test(candidate)) selected.add(path);
            }
        }
        return radixSortUtf8([...selected]);
    }
}
