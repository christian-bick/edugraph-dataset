import {readFileSync} from 'node:fs';
import {basename, extname, isAbsolute, relative, resolve} from 'node:path';
import type {LeafModule} from './module-resolver.ts';
import {ModelSourceIndex} from './model-source-index.ts';
import {SourceSymbolIndex} from './source-symbol-index.ts';
import {inspectGeneratorEntryValidation, inspectImplementationSource,
    type ImplementationIssue} from './implementation-contracts.ts';
import {radixSortUtf8} from './content-identity.ts';

export interface OwnedImplementationIssue extends ImplementationIssue {
    role: 'generator' | 'view';
    module_id: string;
    file: string;
}

function inside(path: string, root: string): boolean {
    const fromRoot = relative(root, path);
    return fromRoot === '' || (!fromRoot.startsWith('..') && !isAbsolute(fromRoot));
}

/** Inspect each reachable implementation file once, then attach every affected module owner. */
export function inspectModuleImplementations(projectRoot: string, options: {
    generators: readonly LeafModule[];
    views: readonly LeafModule[];
    generatorSchemaSizes?: ReadonlyMap<string, number>;
    changedFiles?: readonly string[];
}): OwnedImplementationIssue[] {
    const sourceGraph = new ModelSourceIndex(projectRoot, {includeAssets: false});
    const symbols = new SourceSymbolIndex();
    const roots = {
        generator: resolve(projectRoot, 'src/generators'),
        view: resolve(projectRoot, 'src/visuals')
    };
    const owners = new Map<string, Array<{role: 'generator' | 'view'; id: string}>>();
    const changed = options.changedFiles ? new Set(options.changedFiles.map(file => resolve(projectRoot, file))) : null;
    const affectedGenerators = new Set<string>();
    const collect = (role: 'generator' | 'view', modules: readonly LeafModule[]): void => {
        for (const module of modules) {
            const entry = resolve(module.absolutePath, role === 'generator' ? 'generator.ts' : 'view.tsx');
            for (const file of sourceGraph.dependencies([entry])) {
                if (role === 'generator' && changed?.has(file)) affectedGenerators.add(module.id);
                if (!inside(file, roots[role]) || !['.ts', '.tsx'].includes(extname(file))
                    || basename(file) === 'spec.ts' || basename(file).includes('.test.')
                    || file === resolve(projectRoot, 'src/visuals/views/withConfig.tsx')) continue;
                const list = owners.get(file) ?? [];
                list.push({role, id: module.id});
                owners.set(file, list);
            }
        }
    };
    collect('generator', options.generators);
    collect('view', options.views);
    const issues: OwnedImplementationIssue[] = [];
    for (const file of radixSortUtf8([...owners.keys()])) {
        if (changed && !changed.has(file)) continue;
        const source = readFileSync(file, 'utf-8');
        const display = relative(projectRoot, file).replaceAll('\\', '/');
        for (const role of new Set(owners.get(file)!.map(owner => owner.role))) {
            const findings = inspectImplementationSource(source, file, role, symbols);
            for (const owner of owners.get(file)!.filter(owner => owner.role === role)) {
                for (const finding of findings) issues.push({...finding, role,
                    module_id: owner.id, file: display});
            }
        }
    }
    for (const generator of options.generators) {
        if (changed && !affectedGenerators.has(generator.id)) continue;
        if (!options.generatorSchemaSizes?.get(generator.id)) continue;
        const entry = resolve(generator.absolutePath, 'generator.ts');
        const source = readFileSync(entry, 'utf-8');
        const findings = inspectGeneratorEntryValidation(source, entry, true);
        if (findings.length === 0) continue;
        const closure = sourceGraph.dependencies([entry]);
        const reachableValidation = closure.some(file => ['.ts', '.tsx'].includes(extname(file))
            && /\bvalidateConfigFields\s*\(/.test(readFileSync(file, 'utf-8')));
        for (const finding of findings) issues.push({...finding,
            severity: reachableValidation ? 'review' : 'error',
            role: 'generator', module_id: generator.id,
            file: relative(projectRoot, entry).replaceAll('\\', '/')});
    }
    return issues;
}
