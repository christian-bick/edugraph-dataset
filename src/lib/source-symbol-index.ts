import {existsSync, readFileSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import ts from 'typescript';

interface Binding {module: string; imported: string}
interface IndexedSource {
    source: ts.SourceFile;
    imports: Map<string, Binding>;
    values: Map<string, ts.Expression>;
    exports: Map<string, Binding>;
    functions: Set<string>;
}

function localSource(from: string, specifier: string): string | null {
    if (!specifier.startsWith('.')) return null;
    const base = resolve(dirname(from), specifier);
    return [base, `${base}.ts`, `${base}.tsx`, resolve(base, 'index.ts')]
        .find(candidate => existsSync(candidate)) ?? null;
}

/** A bounded, cached index of static source bindings; it does not execute user code. */
export class SourceSymbolIndex {
    private readonly files = new Map<string, IndexedSource>();

    constructor(private readonly read: (path: string) => string = path => readFileSync(path, 'utf-8')) {}

    load(path: string, sourceOverride?: string): ts.SourceFile {
        if (sourceOverride !== undefined) this.files.delete(path);
        if (this.files.has(path)) return this.files.get(path)!.source;
        const source = ts.createSourceFile(path, sourceOverride ?? this.read(path), ts.ScriptTarget.Latest, true,
            path.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
        const entry: IndexedSource = {source, imports: new Map(), values: new Map(),
            exports: new Map(), functions: new Set()};
        this.files.set(path, entry);
        for (const statement of source.statements) {
            if (ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier)) {
                const module = statement.moduleSpecifier.text;
                const bindings = statement.importClause?.namedBindings;
                if (bindings && ts.isNamedImports(bindings)) {
                    for (const element of bindings.elements) entry.imports.set(element.name.text,
                        {module, imported: element.propertyName?.text ?? element.name.text});
                } else if (bindings && ts.isNamespaceImport(bindings)) {
                    entry.imports.set(bindings.name.text, {module, imported: '*'});
                }
            } else if (ts.isExportDeclaration(statement) && statement.moduleSpecifier
                && ts.isStringLiteral(statement.moduleSpecifier)
                && statement.exportClause && ts.isNamedExports(statement.exportClause)) {
                for (const element of statement.exportClause.elements) entry.exports.set(element.name.text,
                    {module: statement.moduleSpecifier.text,
                        imported: element.propertyName?.text ?? element.name.text});
            } else if (ts.isVariableStatement(statement)) {
                for (const declaration of statement.declarationList.declarations) {
                    if (ts.isIdentifier(declaration.name) && declaration.initializer) {
                        entry.values.set(declaration.name.text, declaration.initializer);
                    }
                }
            } else if (ts.isFunctionDeclaration(statement) && statement.name) {
                entry.functions.add(statement.name.text);
            }
        }
        return source;
    }

    private entry(path: string): IndexedSource {
        this.load(path);
        return this.files.get(path)!;
    }

    private bindingOrigin(binding: Binding, from: string, seen: Set<string>): string | undefined {
        const local = localSource(from, binding.module);
        if (!local) return `${binding.module}#${binding.imported}`;
        const key = `${local}#${binding.imported}`;
        if (seen.has(key)) return undefined;
        seen.add(key);
        const entry = this.entry(local);
        const reexport = entry.exports.get(binding.imported);
        if (reexport) return this.bindingOrigin(reexport, local, seen);
        const imported = entry.imports.get(binding.imported);
        if (imported) return this.bindingOrigin(imported, local, seen);
        const initializer = entry.values.get(binding.imported);
        if (initializer) return this.origin(initializer, local, seen) ?? `${local}#${binding.imported}`;
        return entry.functions.has(binding.imported) ? `${local}#${binding.imported}` : undefined;
    }

    origin(expression: ts.Expression, file: string, seen = new Set<string>()): string | undefined {
        const node = ts.isParenthesizedExpression(expression) ? expression.expression : expression;
        if (ts.isIdentifier(node)) {
            const entry = this.entry(file);
            const binding = entry.imports.get(node.text) ?? entry.exports.get(node.text);
            if (binding) return this.bindingOrigin(binding, file, seen);
            const key = `${file}#${node.text}`;
            if (seen.has(key)) return undefined;
            seen.add(key);
            const initializer = entry.values.get(node.text);
            return initializer ? this.origin(initializer, file, seen) : undefined;
        }
        if (ts.isPropertyAccessExpression(node)) {
            const parent = this.origin(node.expression, file, seen);
            return parent?.endsWith('#*') ? `${parent.slice(0, -1)}${node.name.text}` : undefined;
        }
        if (ts.isElementAccessExpression(node) && ts.isStringLiteral(node.argumentExpression)) {
            const parent = this.origin(node.expression, file, seen);
            return parent?.endsWith('#*') ? `${parent.slice(0, -1)}${node.argumentExpression.text}` : undefined;
        }
        return undefined;
    }

    /** Visit an expression and statically referenced constants, at most once per binding. */
    trace(expression: ts.Expression, file: string,
        visit: (node: ts.Node, source: ts.SourceFile) => void,
        seen = new Set<string>()): void {
        const source = this.entry(file).source;
        const walk = (node: ts.Node): void => {
            visit(node, source);
            if (ts.isIdentifier(node)) {
                const entry = this.entry(file);
                const local = entry.values.get(node.text);
                const binding = entry.imports.get(node.text);
                const importedFile = binding ? localSource(file, binding.module) : null;
                const imported = importedFile ? this.entry(importedFile).values.get(binding!.imported) : undefined;
                const next = local ? {file, expression: local} : imported && importedFile
                    ? {file: importedFile, expression: imported} : null;
                if (next) {
                    const key = `${next.file}#${node.text}`;
                    if (!seen.has(key)) {
                        seen.add(key);
                        this.trace(next.expression, next.file, visit, seen);
                    }
                }
            }
            ts.forEachChild(node, walk);
        };
        walk(expression);
    }
}
