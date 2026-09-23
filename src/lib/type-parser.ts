import {existsSync, readFileSync} from 'fs';
import {dirname, resolve} from 'path';
import {fileURLToPath} from 'url';
import {findLeafModules} from './module-resolver.ts';
import ts from 'typescript';
import type {WorkCounters} from './work-counters.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..', '..');

interface ProblemTypeGraph {
    viewToProblemType: Record<string, string>;
    members: Map<string, ReadonlySet<string>>;
    typesByMember: Map<string, string[]>;
    acceptedTypes: Map<string, readonly string[]>;
}

let problemTypeGraph: ProblemTypeGraph | undefined;
let generatorProblemTypes: Map<string, string | null> | undefined;
const generatorProblemTypeFiles = new Map<string, string | null>();

const parseProblemTypeGraph = (content: string): ProblemTypeGraph => {
    const viewToProblemType: Record<string, string> = {};

    // Named object contracts are boundaries, not structural TypeScript assignability.
    // Expand only explicit aliases and named unions, including nested unions.
    const declarations = new Map<string, readonly string[] | null>();
    const source = ts.createSourceFile('problems.ts', content, ts.ScriptTarget.Latest, false);
    for (const statement of source.statements) {
        if (!ts.isTypeAliasDeclaration(statement) && !ts.isInterfaceDeclaration(statement)) continue;
        if (statement.name.text === 'ViewTypeMap') {
            if (ts.isInterfaceDeclaration(statement)) {
                for (const member of statement.members) {
                    if (ts.isPropertySignature(member) && ts.isStringLiteral(member.name)
                        && member.type && ts.isTypeReferenceNode(member.type)
                        && ts.isIdentifier(member.type.typeName) && !member.type.typeArguments) {
                        viewToProblemType[member.name.text] = member.type.typeName.text;
                    }
                }
            }
            continue;
        }
        const nodes = ts.isTypeAliasDeclaration(statement)
            ? ts.isUnionTypeNode(statement.type) ? [...statement.type.types] : [statement.type]
            : [];
        const references = nodes.length > 0 && nodes.every(node =>
            ts.isTypeReferenceNode(node) && ts.isIdentifier(node.typeName) && !node.typeArguments);
        declarations.set(statement.name.text, references
            ? nodes.map(node => (node as ts.TypeReferenceNode).typeName.getText(source))
            : null);
    }
    const members = new Map<string, ReadonlySet<string>>();
    const visiting = new Set<string>();
    const expand = (name: string): ReadonlySet<string> => {
        const cached = members.get(name);
        if (cached) return cached;
        if (!declarations.has(name) || visiting.has(name)) return new Set();
        visiting.add(name);
        const children = declarations.get(name);
        const expanded = children?.map(expand);
        const result = expanded
            ? expanded.some(set => set.size === 0) ? new Set<string>() : new Set(expanded.flatMap(set => [...set]))
            : new Set([name]);
        visiting.delete(name);
        members.set(name, result);
        return result;
    };
    const typesByMember = new Map<string, string[]>();
    for (const name of declarations.keys()) {
        for (const member of expand(name)) {
            const posting = typesByMember.get(member);
            if (posting) posting.push(name);
            else typesByMember.set(member, [name]);
        }
    }
    return {viewToProblemType, members, typesByMember, acceptedTypes: new Map()};
};

const loadProblemTypeGraph = (counters?: WorkCounters): ProblemTypeGraph => {
    if (problemTypeGraph) return problemTypeGraph;

    const problemsPath = resolve(PROJECT_ROOT, 'src', 'types', 'problems.ts');
    if (!existsSync(problemsPath)) {
        problemTypeGraph = {
            viewToProblemType: {},
            members: new Map(),
            typesByMember: new Map(),
            acceptedTypes: new Map()
        };
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

    const problemType = readGeneratorProblemTypeFromPath(generatorPath, counters);
    generatorProblemTypeFiles.set(generatorPath, problemType);
    return problemType;
}

/** Parses one generator declaration without consulting process-local caches. */
export function readGeneratorProblemTypeFromPath(
    generatorPath: string,
    counters?: WorkCounters
): string | null {
    let problemType: string | null = null;
    if (existsSync(generatorPath)) {
        counters?.add('type.generator_file_reads');
        const content = readFileSync(generatorPath, 'utf8');
        problemType = parseGeneratorProblemType(content);
    }
    return problemType;
}

/** The declaration-only payload contract, independent of implementation details. */
export function parseGeneratorProblemType(source: string): string | null {
    const match = source.match(/implements\s+ProblemGenerator<([^>]+)>/);
    return match ? match[1].split(',')[0].trim() : null;
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
    const graph = loadProblemTypeGraph(counters);
    const cached = graph.acceptedTypes.get(viewType);
    if (cached) return cached;
    const members = graph.members.get(viewType);
    if (!members?.size) return [];
    const candidates = new Set([...members].flatMap(member => graph.typesByMember.get(member) ?? []));
    const accepted = [...candidates].filter(candidate =>
        [...graph.members.get(candidate)!].every(member => members.has(member)));
    graph.acceptedTypes.set(viewType, accepted);
    return accepted;
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
