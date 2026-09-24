import ts from 'typescript';
import {fileURLToPath} from 'node:url';
import {SourceSymbolIndex} from './source-symbol-index.ts';

export interface SpecSourceIssue {
    rule: 'SPEC-6' | 'SPEC-10' | 'SPEC-V4';
    field: string;
    line: number;
    column: number;
    message: string;
    severity?: 'error' | 'review';
}

export interface GeneralLabelDeductionIssue {line: number; column: number}

const nameOf = (name: ts.PropertyName): string | undefined =>
    ts.isIdentifier(name) || ts.isStringLiteral(name) ? name.text : undefined;

const trustedFactoryNames = new Set([
    'hasLabel', 'hasAllLabels', 'hasCapability', 'matchAllCapabilities', 'selectExactLabelMap',
    'selectExactLabelSetMap', 'matchAllExactLabels', 'ontologyNeutral',
    'exactResolver', 'predicateResolver', 'aggregateResolver', 'compositionalResolver', 'withLabelChoices'
]);

const targetPolicyModules = new Set(['./compatibility.ts', './target-policies.ts']
    .map(path => fileURLToPath(new URL(path, import.meta.url)).replaceAll('\\', '/')));

function isTrustedRejection(origin: string | undefined): boolean {
    if (!origin) return false;
    const separator = origin.lastIndexOf('#');
    return origin.slice(separator + 1) === 'rejectTargetLabels'
        && targetPolicyModules.has(origin.slice(0, separator));
}

function deductionName(origin: string | undefined): 'deductCompatible' | 'deductAdmitting' | null {
    if (!origin?.startsWith('edugraph-ts')) return null;
    const name = origin.split('#')[1];
    return name === 'deductCompatible' || name === 'deductAdmitting' ? name : null;
}

/** Mechanical source-form contracts for declaration fields and schema resolvers. */
export function inspectSpecSource(source: string, fileName = 'spec.ts',
    index = new SourceSymbolIndex()): SpecSourceIssue[] {
    const sourceFile = index.load(fileName, source);
    const issues: SpecSourceIssue[] = [];
    const report = (rule: SpecSourceIssue['rule'], field: string, node: ts.Node, message: string,
        owner = sourceFile, severity: SpecSourceIssue['severity'] = 'error'): void => {
        const location = owner.getLineAndCharacterOfPosition(node.getStart(owner));
        issues.push({rule, field, line: location.line + 1, column: location.character + 1, message, severity});
    };
    type DeductionOperator = 'deductCompatible' | 'deductAdmitting';
    type DeductionCall = {node: ts.CallExpression; owner: ts.SourceFile};
    const sharedCalls = new Map<string, WeakMap<ts.Expression, DeductionCall[]>>();
    const deductionCalls = (root: ts.Expression, rootOwner: ts.SourceFile,
        wanted: DeductionOperator, allowRejectionArgument = false): DeductionCall[] => {
        const found: DeductionCall[] = [];
        const expanded = new Set<ts.Expression>();
        const cacheKey = `${wanted}:${allowRejectionArgument}`;
        const cache = sharedCalls.get(cacheKey) ?? new WeakMap<ts.Expression, DeductionCall[]>();
        sharedCalls.set(cacheKey, cache);
        const walk = (node: ts.Node, owner: ts.SourceFile, output: DeductionCall[]): void => {
            if (ts.isCallExpression(node)) {
                const origin = index.origin(node.expression, owner.fileName);
                const operator = deductionName(origin);
                if (operator === wanted) output.push({node, owner});
                if (wanted === 'deductAdmitting' && allowRejectionArgument && isTrustedRejection(origin)) {
                    walk(node.expression, owner, output);
                    // Boundary expansion is meaningful only in this helper's labels argument.
                    node.arguments.forEach((argument, position) => {
                        if (position !== 1) walk(argument, owner, output);
                    });
                    return;
                }
            }
            if (ts.isIdentifier(node)) {
                const referenced = index.referencedInitializer(node.text, owner.fileName);
                if (referenced && !expanded.has(referenced.expression)) {
                    expanded.add(referenced.expression);
                    const cached = cache.get(referenced.expression);
                    if (cached) output.push(...cached);
                    else {
                        const nested: DeductionCall[] = [];
                        cache.set(referenced.expression, nested);
                        walk(referenced.expression, index.load(referenced.file), nested);
                        output.push(...nested);
                    }
                }
            }
            ts.forEachChild(node, child => walk(child, owner, output));
        };
        walk(root, rootOwner, found);
        return found;
    };
    const inspectField = (field: string, initializer: ts.Expression): void => {
        if (field !== 'schema') {
            for (const {node, owner} of deductionCalls(initializer, sourceFile, 'deductCompatible')) {
                report(field === 'compatibility' ? 'SPEC-V4' : 'SPEC-10', field, node,
                    'deductCompatible may appear only in schema capabilities', owner);
            }
        }
        for (const {node, owner} of deductionCalls(initializer, sourceFile, 'deductAdmitting', field === 'compatibility')) {
            report(field === 'schema' ? 'SPEC-10' : 'SPEC-V4', field, node,
                'deductAdmitting may appear only in the labels argument of rejectTargetLabels within compatibility', owner);
        }
    };
    const inspectSchema = (initializer: ts.Expression): void => {
        inspectField('schema', initializer);
        const object = ts.isSatisfiesExpression(initializer) || ts.isAsExpression(initializer)
            ? initializer.expression : initializer;
        if (!ts.isObjectLiteralExpression(object)) return;
        for (const property of object.properties) {
            if (!ts.isPropertyAssignment(property) || !ts.isArrayLiteralExpression(property.initializer)) continue;
            const elements = property.initializer.elements;
            if (elements.length < 2 || !ts.isArrayLiteralExpression(elements[0])) continue;
            const resolver = elements[1];
            const field = nameOf(property.name) ?? 'schema';
            if (ts.isArrowFunction(resolver) || ts.isFunctionExpression(resolver)) {
                report('SPEC-6', field, resolver, 'resolver is defined inline; pass a reference or factory result');
            } else if (ts.isCallExpression(resolver)) {
                const origin = index.origin(resolver.expression, fileName);
                const name = origin?.split('#').at(-1);
                if (name && !trustedFactoryNames.has(name)) {
                    report('SPEC-6', field, resolver, 'resolver is executed in the schema; pass its reference');
                } else if (!name) {
                    report('SPEC-6', field, resolver,
                        'resolver call cannot be traced to an approved curried factory; review its source form',
                        sourceFile, 'review');
                }
            }
        }
    };

    const visit = (node: ts.Node): void => {
        if (ts.isPropertyAssignment(node)) {
            const field = nameOf(node.name);
            if (field === 'requiredLabels' || field === 'rejectedLabels') {
                report('SPEC-V4', field, node,
                    `${field} is no longer supported; declare a named ${field === 'requiredLabels'
                        ? 'requireTargetLabels' : 'rejectTargetLabels'} rule in compatibility`);
            } else if (field === 'generalLabels' || field === 'compatibility') {
                inspectField(field, node.initializer);
            }
        }
        if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)
            && node.name.text.endsWith('Schema') && node.initializer) inspectSchema(node.initializer);
        ts.forEachChild(node, visit);
    };
    visit(sourceFile);
    return issues;
}

/** Backward-compatible projection used by existing audit/report consumers. */
export function findGeneralLabelDeductionIssues(source: string, fileName = 'spec.ts'): GeneralLabelDeductionIssue[] {
    return inspectSpecSource(source, fileName)
        .filter(issue => issue.rule === 'SPEC-10' && issue.field === 'generalLabels')
        .map(({line, column}) => ({line, column}));
}
