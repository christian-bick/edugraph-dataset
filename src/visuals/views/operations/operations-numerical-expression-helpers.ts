import type {ArithmeticOperation, NumericalExpressionNode, NumericalExpressionProblem,
    NumericalExpressionStructureNode, NumericalExpressionStructureProblem} from '../../../types/problems.ts';
import {ViewValidationError} from '../../helpers/validation.ts';

const symbols: Record<ArithmeticOperation, string> = {
    addition: '+',
    subtraction: '−',
    multiplication: '×',
    division: '÷'
};

const delimiters = [['(', ')'], ['[', ']'], ['{', '}']] as const;

const groupPair = (seed: number, level: number) =>
    delimiters[(Math.abs(Math.trunc(seed)) + level) % delimiters.length];

/** Displays the supplied expression tree without evaluating its hidden values. */
export const formatNumericalExpression = (
    node: NumericalExpressionStructureNode,
    seed: number,
    groupLevel = 0
): string => {
    if (node.kind === 'number') return String(node.value);
    if (node.kind === 'group') {
        const [open, close] = groupPair(seed, groupLevel);
        return `${open}${formatNumericalExpression(node.expression, seed, groupLevel + 1)}${close}`;
    }
    return `${formatNumericalExpression(node.left, seed, groupLevel)} ${symbols[node.operation]} ${formatNumericalExpression(node.right, seed, groupLevel)}`;
};

/** Shows the operands and operations while leaving explicit grouping for the learner to add. */
export const formatWithoutGroups = (node: NumericalExpressionStructureNode): string => {
    if (node.kind === 'number') return String(node.value);
    if (node.kind === 'group') return formatWithoutGroups(node.expression);
    return `${formatWithoutGroups(node.left)} ${symbols[node.operation]} ${formatWithoutGroups(node.right)}`;
};

/** Verbalizes structure, including operation order, but never reads calculated node values. */
export const describeNumericalExpression = (node: NumericalExpressionStructureNode): string => {
    if (node.kind === 'number') return String(node.value);
    if (node.kind === 'group') return describeNumericalExpression(node.expression);
    if (node.operation === 'addition' || node.operation === 'multiplication') {
        const terms: NumericalExpressionStructureNode[] = [];
        const collect = (part: NumericalExpressionStructureNode): void => {
            if (part.kind === 'operation' && part.operation === node.operation) {
                collect(part.left);
                collect(part.right);
            } else {
                terms.push(part);
            }
        };
        collect(node);
        const descriptions = terms.map(describeNumericalExpression);
        const joined = descriptions.length === 2
            ? descriptions.join(' and ')
            : `${descriptions.slice(0, -1).join(', ')}, and ${descriptions.at(-1)}`;
        return `the ${node.operation === 'addition' ? 'sum' : 'product'} of ${joined}`;
    }
    const left = describeNumericalExpression(node.left);
    const right = describeNumericalExpression(node.right);
    switch (node.operation) {
        case 'subtraction': return `the difference between ${left} and ${right}`;
        case 'division': return `the quotient of ${left} and ${right}`;
    }
};

export const hasExplicitGroup = (node: NumericalExpressionStructureNode): boolean => {
    if (node.kind === 'group') return true;
    if (node.kind === 'number') return false;
    return hasExplicitGroup(node.left) || hasExplicitGroup(node.right);
};

export interface EvaluationStep {
    calculation: string;
    inGroup: boolean;
}

/** Uses the generator's exact node values to present its postorder calculation steps. */
export const expressionEvaluationSteps = (node: NumericalExpressionNode): EvaluationStep[] => {
    const steps: EvaluationStep[] = [];
    const visit = (part: NumericalExpressionNode, inGroup: boolean): void => {
        if (part.kind === 'number') return;
        if (part.kind === 'group') {
            visit(part.expression, true);
            return;
        }
        visit(part.left, inGroup);
        visit(part.right, inGroup);
        steps.push({
            calculation: `${part.left.value} ${symbols[part.operation]} ${part.right.value} = ${part.value}`,
            inGroup
        });
    };
    visit(node, false);
    return steps;
};

const validNumber = (value: unknown): value is number =>
    typeof value === 'number' && Number.isFinite(value);

const closeEnough = (actual: number, expected: number): boolean =>
    Math.abs(actual - expected) <= 1e-9 * Math.max(1, Math.abs(expected));

/** Checks the recursive mathematical witness before it reaches a renderer. */
export function validateNumericalExpression(
    viewId: string,
    input: unknown
): asserts input is NumericalExpressionProblem {
    const data = input as NumericalExpressionProblem;
    if (!data || typeof data !== 'object') throw new ViewValidationError(viewId, 'Expression data is invalid.');
    let count = 0;
    const inspect = (node: NumericalExpressionNode, depth: number): void => {
        count++;
        if (depth > 16 || count > 64 || !node || !validNumber(node.value)) {
            throw new ViewValidationError(viewId, 'Expression tree or value is invalid.');
        }
        if (node.kind === 'number') return;
        if (node.kind === 'group') {
            inspect(node.expression, depth + 1);
            if (!closeEnough(node.value, node.expression.value)) {
                throw new ViewValidationError(viewId, 'Grouped value differs from its expression.');
            }
            return;
        }
        if (node.kind !== 'operation' || !Object.hasOwn(symbols, node.operation)) {
            throw new ViewValidationError(viewId, 'Expression operation is invalid.');
        }
        inspect(node.left, depth + 1);
        inspect(node.right, depth + 1);
        const expected = node.operation === 'addition' ? node.left.value + node.right.value
            : node.operation === 'subtraction' ? node.left.value - node.right.value
                : node.operation === 'multiplication' ? node.left.value * node.right.value
                    : node.left.value / node.right.value;
        if (!validNumber(expected) || !closeEnough(node.value, expected)) {
            throw new ViewValidationError(viewId, 'Expression values are mathematically inconsistent.');
        }
    };

    inspect(data.expression, 0);
    if (data.multiplicativeComparison) {
        const {factor, reference} = data.multiplicativeComparison;
        inspect(reference, 0);
        const root = data.expression;
        const compared = root.kind === 'operation' && root.right.kind === 'group'
            ? root.right.expression
            : root.kind === 'operation' ? root.right : undefined;
        if (!validNumber(factor) || factor <= 0 || root.kind !== 'operation'
            || root.operation !== 'multiplication' || root.left.kind !== 'number'
            || root.left.value !== factor || !compared
            || JSON.stringify(compared) !== JSON.stringify(reference)) {
            throw new ViewValidationError(viewId, 'Multiplicative comparison does not match the expression.');
        }
    }
}

/** A structure contract validates grammar and literal values without inventing evaluated work. */
export function validateNumericalExpressionStructure(viewId: string, input: unknown): asserts input is NumericalExpressionStructureProblem {
    const data = input as NumericalExpressionStructureProblem;
    if (!data || typeof data !== 'object') throw new ViewValidationError(viewId, 'Expression data is invalid.');
    let count = 0;
    const inspect = (node: NumericalExpressionStructureNode, depth: number): void => {
        if (++count > 64 || depth > 16 || !node || typeof node !== 'object') {
            throw new ViewValidationError(viewId, 'Expression structure is invalid.');
        }
        if (node.kind === 'number') {
            if (!validNumber(node.value)) throw new ViewValidationError(viewId, 'Expression literal is invalid.');
            return;
        }
        if ('value' in node) throw new ViewValidationError(viewId, 'Structural expressions must not contain evaluated values.');
        if (node.kind === 'group') return inspect(node.expression, depth + 1);
        if (node.kind !== 'operation' || !Object.hasOwn(symbols, node.operation)) {
            throw new ViewValidationError(viewId, 'Expression operation is invalid.');
        }
        inspect(node.left, depth + 1);
        inspect(node.right, depth + 1);
    };
    inspect(data.expression, 0);
    if (data.multiplicativeComparison) {
        const {factor, reference} = data.multiplicativeComparison;
        inspect(reference, 0);
        const root = data.expression;
        const compared = root.kind === 'operation' && root.right.kind === 'group'
            ? root.right.expression : root.kind === 'operation' ? root.right : undefined;
        if (!validNumber(factor) || factor <= 0 || root.kind !== 'operation'
            || root.operation !== 'multiplication' || root.left.kind !== 'number'
            || root.left.value !== factor || !compared
            || JSON.stringify(compared) !== JSON.stringify(reference)) {
            throw new ViewValidationError(viewId, 'Multiplicative comparison does not match the expression.');
        }
    }
}
