import {existsSync, readFileSync, statSync} from 'node:fs';
import {dirname, extname, isAbsolute, relative, resolve} from 'node:path';
import * as ts from 'typescript';
import {radixSortUtf8} from './content-identity.ts';

const MODULE_EXTENSIONS = [
    '', '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.css', '.scss'
] as const;
const INDEX_FILES = MODULE_EXTENSIONS.filter(Boolean).map(extension => `index${extension}`);
const CODE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const STYLE_EXTENSIONS = new Set(['.css', '.scss']);

function within(path: string, root: string): boolean {
    const fromRoot = relative(root, path);
    return fromRoot === '' || (!fromRoot.startsWith('..') && !isAbsolute(fromRoot));
}

function existingFile(path: string): string | null {
    return existsSync(path) && statSync(path).isFile() ? path : null;
}

function resolveLocalSpecifier(importer: string, specifier: string): string | null {
    if (!specifier.startsWith('.')) return null;
    const base = resolve(dirname(importer), specifier);
    for (const extension of MODULE_EXTENSIONS) {
        const candidate = existingFile(`${base}${extension}`);
        if (candidate) return candidate;
    }
    for (const file of INDEX_FILES) {
        const candidate = existingFile(resolve(base, file));
        if (candidate) return candidate;
    }
    return null;
}

function codeSpecifiers(path: string, content: string): string[] {
    const source = ts.createSourceFile(
        path,
        content,
        ts.ScriptTarget.Latest,
        false,
        path.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    );
    const specifiers: string[] = [];
    const visit = (node: ts.Node): void => {
        if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node))
            && node.moduleSpecifier
            && ts.isStringLiteralLike(node.moduleSpecifier)) {
            specifiers.push(node.moduleSpecifier.text);
        } else if (ts.isCallExpression(node)
            && node.arguments.length === 1
            && ts.isStringLiteralLike(node.arguments[0])
            && (node.expression.kind === ts.SyntaxKind.ImportKeyword
                || (ts.isIdentifier(node.expression) && node.expression.text === 'require'))) {
            specifiers.push(node.arguments[0].text);
        }
        ts.forEachChild(node, visit);
    };
    visit(source);
    return specifiers;
}

function styleSpecifiers(content: string): string[] {
    const specifiers: string[] = [];
    for (const match of content.matchAll(/@(?:import|use)\s+(?:url\()?\s*['"]([^'"]+)['"]/g)) {
        specifiers.push(match[1]);
    }
    for (const match of content.matchAll(/url\(\s*['"]?([^)'"\s]+)['"]?\s*\)/g)) {
        specifiers.push(match[1]);
    }
    return specifiers;
}

function publicAssets(projectRoot: string, content: string): string[] {
    const paths: string[] = [];
    for (const match of content.matchAll(/['"`]\/icons\/([^'"`?#)\s]+)/g)) {
        const path = existingFile(resolve(projectRoot, 'public', 'icons', match[1]));
        if (path) paths.push(path);
    }
    return paths;
}

/**
 * Resolves the authored local dependency closure of generator/view entry files.
 * Build, matching, validation, and cache machinery are not roots. External
 * packages are deliberately outside this index and require an explicit graph
 * rebuild when their behavior changes.
 */
export class ModelSourceIndex {
    private readonly projectRoot: string;
    private readonly direct = new Map<string, readonly string[]>();
    private readonly closure = new Map<string, readonly string[]>();

    constructor(projectRoot: string) {
        this.projectRoot = resolve(projectRoot);
    }

    private dependenciesOf(rawPath: string): readonly string[] {
        const path = resolve(rawPath);
        const cached = this.direct.get(path);
        if (cached) return cached;
        if (!within(path, this.projectRoot) || !existingFile(path)) {
            this.direct.set(path, []);
            return [];
        }
        const content = readFileSync(path, 'utf-8');
        const extension = extname(path);
        const specifiers = CODE_EXTENSIONS.has(extension)
            ? codeSpecifiers(path, content)
            : STYLE_EXTENSIONS.has(extension)
                ? styleSpecifiers(content)
                : [];
        const localDependencies = specifiers
            .map(specifier => resolveLocalSpecifier(path, specifier))
            .filter((dependency): dependency is string => dependency !== null);
        const dependencies = [
            ...localDependencies,
            ...publicAssets(this.projectRoot, content)
        ].filter((dependency): dependency is string =>
            within(dependency, this.projectRoot) && !dependency.includes(`${resolve(this.projectRoot, 'node_modules')}`));
        const normalized = radixSortUtf8([...new Set(dependencies)]);
        this.direct.set(path, normalized);
        return normalized;
    }

    dependencies(entryPaths: readonly string[]): string[] {
        const result = new Set<string>();
        for (const rawEntry of entryPaths) {
            const entry = resolve(rawEntry);
            const cached = this.closure.get(entry);
            if (cached) {
                for (const path of cached) result.add(path);
                continue;
            }
            const visited = new Set<string>();
            const queue = [entry];
            let cursor = 0;
            while (cursor < queue.length) {
                const path = queue[cursor++];
                if (visited.has(path) || !within(path, this.projectRoot) || !existingFile(path)) continue;
                visited.add(path);
                for (const dependency of this.dependenciesOf(path)) {
                    if (!visited.has(dependency)) queue.push(dependency);
                }
            }
            const paths = radixSortUtf8([...visited]);
            this.closure.set(entry, paths);
            for (const path of paths) result.add(path);
        }
        return radixSortUtf8([...result]);
    }

}
