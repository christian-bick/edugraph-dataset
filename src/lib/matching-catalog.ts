import {resolve} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {findLeafModules} from './module-resolver.ts';
import {
    getGeneratorProblemTypeFromPath,
    getViewToProblemTypeMap
} from './type-parser.ts';
import {extractSchemaLabels} from './utils.ts';
import type {ConfigSchema} from '../types/schema.ts';
import type {ViewSpec} from '../types/view-spec.ts';
import type {GeneratorMatchInfo, ViewMatchInfo} from './matching.ts';
import type {WorkCounters} from './work-counters.ts';

const PROJECT_ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));

const camelCase = (value: string): string =>
    value.replace(/-([a-z0-9])/g, match => match[1].toUpperCase());

const generatorCache = new Map<string, readonly GeneratorMatchInfo[]>();
const viewCache = new Map<string, readonly ViewMatchInfo[]>();

/** Loads only matching semantics; generator implementations are never imported or executed. */
export async function loadGeneratorMatchCatalog(
    generatorsRoot = resolve(PROJECT_ROOT, 'src', 'generators'),
    counters?: WorkCounters
): Promise<GeneratorMatchInfo[]> {
    counters?.add('catalog.generator_loads');
    const root = resolve(generatorsRoot);
    const cached = generatorCache.get(root);
    if (cached) {
        counters?.add('catalog.generator_cache_hits');
        return [...cached];
    }

    const modules = findLeafModules(root);
    counters?.add('catalog.generator_discoveries');
    counters?.add('catalog.generator_modules', modules.length);
    const entries: GeneratorMatchInfo[] = [];
    for (const module of modules) {
        const specModule = await import(pathToFileURL(resolve(module.absolutePath, 'spec.ts')).href);
        const schemaName = camelCase(module.id[0].toUpperCase() + module.id.slice(1)) + 'GeneratorSchema';
        const schema: ConfigSchema = specModule[schemaName] ?? {};
        entries.push({
            generatorId: module.id,
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
    generatorCache.set(root, entries);
    return [...entries];
}

/** Loads only view matching semantics; renderer implementations are never imported. */
export async function loadViewMatchCatalog(
    viewsRoot = resolve(PROJECT_ROOT, 'src', 'visuals', 'views'),
    counters?: WorkCounters
): Promise<ViewMatchInfo[]> {
    counters?.add('catalog.view_loads');
    const root = resolve(viewsRoot);
    const cached = viewCache.get(root);
    if (cached) {
        counters?.add('catalog.view_cache_hits');
        return [...cached];
    }

    const viewToType = getViewToProblemTypeMap(counters);
    const modules = findLeafModules(root);
    counters?.add('catalog.view_discoveries');
    counters?.add('catalog.view_modules', modules.length);
    const entries: ViewMatchInfo[] = [];
    for (const module of modules) {
        const specModule = await import(pathToFileURL(resolve(module.absolutePath, 'spec.ts')).href);
        const spec: ViewSpec = specModule.spec;
        const schemaName = camelCase(module.id[0].toUpperCase() + module.id.slice(1)) + 'ViewSchema';
        const schema: ConfigSchema = specModule[schemaName] ?? {};
        entries.push({
            viewId: spec.viewId,
            supportedLabels: [...new Set([
                ...(spec.generalLabels || []),
                ...extractSchemaLabels(schema)
            ])],
            requiredLabels: spec.requiredLabels || [],
            rejectedLabels: spec.rejectedLabels || [],
            problemType: viewToType[spec.viewId] || null
        });
    }
    viewCache.set(root, entries);
    return [...entries];
}

export function clearMatchingCatalogCaches(): void {
    generatorCache.clear();
    viewCache.clear();
}
