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
        .find(candidate => existsSync(candidate))?.replaceAll('\\', '/') ?? null;
}

/** A bounded, cached index of static source bindings; it does not execute user code. */
export class SourceSymbolIndex {
    private readonly files = new Map<string, IndexedSource>();
    private readonly origins = new Map<string, string | null>();
    private readonly initializers = new Map<string,
        {expression: ts.Expression; file: string} | null>();

    constructor(private readonly read: (path: string) => string = path => readFileSync(path, 'utf-8')) {}

    load(path: string, sourceOverride?: string): ts.SourceFile {
        path = path.replaceAll('\\', '/');
        if (sourceOverride !== undefined && this.files.has(path)
            && this.files.get(path)!.source.text !== sourceOverride) {
            this.files.delete(path);
            this.origins.clear();
            this.initializers.clear();
        }
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
        path = path.replaceAll('\\', '/');
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
        file = file.replaceAll('\\', '/');
        const node = ts.isParenthesizedExpression(expression) ? expression.expression : expression;
        if (ts.isIdentifier(node)) {
            const key = `${file}#${node.text}`;
            if (this.origins.has(key)) return this.origins.get(key) ?? undefined;
            if (seen.has(key)) return undefined;
            seen.add(key);
            const entry = this.entry(file);
            const binding = entry.imports.get(node.text) ?? entry.exports.get(node.text);
            if (binding) {
                const origin = this.bindingOrigin(binding, file, seen);
                this.origins.set(key, origin ?? null);
                return origin;
            }
            const initializer = entry.values.get(node.text);
            const origin = initializer ? this.origin(initializer, file, seen) : undefined;
            this.origins.set(key, origin ?? null);
            return origin;
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

    /** Static constant initializer reached by one local or imported identifier. */
    referencedInitializer(name: string, file: string,
        seen = new Set<string>()): {expression: ts.Expression; file: string} | undefined {
        file = file.replaceAll('\\', '/');
        const key = `${file}#${name}`;
        if (this.initializers.has(key)) return this.initializers.get(key) ?? undefined;
        if (seen.has(key)) return undefined;
        seen.add(key);
        const entry = this.entry(file);
        const own = entry.values.get(name);
        if (own) {
            const result = {expression: own, file};
            this.initializers.set(key, result);
            return result;
        }
        const binding = entry.imports.get(name) ?? entry.exports.get(name);
        if (!binding) {
            this.initializers.set(key, null);
            return undefined;
        }
        const local = localSource(file, binding.module);
        const result = local ? this.referencedInitializer(binding.imported, local, seen) : undefined;
        this.initializers.set(key, result ?? null);
        return result;
    }

}
