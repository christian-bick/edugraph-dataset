import {resolve, dirname, relative} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {findLeafModules, type LeafModule} from './module-resolver.ts';
import {
    getGeneratorProblemTypeFromPath,
    getViewToProblemTypeMap
} from './type-parser.ts';
import {extractSchemaLabels} from './utils.ts';
import {radixSortUtf8} from './content-identity.ts';
import type {ConfigSchema} from '../types/schema.ts';
import type {ViewSpec} from '../types/view-spec.ts';
import type {GeneratorMatchInfo, ViewMatchInfo} from './matching.ts';
import type {WorkCounters} from './work-counters.ts';

const PROJECT_ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));

const camelCase = (value: string): string =>
    value.replace(/-([a-z0-9])/g, match => match[1].toUpperCase());

export interface GeneratorModelDescriptor extends GeneratorMatchInfo {
    module: LeafModule;
    spec: any;
    schema?: ConfigSchema;
}

export interface ViewModelDescriptor extends ViewMatchInfo {
    module: LeafModule;
    spec: ViewSpec;
    schema: ConfigSchema;
}

const generatorCache = new Map<string, readonly GeneratorModelDescriptor[]>();
const viewCache = new Map<string, readonly ViewModelDescriptor[]>();

function selectedLeafModules(
    root: string,
    entryFiles: ReadonlyMap<string, string> | undefined
): LeafModule[] {
    if (!entryFiles) return findLeafModules(root);
    return radixSortUtf8([...entryFiles.keys()]).map(id => {
        const absolutePath = dirname(resolve(entryFiles.get(id)!));
        const relativePath = relative(root, absolutePath).replaceAll('\\', '/');
        const segments = relativePath.split('/');
        return {
            id,
            relativePath,
            absolutePath,
            category: segments.length > 1 ? segments[0] : null
        };
    });
}

/** Loads generator matching and source metadata without importing implementations. */
export async function loadGeneratorModelCatalog(
    generatorsRoot = resolve(PROJECT_ROOT, 'src', 'generators'),
    counters?: WorkCounters,
    entryFiles?: ReadonlyMap<string, string>
): Promise<GeneratorModelDescriptor[]> {
    counters?.add('catalog.generator_loads');
    const root = resolve(generatorsRoot);
    const cached = entryFiles ? undefined : generatorCache.get(root);
    if (cached) {
        counters?.add('catalog.generator_cache_hits');
        return [...cached];
    }

    const modules = selectedLeafModules(root, entryFiles);
    counters?.add('catalog.generator_discoveries');
    counters?.add('catalog.generator_modules', modules.length);
    const entries: GeneratorModelDescriptor[] = [];
    for (const module of modules) {
        const specModule = await import(pathToFileURL(resolve(module.absolutePath, 'spec.ts')).href);
        const schemaName = camelCase(module.id[0].toUpperCase() + module.id.slice(1)) + 'GeneratorSchema';
        const schema: ConfigSchema = specModule[schemaName] ?? {};
        entries.push({
            generatorId: module.id,
            module,
            spec: specModule.spec,
            schema,
            labels: [...new Set([
                ...(specModule.spec?.generalLabels || []),
                ...extractSchemaLabels(schema)
            ])],
            problemType: getGeneratorProblemTypeFromPath(
                resolve(module.absolutePath, 'generator.ts'),
                counters
            )
        });
    }
    if (!entryFiles) generatorCache.set(root, entries);
    return [...entries];
}

/** Loads view matching and render metadata without importing renderer implementations. */
export async function loadViewModelCatalog(
    viewsRoot = resolve(PROJECT_ROOT, 'src', 'visuals', 'views'),
    counters?: WorkCounters,
    entryFiles?: ReadonlyMap<string, string>
): Promise<ViewModelDescriptor[]> {
    counters?.add('catalog.view_loads');
    const root = resolve(viewsRoot);
    const cached = entryFiles ? undefined : viewCache.get(root);
    if (cached) {
        counters?.add('catalog.view_cache_hits');
        return [...cached];
    }

    const viewToType = getViewToProblemTypeMap(counters);
    const modules = selectedLeafModules(root, entryFiles);
    counters?.add('catalog.view_discoveries');
    counters?.add('catalog.view_modules', modules.length);
    const entries: ViewModelDescriptor[] = [];
    for (const module of modules) {
        const specModule = await import(pathToFileURL(resolve(module.absolutePath, 'spec.ts')).href);
        const spec: ViewSpec = specModule.spec;
        const schemaName = camelCase(module.id[0].toUpperCase() + module.id.slice(1)) + 'ViewSchema';
        const schema: ConfigSchema = specModule[schemaName] ?? {};
        entries.push({
            viewId: spec.viewId,
            module,
            spec,
            schema,
            supportedLabels: [...new Set([
                ...(spec.generalLabels || []),
                ...extractSchemaLabels(schema)
            ])],
            requiredTargetAbilities: spec.requiredTargetAbilities || [],
            requiredLabels: spec.requiredLabels || [],
            rejectedLabels: spec.rejectedLabels || [],
            problemType: viewToType[spec.viewId] || null
        });
    }
    if (!entryFiles) viewCache.set(root, entries);
    return [...entries];
}

export function clearModelCatalogCaches(): void {
    generatorCache.clear();
    viewCache.clear();
}
