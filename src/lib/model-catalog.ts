import {resolve, dirname, relative, isAbsolute} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {findLeafModules, type LeafModule} from './module-resolver.ts';
import {
    getGeneratorProblemTypeFromPath,
    getViewToProblemTypeMap
} from './type-parser.ts';
import {extractSchemaLabels} from './utils.ts';
import {radixSortUtf8, SourceContentIndex} from './content-identity.ts';
import {ModelSourceIndex} from './model-source-index.ts';
import type {ConfigSchema} from '../types/schema.ts';
import type {ViewSpec} from '../types/view-spec.ts';
import type {GeneratorMatchInfo, ViewMatchInfo} from './matching.ts';
import type {WorkCounters} from './work-counters.ts';

const PROJECT_ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));

/** Shared naming convention for authored schema exports, including numeric name segments. */
export function moduleSchemaExportName(moduleId: string, role: 'generator' | 'view'): string {
    const prefix = (moduleId[0].toUpperCase() + moduleId.slice(1))
        .replace(/-([a-z0-9])/g, match => match[1].toUpperCase());
    return `${prefix}${role === 'generator' ? 'Generator' : 'View'}Schema`;
}

export interface MatchingSourceIdentity {
    /** Content hash of the spec's local source closure, using root-relative paths. */
    matchingSourceHash: string;
    /** Absolute dependency paths for reuse by the authored-source dependency graph. */
    matchingSourcePaths: string[];
}

/** Source identity is optional for hand-built validation descriptors; catalog loaders always supply it. */
export interface GeneratorModelDescriptor extends GeneratorMatchInfo, Partial<MatchingSourceIdentity> {
    module: LeafModule;
    spec: any;
    schema?: ConfigSchema;
    /** Invariant positive capabilities, kept separate from schema-supported alternatives. */
    generalLabels: string[];
}

export interface ViewModelDescriptor extends ViewMatchInfo, Partial<MatchingSourceIdentity> {
    module: LeafModule;
    spec: ViewSpec;
    schema: ConfigSchema;
    /** Invariant positive capabilities, kept separate from schema-supported alternatives. */
    generalLabels: string[];
}

type LoadedGeneratorModelDescriptor = GeneratorModelDescriptor & MatchingSourceIdentity;
type LoadedViewModelDescriptor = ViewModelDescriptor & MatchingSourceIdentity;

const generatorCache = new Map<string, readonly LoadedGeneratorModelDescriptor[]>();
const viewCache = new Map<string, readonly LoadedViewModelDescriptor[]>();

export interface ModelCatalogOptions {
    /** External catalogs with sibling helpers can declare their containing source tree. */
    sourceRoot?: string;
}

function contains(root: string, path: string): boolean {
    const fromRoot = relative(root, path);
    return fromRoot === '' || (!fromRoot.startsWith('..') && !isAbsolute(fromRoot));
}

function catalogSourceRoot(root: string, options: ModelCatalogOptions): string {
    return resolve(options.sourceRoot ?? (contains(PROJECT_ROOT, root) ? PROJECT_ROOT : root));
}

/** Only specs are roots; implementations and rendering assets do not affect matching identity. */
function matchingSourceResolver(sourceRoot: string, counters?: WorkCounters) {
    const sources = new ModelSourceIndex(sourceRoot, {includeAssets: false, counters});
    const contents = new SourceContentIndex(sourceRoot);
    return (specPath: string): MatchingSourceIdentity => {
        if (!contains(sourceRoot, specPath)) {
            throw new Error(`Catalog spec is outside its matching source root: ${specPath}.`);
        }
        const matchingSourcePaths = sources.dependencies([specPath]);
        if (!matchingSourcePaths.includes(specPath)) {
            throw new Error(`Catalog spec has no matching source identity: ${specPath}.`);
        }
        return {matchingSourcePaths, matchingSourceHash: contents.hash(matchingSourcePaths)};
    };
}

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
    entryFiles?: ReadonlyMap<string, string>,
    options: ModelCatalogOptions = {}
): Promise<LoadedGeneratorModelDescriptor[]> {
    counters?.add('catalog.generator_loads');
    const root = resolve(generatorsRoot);
    const sourceRoot = catalogSourceRoot(root, options);
    const cacheKey = `${root}\u0000${sourceRoot}`;
    const cached = entryFiles ? undefined : generatorCache.get(cacheKey);
    if (cached) {
        counters?.add('catalog.generator_cache_hits');
        return [...cached];
    }

    const modules = selectedLeafModules(root, entryFiles);
    counters?.add('catalog.generator_discoveries');
    counters?.add('catalog.generator_modules', modules.length);
    const entries: LoadedGeneratorModelDescriptor[] = [];
    const sourceIdentity = matchingSourceResolver(sourceRoot, counters);
    for (const module of modules) {
        const specPath = resolve(module.absolutePath, 'spec.ts');
        const matchingSources = sourceIdentity(specPath);
        const specModule = await import(pathToFileURL(specPath).href);
        const schemaName = moduleSchemaExportName(module.id, 'generator');
        const schema: ConfigSchema = specModule[schemaName] ?? {};
        const generalLabels = [...new Set<string>(
            (specModule.spec?.generalLabels ?? []) as readonly string[]
        )];
        entries.push({
            generatorId: module.id,
            ...matchingSources,
            module,
            spec: specModule.spec,
            schema,
            generalLabels,
            labels: [...new Set([
                ...generalLabels,
                ...extractSchemaLabels(schema)
            ])],
            problemType: getGeneratorProblemTypeFromPath(
                resolve(module.absolutePath, 'generator.ts'),
                counters
            )
        });
    }
    if (!entryFiles) generatorCache.set(cacheKey, entries);
    return [...entries];
}

/** Loads view matching and render metadata without importing renderer implementations. */
export async function loadViewModelCatalog(
    viewsRoot = resolve(PROJECT_ROOT, 'src', 'visuals', 'views'),
    counters?: WorkCounters,
    entryFiles?: ReadonlyMap<string, string>,
    options: ModelCatalogOptions = {}
): Promise<LoadedViewModelDescriptor[]> {
    counters?.add('catalog.view_loads');
    const root = resolve(viewsRoot);
    const sourceRoot = catalogSourceRoot(root, options);
    const cacheKey = `${root}\u0000${sourceRoot}`;
    const cached = entryFiles ? undefined : viewCache.get(cacheKey);
    if (cached) {
        counters?.add('catalog.view_cache_hits');
        return [...cached];
    }

    const viewToType = getViewToProblemTypeMap(counters);
    const modules = selectedLeafModules(root, entryFiles);
    counters?.add('catalog.view_discoveries');
    counters?.add('catalog.view_modules', modules.length);
    const entries: LoadedViewModelDescriptor[] = [];
    const sourceIdentity = matchingSourceResolver(sourceRoot, counters);
    for (const module of modules) {
        const specPath = resolve(module.absolutePath, 'spec.ts');
        const matchingSources = sourceIdentity(specPath);
        const specModule = await import(pathToFileURL(specPath).href);
        const spec: ViewSpec = specModule.spec;
        const schemaName = moduleSchemaExportName(module.id, 'view');
        const schema: ConfigSchema = specModule[schemaName] ?? {};
        const generalLabels = [...new Set(spec.generalLabels || [])];
        entries.push({
            viewId: spec.viewId,
            ...matchingSources,
            module,
            spec,
            schema,
            generalLabels,
            supportedLabels: [...new Set([
                ...generalLabels,
                ...extractSchemaLabels(schema)
            ])],
            problemType: viewToType[spec.viewId] || null
        });
    }
    if (!entryFiles) viewCache.set(cacheKey, entries);
    return [...entries];
}

export function clearModelCatalogCaches(): void {
    generatorCache.clear();
    viewCache.clear();
}
