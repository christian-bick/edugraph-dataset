import ts from 'typescript';

export interface GeneralLabelDeductionIssue {
    line: number;
    column: number;
}

const propertyName = (name: ts.PropertyName): string | undefined => {
    if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
        return name.text;
    }
    return undefined;
};

const importedDeductCompatibleNames = (sourceFile: ts.SourceFile): Set<string> => {
    const names = new Set(['deductCompatible']);

    for (const statement of sourceFile.statements) {
        if (!ts.isImportDeclaration(statement)
            || !ts.isStringLiteral(statement.moduleSpecifier)
            || statement.moduleSpecifier.text !== 'edugraph-ts') {
            continue;
        }

        const bindings = statement.importClause?.namedBindings;
        if (!bindings || !ts.isNamedImports(bindings)) continue;

        for (const element of bindings.elements) {
            if ((element.propertyName?.text ?? element.name.text) === 'deductCompatible') {
                names.add(element.name.text);
            }
        }
    }

    return names;
};

const isDeductCompatibleCall = (
    node: ts.CallExpression,
    localNames: ReadonlySet<string>
): boolean => {
    const expression = node.expression;
    if (ts.isIdentifier(expression)) return localNames.has(expression.text);
    if (ts.isPropertyAccessExpression(expression)) return expression.name.text === 'deductCompatible';
    if (ts.isElementAccessExpression(expression) && ts.isStringLiteral(expression.argumentExpression)) {
        return expression.argumentExpression.text === 'deductCompatible';
    }
    return false;
};

/**
 * Finds deduction helpers used to turn a compatibility envelope into invariant output claims.
 * `deductCompatible` is valid in schema capability declarations, never in `generalLabels`
 * (SPEC-10).
 */
export function findGeneralLabelDeductionIssues(
    source: string,
    fileName = 'spec.ts'
): GeneralLabelDeductionIssue[] {
    const sourceFile = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    const localNames = importedDeductCompatibleNames(sourceFile);
    const issues: GeneralLabelDeductionIssue[] = [];

    const inspectGeneralLabels = (initializer: ts.Expression) => {
        const visit = (node: ts.Node) => {
            if (ts.isCallExpression(node) && isDeductCompatibleCall(node, localNames)) {
                const position = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
                issues.push({line: position.line + 1, column: position.character + 1});
            }
            ts.forEachChild(node, visit);
        };
        visit(initializer);
    };

    const visit = (node: ts.Node) => {
        if (ts.isPropertyAssignment(node) && propertyName(node.name) === 'generalLabels') {
            inspectGeneralLabels(node.initializer);
            return;
        }
        ts.forEachChild(node, visit);
    };
    visit(sourceFile);

    return issues;
}
