import ts from 'typescript';
import {SourceSymbolIndex} from './source-symbol-index.ts';

export interface ImplementationIssue {
    rule: 'IMPL-G2' | 'IMPL-G3' | 'IMPL-V1' | 'IMPL-V9' | 'IMPL-4';
    line: number;
    column: number;
    message: string;
    severity?: 'error' | 'review';
    kind?: 'raw-label-access' | 'raw-ontology-iri' | 'implementation-contract';
    value?: string;
}

/** Only an executed entry statement proves ordering; other patterns need review. */
export function inspectGeneratorEntryValidation(source: string, file: string,
    hasSchemaParameters: boolean): ImplementationIssue[] {
    if (!hasSchemaParameters) return [];
    const root = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
    const issues: ImplementationIssue[] = [];
    const visit = (node: ts.Node): void => {
        if (ts.isMethodDeclaration(node) && node.name.getText(root) === 'generate' && node.body) {
            const first = node.body.statements[0];
            const direct = first && ts.isExpressionStatement(first) && ts.isCallExpression(first.expression)
                && ts.isIdentifier(first.expression.expression)
                && first.expression.expression.text === 'validateConfigFields';
            if (!direct) {
                const {line, character} = root.getLineAndCharacterOfPosition(node.getStart(root));
                issues.push({rule: 'IMPL-G2', line: line + 1, column: character + 1,
                    message: 'nonempty schema has no proven validation as the first generate statement',
                    severity: 'review'});
            }
        }
        ts.forEachChild(node, visit);
    };
    visit(root);
    return issues;
}

type SourceKind = 'payload' | 'problem' | 'props';

function property(node: ts.PropertyAccessExpression | ts.ElementAccessExpression): string | undefined {
    return ts.isPropertyAccessExpression(node) ? node.name.text
        : ts.isStringLiteral(node.argumentExpression) ? node.argumentExpression.text : undefined;
}

/** Syntax-aware checks for a module implementation or reachable implementation helper. */
export function inspectImplementationSource(source: string, file: string, role: 'generator' | 'view',
    symbols = new SourceSymbolIndex()): ImplementationIssue[] {
    const sourceFile = symbols.load(file, source);
    const scopes: Array<Map<string, SourceKind | null>> = [new Map()];
    const bind = (name: string, kind: SourceKind | null): void => {
        scopes[scopes.length - 1].set(name, kind);
    };
    const lookup = (name: string): SourceKind | undefined => {
        for (let index = scopes.length - 1; index >= 0; index--) {
            if (scopes[index].has(name)) return scopes[index].get(name) ?? undefined;
        }
        return name === 'payload' ? 'payload' : name === 'problem' ? 'problem'
            : name === 'props' ? 'props' : undefined;
    };
    const issues: ImplementationIssue[] = [];
    const report = (rule: ImplementationIssue['rule'], node: ts.Node, message: string,
        kind: NonNullable<ImplementationIssue['kind']> = 'implementation-contract'): void => {
        const {line, character} = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
        issues.push({rule, line: line + 1, column: character + 1, message,
            kind, value: node.getText(sourceFile)});
    };
    const kindOf = (expression: ts.Expression): SourceKind | undefined => {
        if (ts.isIdentifier(expression)) {
            return lookup(expression.text);
        }
        if (ts.isPropertyAccessExpression(expression) || ts.isElementAccessExpression(expression)) {
            const parent = kindOf(expression.expression);
            const name = property(expression);
            if (parent === 'props' && name === 'payload') return 'payload';
            if (parent === 'payload' && name === 'problem') return 'problem';
        }
        return undefined;
    };
    const inspectBinding = (name: ts.BindingName, initializer: ts.Expression): void => {
        const kind = kindOf(initializer);
        if (!kind) {
            if (ts.isIdentifier(name)) bind(name.text, null);
            return;
        }
        if (ts.isIdentifier(name)) {
            bind(name.text, kind);
        } else if (ts.isObjectBindingPattern(name)) {
            for (const element of name.elements) {
                const key = element.propertyName && ts.isIdentifier(element.propertyName)
                    ? element.propertyName.text : ts.isIdentifier(element.name) ? element.name.text : undefined;
                if (!key) continue;
                if ((kind === 'payload' || kind === 'problem')
                    && (key === 'labels' || kind === 'payload' && key === 'targetLabels')) {
                    report(role === 'view' ? 'IMPL-V1' : 'IMPL-G3', element,
                        `raw ${kind}.${key} destructuring bypasses resolved configuration`, 'raw-label-access');
                }
                if (ts.isIdentifier(element.name)) {
                    if (kind === 'payload' && key === 'problem') bind(element.name.text, 'problem');
                    if (kind === 'props' && key === 'payload') bind(element.name.text, 'payload');
                }
            }
        }
    };
    const visit = (node: ts.Node): void => {
        if (ts.isFunctionLike(node)) {
            scopes.push(new Map());
            for (const parameter of node.parameters) {
                const annotation = parameter.type?.getText(sourceFile) ?? '';
                const parameterKind: SourceKind = /(?:View)?RenderPayload\b/.test(annotation)
                    ? 'payload' : /AbstractProblem\b/.test(annotation) ? 'problem' : 'props';
                if (ts.isIdentifier(parameter.name)) {
                    if (parameterKind !== 'props') bind(parameter.name.text, parameterKind);
                } else if (ts.isObjectBindingPattern(parameter.name)) {
                    for (const element of parameter.name.elements) {
                        const key = element.propertyName && ts.isIdentifier(element.propertyName)
                            ? element.propertyName.text : ts.isIdentifier(element.name) ? element.name.text : undefined;
                        if (!key) continue;
                        if (parameterKind === 'payload' && (key === 'labels' || key === 'targetLabels')
                            || parameterKind === 'problem' && key === 'labels') {
                            report(role === 'view' ? 'IMPL-V1' : 'IMPL-G3', element,
                                `raw ${parameterKind}.${key} parameter destructuring bypasses resolved configuration`,
                                'raw-label-access');
                        }
                        if (ts.isIdentifier(element.name)) {
                            if (parameterKind === 'props' && key === 'payload') bind(element.name.text, 'payload');
                            if (parameterKind === 'payload' && key === 'problem') bind(element.name.text, 'problem');
                        }
                    }
                }
            }
            ts.forEachChild(node, visit);
            scopes.pop();
            return;
        }
        if (ts.isBlock(node)) {
            scopes.push(new Map());
            ts.forEachChild(node, visit);
            scopes.pop();
            return;
        }
        if (ts.isVariableDeclaration(node) && node.initializer) inspectBinding(node.name, node.initializer);
        if ((ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node))) {
            const name = property(node);
            const kind = kindOf(node.expression);
            if ((name === 'labels' && (kind === 'payload' || kind === 'problem'))
                || (name === 'targetLabels' && kind === 'payload')) {
                report(role === 'view' ? 'IMPL-V1' : 'IMPL-G3', node,
                    `raw ${kind}.${name} access bypasses resolved configuration`, 'raw-label-access');
            }
            if (name && ['random', 'randomUUID', 'getRandomValues', 'now'].includes(name)
                && ts.isIdentifier(node.expression)
                && (node.expression.text === 'Math' && name === 'random'
                    || node.expression.text === 'crypto' && ['randomUUID', 'getRandomValues'].includes(name)
                    || node.expression.text === 'Date' && name === 'now')) {
                report('IMPL-4', node, `unseeded ${node.expression.text}.${name} is not reproducible`);
            }
            if (name && ts.isIdentifier(node.expression)) {
                const origin = symbols.origin(node.expression, file);
                if (origin?.endsWith('/spec.ts#spec')) {
                    report('IMPL-V9', node, 'implementation reads a spec declaration to decide task behavior');
                }
            }
        }
        if (ts.isStringLiteral(node) && node.text.startsWith('http://edugraph.io/edu/')) {
            report(role === 'view' ? 'IMPL-V1' : 'IMPL-G3', node,
                'raw ontology IRI in implementation; use resolved configuration', 'raw-ontology-iri');
        }
        if (role === 'generator' && ts.isReturnStatement(node) && node.expression
            && ts.isObjectLiteralExpression(node.expression)) {
            const labels = node.expression.properties.find(member => ts.isPropertyAssignment(member)
                && (ts.isIdentifier(member.name) || ts.isStringLiteral(member.name)) && member.name.text === 'labels');
            if (labels) report('IMPL-G3', labels, 'generator must not author output annotation labels');
        }
        ts.forEachChild(node, visit);
    };
    visit(sourceFile);
    return issues;
}
