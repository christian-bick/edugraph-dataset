import {existsSync, readFileSync} from 'fs';
import {dirname, resolve} from 'path';
import {fileURLToPath} from 'url';
import {findLeafModules} from './module-resolver.ts';
import type {WorkCounters} from './work-counters.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..', '..');

interface ProblemTypeGraph {
    viewToProblemType: Record<string, string>;
    unionMembers: Map<string, readonly string[]>;
}

let problemTypeGraph: ProblemTypeGraph | undefined;
let generatorProblemTypes: Map<string, string | null> | undefined;
const generatorProblemTypeFiles = new Map<string, string | null>();

const parseProblemTypeGraph = (content: string): ProblemTypeGraph => {
    const viewToProblemType: Record<string, string> = {};
    const interfaceMatch = content.match(/export\s+interface\s+ViewTypeMap\s*\{([\s\S]*?)\}/);
    if (interfaceMatch) {
        const regex = /['"]([^'"]+)['"]\s*:\s*(\w+)/;
        for (const line of interfaceMatch[1].split('\n')) {
            const match = line.match(regex);
            if (match) viewToProblemType[match[1]] = match[2];
        }
    }

    const unionMembers = new Map<string, readonly string[]>();
    const unionPattern = /export\s+type\s+(\w+)\s*=\s*((?:\w+\s*\|\s*)+\w+)\s*;/g;
    for (const match of content.matchAll(unionPattern)) {
        unionMembers.set(match[1], match[2].split('|').map(member => member.trim()));
    }

    return {viewToProblemType, unionMembers};
};

const loadProblemTypeGraph = (counters?: WorkCounters): ProblemTypeGraph => {
    if (problemTypeGraph) return problemTypeGraph;

    const problemsPath = resolve(PROJECT_ROOT, 'src', 'types', 'problems.ts');
    if (!existsSync(problemsPath)) {
        problemTypeGraph = {viewToProblemType: {}, unionMembers: new Map()};
        return problemTypeGraph;
    }

    counters?.add('type.problems_file_reads');
    problemTypeGraph = parseProblemTypeGraph(readFileSync(problemsPath, 'utf8'));
    return problemTypeGraph;
};

const loadGeneratorProblemTypes = (counters?: WorkCounters): Map<string, string | null> => {
    if (generatorProblemTypes) return generatorProblemTypes;

    counters?.add('type.generator_discoveries');
    const generatorsDir = resolve(PROJECT_ROOT, 'src', 'generators');
    const result = new Map<string, string | null>();

    for (const leaf of findLeafModules(generatorsDir)) {
        const generatorPath = resolve(leaf.absolutePath, 'generator.ts');
        const problemType = getGeneratorProblemTypeFromPath(generatorPath, counters);
        result.set(leaf.id, problemType);
        result.set(leaf.relativePath, problemType);
    }

    generatorProblemTypes = result;
    return result;
};

export function getGeneratorProblemTypeFromPath(
    generatorPath: string,
    counters?: WorkCounters
): string | null {
    if (generatorProblemTypeFiles.has(generatorPath)) {
        return generatorProblemTypeFiles.get(generatorPath) ?? null;
    }

    let problemType: string | null = null;
    if (existsSync(generatorPath)) {
        counters?.add('type.generator_file_reads');
        const content = readFileSync(generatorPath, 'utf8');
        const match = content.match(/implements\s+ProblemGenerator<([^>]+)>/);
        problemType = match ? match[1].split(',')[0].trim() : null;
    }
    generatorProblemTypeFiles.set(generatorPath, problemType);
    return problemType;
}

export function getViewToProblemTypeMap(counters?: WorkCounters): Record<string, string> {
    return loadProblemTypeGraph(counters).viewToProblemType;
}

/** Parses one explicit type source without consulting or mutating the process cache. */
export function getViewToProblemTypeMapFromPath(
    problemsPath: string,
    counters?: WorkCounters
): Record<string, string> {
    if (!existsSync(problemsPath)) return {};
    counters?.add('type.problems_file_reads');
    return parseProblemTypeGraph(readFileSync(problemsPath, 'utf8')).viewToProblemType;
}

export function getGeneratorProblemType(
    generatorId: string,
    counters?: WorkCounters
): string | null {
    return loadGeneratorProblemTypes(counters).get(generatorId) ?? null;
}

/** Returns the concrete generator payload types accepted by a view payload type. */
export function getAcceptedGeneratorProblemTypes(
    viewType: string,
    counters?: WorkCounters
): readonly string[] {
    const members = loadProblemTypeGraph(counters).unionMembers.get(viewType);
    return members ? [viewType, ...members] : [viewType];
}

/**
 * Returns whether a view payload type accepts a generator payload type.
 * Parsed type information is shared for the lifetime of the operation.
 */
export function isProblemTypeCompatible(
    generatorType: string,
    viewType: string,
    counters?: WorkCounters
): boolean {
    counters?.add('type.compatibility_checks');
    return getAcceptedGeneratorProblemTypes(viewType, counters).includes(generatorType);
}

/** Clears process-local parser state for watch-mode invalidation and isolated tests. */
export function clearTypeParserCaches(): void {
    problemTypeGraph = undefined;
    generatorProblemTypes = undefined;
    generatorProblemTypeFiles.clear();
}
