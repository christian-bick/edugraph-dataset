import ts from 'typescript';
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
    'exactResolver', 'predicateResolver', 'aggregateResolver', 'compositionalResolver'
]);

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
    const sharedCalls: Record<DeductionOperator, WeakMap<ts.Expression, DeductionCall[]>> = {
        deductCompatible: new WeakMap(), deductAdmitting: new WeakMap()
    };
    const deductionCalls = (root: ts.Expression, rootOwner: ts.SourceFile,
        wanted: DeductionOperator): DeductionCall[] => {
        const found: DeductionCall[] = [];
        const expanded = new Set<ts.Expression>();
        const walk = (node: ts.Node, owner: ts.SourceFile, output: DeductionCall[]): void => {
            if (ts.isCallExpression(node)) {
                const operator = deductionName(index.origin(node.expression, owner.fileName));
                if (operator === wanted) output.push({node, owner});
            }
            if (ts.isIdentifier(node)) {
                const referenced = index.referencedInitializer(node.text, owner.fileName);
                if (referenced && !expanded.has(referenced.expression)) {
                    expanded.add(referenced.expression);
                    const cached = sharedCalls[wanted].get(referenced.expression);
                    if (cached) output.push(...cached);
                    else {
                        const nested: DeductionCall[] = [];
                        sharedCalls[wanted].set(referenced.expression, nested);
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
                report(field === 'rejectedLabels' ? 'SPEC-V4' : 'SPEC-10', field, node,
                    'deductCompatible may appear only in schema capabilities', owner);
            }
        }
        if (field !== 'rejectedLabels') {
            for (const {node, owner} of deductionCalls(initializer, sourceFile, 'deductAdmitting')) {
                report(field === 'schema' ? 'SPEC-10' : 'SPEC-V4', field, node,
                    'deductAdmitting may appear only in rejectedLabels', owner);
            }
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
        if (ts.isPropertyAssignment(node) && nameOf(node.name)
            && ['generalLabels', 'requiredLabels', 'rejectedLabels'].includes(nameOf(node.name)!)) {
            inspectField(nameOf(node.name)!, node.initializer);
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
