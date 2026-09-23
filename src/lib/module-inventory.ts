import {existsSync, readFileSync, readdirSync} from 'node:fs';
import {resolve} from 'node:path';
import ts from 'typescript';
import type {LeafModule} from './module-resolver.ts';
import {moduleSchemaExportName} from './model-catalog.ts';

export interface ModuleInventoryIssue {
    rule: 'IMPL-2' | 'IMPL-4' | 'SPEC-G1' | 'SPEC-V1' | 'IMPL-V1' | 'CHK-V6';
    role: 'generator' | 'view';
    module_id: string;
    file: string;
    message: string;
}

function exportedNames(source: string, file: string): Set<string> {
    const root = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
    const names = new Set<string>();
    for (const statement of root.statements) {
        if (ts.isExportDeclaration(statement) && statement.exportClause
            && ts.isNamedExports(statement.exportClause)) {
            for (const element of statement.exportClause.elements) names.add(element.name.text);
            continue;
        }
        if (!ts.canHaveModifiers(statement)
            || !ts.getModifiers(statement)?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)) continue;
        if ((ts.isVariableStatement(statement))) {
            for (const declaration of statement.declarationList.declarations) {
                if (ts.isIdentifier(declaration.name)) names.add(declaration.name.text);
            }
        } else if ((ts.isTypeAliasDeclaration(statement) || ts.isInterfaceDeclaration(statement)
            || ts.isClassDeclaration(statement)
            || ts.isFunctionDeclaration(statement)) && statement.name) names.add(statement.name.text);
    }
    return names;
}

/** Required leaf files/exports and declared view payload mappings. */
export function inspectModuleInventory(options: {
    generators: readonly LeafModule[];
    views: readonly LeafModule[];
    viewTypes: Readonly<Record<string, string>>;
    generatorRoot?: string;
}): ModuleInventoryIssue[] {
    const issues: ModuleInventoryIssue[] = [];
    const inspect = (role: 'generator' | 'view', module: LeafModule): void => {
        const required = role === 'generator'
            ? ['generator.ts', 'spec.ts', 'generator.test.ts', 'spec.test.ts']
            : ['view.html', 'view.tsx', 'spec.ts', 'checklist.md'];
        const add = (rule: ModuleInventoryIssue['rule'], name: string, message: string): void => {
            issues.push({rule, role, module_id: module.id, file: resolve(module.absolutePath, name), message});
        };
        for (const name of required) {
            if (!existsSync(resolve(module.absolutePath, name))) add('IMPL-4', name, `missing required ${name}`);
        }
        const specPath = resolve(module.absolutePath, 'spec.ts');
        if (existsSync(specPath)) {
            const names = exportedNames(readFileSync(specPath, 'utf-8'), specPath);
            const rule = role === 'generator' ? 'SPEC-G1' : 'SPEC-V1';
            if (!names.has('spec')) add(rule, 'spec.ts', 'missing exported spec');
            const schema = moduleSchemaExportName(module.id, role);
            if (!names.has(schema)) add(rule, 'spec.ts', `missing exported ${schema}`);
            if (![...names].some(name => name.endsWith(role === 'generator' ? 'GeneratorConfig' : 'ViewConfig'))) {
                add(rule, 'spec.ts', 'missing exported configuration type');
            }
        }
        if (role === 'view') {
            if (!options.viewTypes[module.id]) add('SPEC-V1', 'view.tsx', 'missing ViewTypeMap payload mapping');
            const checklist = resolve(module.absolutePath, 'checklist.md');
            if (existsSync(checklist) && /^#{1,6}\s/m.test(readFileSync(checklist, 'utf-8'))) {
                add('CHK-V6', 'checklist.md', 'leaf checklist must not contain Markdown headings');
            }
            const view = resolve(module.absolutePath, 'view.tsx');
            if (existsSync(view) && !/\bwithConfig\s*\(/.test(readFileSync(view, 'utf-8'))) {
                add('IMPL-V1', 'view.tsx', 'leaf view does not wrap its core with withConfig');
            }
        }
    };
    for (const module of options.generators) inspect('generator', module);
    for (const module of options.views) inspect('view', module);
    const known = new Set(options.views.map(module => module.id));
    for (const id of Object.keys(options.viewTypes)) {
        if (!known.has(id)) issues.push({rule: 'SPEC-V1', role: 'view', module_id: id,
            file: 'src/types/problems.ts', message: 'ViewTypeMap entry has no discovered leaf view'});
    }
    if (options.generatorRoot && existsSync(options.generatorRoot)) {
        const known = new Set(options.generators.map(module => resolve(module.absolutePath)));
        const directories = readdirSync(options.generatorRoot, {withFileTypes: true})
            .filter(entry => entry.isDirectory())
            .flatMap(entry => {
                const path = resolve(options.generatorRoot!, entry.name);
                return [path, ...readdirSync(path, {withFileTypes: true})
                    .filter(child => child.isDirectory()).map(child => resolve(path, child.name))];
            });
        for (const path of directories) {
            if (existsSync(resolve(path, 'generator.ts')) && !known.has(path)) {
                issues.push({rule: 'IMPL-2', role: 'generator', module_id: path.split(/[\\/]/).at(-1)!,
                    file: resolve(path, 'generator.ts'), message: 'generator implementation has no discoverable spec.ts leaf'});
            }
        }
    }
    return issues;
}
