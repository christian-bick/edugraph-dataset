import {GeneratorValidationError} from '../../lib/errors.ts';
import type {AlgebraicEquationProblem, AlgebraicInequalityProblem, AlgebraicNotation, AlgebraicScalar,
    AlgebraicSymbolDeclaration, AlgebraicUnit, ElementaryEquationContext, ElementaryEquationForm,
    ExactAlgebraicStatement, ExactEquation, ExactNumericalExpressionNode, ExactSymbolicExpressionNode as Node,
    StatementAmbientDomain, StatementAssignmentCheck, StatementBinding, StatementOccurrenceReplacement,
    StatementSideEvaluation, StatementSolutionCardinality, StrictThresholdContext} from '../../types/problems.ts';
import {buildExactNumericCalculation, isExactNumericCalculation} from '../arithmetic/exact-numeric-calculation-helpers.ts';
import {isCoordinateNotation} from '../coordinate/coordinate-helpers.ts';
import {isCanonicalSignedRational} from '../number/signed-rational-helpers.ts';
import {compareAffineScalars, equalAffineScalars} from './algebra-affine-helpers.ts';
import {isAlgebraicUnitRelation} from './algebra-context-helpers.ts';
import {algebraicChildren, inspectAlgebraicExpression, isAlgebraicDeclarations,
    isAlgebraicDomainMember, isAlgebraicVariableDomain, sameAlgebraicSyntax} from './algebra-syntax-helpers.ts';

type Variable = AlgebraicEquationProblem['variable'];
const fail = (message: string): never => { throw new GeneratorValidationError('algebra-statements', message); };
const require = (condition: unknown, message = 'Invalid exact algebraic statement evidence.'): void => { if (!condition) fail(message); };
const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === 'string' && value.length > 0 && value.trim() === value;
const dense = (value: unknown): value is unknown[] => {
    if (!Array.isArray(value)) return false;
    for (let index = 0; index < value.length; index++) if (!Object.hasOwn(value, index)) return false;
    return true;
};
const key = (value: AlgebraicScalar): string => `${value.numerator}/${value.denominator}`;
const numericPolicy = {domain: 'rational' as const, maximumAbsoluteValue: {numerator: Number.MAX_SAFE_INTEGER, denominator: 1},
    maximumNodes: Number.MAX_SAFE_INTEGER, maximumDepth: Number.MAX_SAFE_INTEGER, maximumExponent: 0};

/** Nonempty exact rational interval/exclusions or a finite set, never an implicit integer lattice. */
export function isStatementAmbientDomain(value: unknown): value is StatementAmbientDomain {
    try {
        if (!record(value)) return false;
        if (value.kind === 'numeric') return isAlgebraicVariableDomain(value.values) && value.values.kind === 'rational';
        return value.kind === 'finite' && dense(value.values) && value.values.length > 0
            && value.values.every(isCanonicalSignedRational) && new Set(value.values.map(key)).size === value.values.length;
    } catch { return false; }
}

export function isStatementDomainMember(value: AlgebraicScalar, domain: StatementAmbientDomain): boolean {
    try {
        return isCanonicalSignedRational(value) && isStatementAmbientDomain(domain)
            && (domain.kind === 'numeric' ? isAlgebraicDomainMember(value, domain.values)
                : domain.values.some(member => equalAffineScalars(member, value)));
    } catch { return false; }
}

/** Cardinality of the AMBIENT universe, independent of any finite candidate sample. */
export function statementDomainCardinality(domain: StatementAmbientDomain): StatementSolutionCardinality {
    require(isStatementAmbientDomain(domain), 'Expected a nonempty rational ambient domain.');
    if (domain.kind === 'finite') return {kind: 'finite', count: domain.values.length};
    return domain.values.lower && domain.values.upper && equalAffineScalars(domain.values.lower.value, domain.values.upper.value)
        ? {kind: 'finite', count: 1} : {kind: 'infinite'};
}

const declaration = (variable: Variable): readonly AlgebraicSymbolDeclaration[] => [{...variable,
    domain: {kind: 'rational', lower: null, upper: null, excludedValues: []}}];
function inspect(statement: ExactAlgebraicStatement, variable: Variable, domain: StatementAmbientDomain): readonly AlgebraicSymbolDeclaration[] {
    require(isStatementAmbientDomain(domain) && record(variable));
    const symbols = declaration(variable);
    require(isAlgebraicDeclarations(symbols) && record(statement) && ['equal', 'less', 'greater'].includes(statement.operator));
    for (const side of [statement.left, statement.right]) {
        const nodes = inspectAlgebraicExpression(side, symbols);
        require(nodes.every(node => node.kind !== 'power'), 'Statement assignment work uses unpowered arithmetic.');
    }
    return symbols;
}
const sameNotation = (first: AlgebraicNotation, second: unknown): boolean => record(second)
    && Object.keys(first).length === Object.keys(second).length
    && Object.entries(first).every(([field, value]) => second[field] === value);
function validBinding(value: unknown, variable: Variable, domain: StatementAmbientDomain): value is StatementBinding {
    return record(value) && value.symbolId === variable.symbolId && isCanonicalSignedRational(value.value)
        && isCoordinateNotation(value.value, value.notation) && isStatementDomainMember(value.value, domain);
}
function substitute(node: Node, binding: StatementBinding, replacements: StatementOccurrenceReplacement[]): ExactNumericalExpressionNode {
    if (node.kind === 'number') return node;
    if (node.kind === 'variable') {
        replacements.push({occurrenceNodeId: node.id, symbolId: binding.symbolId, value: binding.value, notation: binding.notation});
        return {id: node.id, kind: 'number', value: binding.value, notation: binding.notation};
    }
    if (node.kind === 'group') return {...node, expression: substitute(node.expression, binding, replacements)};
    if (node.kind === 'negation') return {...node, operand: substitute(node.operand, binding, replacements)};
    if (node.kind === 'binary') return {...node, left: substitute(node.left, binding, replacements), right: substitute(node.right, binding, replacements)};
    return fail('Statement assignment work uses unpowered arithmetic.');
}
function sideWork(expression: Node, binding: StatementBinding): StatementSideEvaluation {
    const replacements: StatementOccurrenceReplacement[] = [];
    const numeric = substitute(expression, binding, replacements);
    return {replacements, calculation: buildExactNumericCalculation(numeric, numericPolicy)};
}
const truth = (operator: ExactAlgebraicStatement['operator'], first: AlgebraicScalar, second: AlgebraicScalar): boolean => {
    const comparison = compareAffineScalars(first, second);
    return operator === 'equal' ? comparison === 0 : operator === 'less' ? comparison < 0 : comparison > 0;
};

/** A single admissible assignment; it need not have a candidate ID or be the unique solution. */
export function buildStatementAssignmentCheck(statement: ExactAlgebraicStatement, variable: Variable,
    domain: StatementAmbientDomain, binding: StatementBinding): StatementAssignmentCheck {
    inspect(statement, variable, domain);
    require(validBinding(binding, variable, domain), 'Expected one exact admissible variable binding.');
    const left = sideWork(statement.left, binding), right = sideWork(statement.right, binding);
    const leftValue = left.calculation.finalValue, rightValue = right.calculation.finalValue;
    return {binding, left, right, comparison: {operator: statement.operator, leftValue, rightValue,
        truth: truth(statement.operator, leftValue, rightValue)}};
}

function sameTree(first: Node, second: Node): boolean {
    return first.id === second.id && sameAlgebraicSyntax(first, second)
        && algebraicChildren(first).every((child, index) => sameTree(child, algebraicChildren(second)[index]!));
}
function validSide(value: unknown, original: Node, binding: StatementBinding): value is StatementSideEvaluation {
    if (!record(value) || !isExactNumericCalculation(value.calculation)) return false;
    const expected: StatementOccurrenceReplacement[] = [];
    const expression = substitute(original, binding, expected);
    if (!sameTree(expression, value.calculation.expression) || !dense(value.replacements) || value.replacements.length !== expected.length) return false;
    const seen = new Set<string>();
    return value.replacements.every(row => {
        if (!record(row) || typeof row.occurrenceNodeId !== 'string' || seen.has(row.occurrenceNodeId)) return false;
        seen.add(row.occurrenceNodeId);
        return expected.some(needed => needed.occurrenceNodeId === row.occurrenceNodeId && row.symbolId === needed.symbolId
            && isCanonicalSignedRational(row.value) && equalAffineScalars(row.value, needed.value) && sameNotation(needed.notation, row.notation));
    });
}

/** Accept all coherent supplied exact calculations and row orders, not only builder serialization. */
export function isStatementAssignmentCheck(value: unknown, statement: ExactAlgebraicStatement, variable: Variable,
    domain: StatementAmbientDomain): value is StatementAssignmentCheck {
    try {
        inspect(statement, variable, domain);
        if (!record(value) || !validBinding(value.binding, variable, domain)
            || !validSide(value.left, statement.left, value.binding) || !validSide(value.right, statement.right, value.binding)
            || !record(value.comparison)) return false;
        const first = value.left.calculation.finalValue, second = value.right.calculation.finalValue, comparison = value.comparison;
        return comparison.operator === statement.operator && isCanonicalSignedRational(comparison.leftValue)
            && isCanonicalSignedRational(comparison.rightValue) && equalAffineScalars(comparison.leftValue, first)
            && equalAffineScalars(comparison.rightValue, second) && comparison.truth === truth(statement.operator, first, second);
    } catch { return false; }
}

function nonnegativeDomain(domain: StatementAmbientDomain): boolean {
    return domain.kind === 'finite' ? domain.values.every(value => value.numerator >= 0)
        : domain.values.lower !== null && domain.values.lower.value.numerator >= 0;
}
function integralDomain(domain: StatementAmbientDomain): boolean {
    if (domain.kind === 'finite') return domain.values.every(value => value.denominator === 1);
    return domain.values.lower !== null && domain.values.upper !== null
        && equalAffineScalars(domain.values.lower.value, domain.values.upper.value) && domain.values.lower.value.denominator === 1;
}
const dimensionKeys = ['currency', 'time', 'count', 'length'] as const;
const pure = (unit: AlgebraicUnit, key: typeof dimensionKeys[number] | null): boolean => dimensionKeys.every(axis => unit.dimensions[axis] === (axis === key ? 1 : 0));
const countUnit = (unit: AlgebraicUnit): boolean => unit.subject === 'item' && pure(unit, 'count');
const countRoleUnit = (unit: AlgebraicUnit): boolean => unit.subject === 'number' && pure(unit, null) || unit.subject === 'item' && pure(unit, 'count');
const named = (value: unknown, meaning: string): value is {quantityId: string; meaning: string; unit: AlgebraicUnit} => record(value)
    && text(value.quantityId) && value.meaning === meaning && record(value.unit) && record(value.unit.dimensions);
function constant(value: unknown, meaning: string, literal: Extract<Node, {kind: 'number'}>): boolean {
    if (!named(value, meaning)) return false;
    const fields = value as unknown as Record<string, unknown>;
    return isCanonicalSignedRational(fields.value) && equalAffineScalars(fields.value, literal.value)
        && sameNotation(literal.notation, fields.notation);
}
const ungroup = (node: Node): Node => node.kind === 'group' ? ungroup(node.expression) : node;
function equationLiterals(statement: ExactEquation, form: ElementaryEquationForm): readonly [Extract<Node, {kind: 'number'}>, Extract<Node, {kind: 'number'}>] {
    require(record(statement) && statement.operator === 'equal' && record(form));
    const left = ungroup(statement.left), right = ungroup(statement.right);
    require(left.kind === 'binary' && right.kind === 'number');
    if (left.kind !== 'binary' || right.kind !== 'number') return fail('Expected an elementary equation.');
    const variable = ungroup(form.kind === 'additive' ? left.left : left.right), literal = ungroup(form.kind === 'additive' ? left.right : left.left);
    require((form.kind === 'additive' || form.kind === 'multiplicative') && variable.kind === 'variable' && variable.id === form.variableNodeId
        && literal.kind === 'number' && left.operation === (form.kind === 'additive' ? 'addition' : 'multiplication'));
    if (literal.kind !== 'number') return fail('Expected an elementary literal.');
    require(variable.kind === 'variable' && text(variable.symbolId));
    if (variable.kind !== 'variable') return fail('Expected the original variable.');
    const symbols = declaration({symbolId: variable.symbolId, symbol: 'x'});
    inspectAlgebraicExpression(statement.left, symbols); inspectAlgebraicExpression(statement.right, symbols);
    require(isCanonicalSignedRational(form.total) && equalAffineScalars(form.total, right.value)
        && isCanonicalSignedRational(form.kind === 'additive' ? form.addend : form.coefficient)
        && equalAffineScalars(form.kind === 'additive' ? form.addend : form.coefficient, literal.value));
    return [literal, right];
}

/** Role-, unit- and whole-domain-correct elementary contexts, independent of one chosen root. */
export function isElementaryEquationContext(value: unknown, statement: ExactEquation, form: ElementaryEquationForm,
    domain: StatementAmbientDomain): value is ElementaryEquationContext {
    try {
        require(record(value) && isStatementAmbientDomain(domain));
        const [literal, total] = equationLiterals(statement, form);
        const context = value as ElementaryEquationContext, variable = context.variableQuantity;
        let first: unknown, second: unknown, firstMeaning: string, secondMeaning: string;
        if (context.kind === 'number-relation') {
            require(context.relationship === (form.kind === 'additive' ? 'sum' : 'scaled-value') && named(variable, 'input-number'));
            first = context.constantQuantity; second = context.resultQuantity;
            firstMeaning = form.kind === 'additive' ? 'added-number' : 'scale-factor'; secondMeaning = 'resulting-number';
        } else {
            require(nonnegativeDomain(domain) && literal.value.numerator >= 0 && total.value.numerator >= 0);
            second = context.totalQuantity; secondMeaning = 'total-amount';
            if (context.kind === 'combined-amounts') {
                require(form.kind === 'additive' && named(variable, 'initial-amount'));
                first = context.addedQuantity; firstMeaning = 'added-amount';
            } else {
                require(context.kind === 'equal-groups' && form.kind === 'multiplicative');
                first = context.multiplierQuantity;
                const roles = {'group-count': 'amount-per-group', 'amount-per-group': 'group-count', duration: 'rate'} as const;
                require(record(variable) && Object.hasOwn(roles, variable.meaning) && named(variable, variable.meaning));
                firstMeaning = roles[variable.meaning as keyof typeof roles];
                if (variable.meaning === 'duration') require(variable.unit.subject === 'time' && pure(variable.unit, 'time'));
                if (variable.meaning === 'group-count') require(countRoleUnit(variable.unit) && integralDomain(domain));
            }
        }
        require(constant(first, firstMeaning, literal) && constant(second, secondMeaning, total));
        const a = first as {quantityId: string; unit: AlgebraicUnit}, b = second as {quantityId: string; unit: AlgebraicUnit};
        require(new Set([variable.quantityId, a.quantityId, b.quantityId]).size === 3
            && isAlgebraicUnitRelation(variable.unit, a.unit, b.unit, form.kind === 'additive' ? 'addition' : 'multiplication'));
        if (context.kind === 'number-relation') require([variable.unit, a.unit, b.unit].every(unit => unit.subject === 'number' && pure(unit, null)));
        else {
            if (countUnit(variable.unit)) require(integralDomain(domain));
            if (countUnit(a.unit) || firstMeaning === 'group-count') require(literal.value.denominator === 1);
            if (firstMeaning === 'group-count') require(countRoleUnit(a.unit));
            if (countUnit(b.unit)) require(total.value.denominator === 1);
        }
        return true;
    } catch { return false; }
}

/** A literal signed threshold and explicit ambient domain; no implicit physical domain restriction. */
export function isStrictThresholdContext(value: unknown, bound: AlgebraicInequalityProblem['bound'],
    domain: StatementAmbientDomain): value is StrictThresholdContext {
    try {
        if (!record(value) || value.kind !== 'strict-threshold' || !record(value.context) || !text(value.quantityId)
            || !record(value.threshold) || !text(value.threshold.quantityId) || value.threshold.quantityId === value.quantityId
            || !isStatementAmbientDomain(domain) || !record(bound) || !text(bound.variableNodeId)
            || !isCanonicalSignedRational(bound.value) || !isCoordinateNotation(bound.value, bound.notation)) return false;
        const metadata = {temperature: ['celsius-zero', 'degrees-celsius'], elevation: ['sea-level', 'meters'], balance: ['settled-balance', 'dollars']} as const;
        if (typeof value.context.kind !== 'string' || !Object.hasOwn(metadata, value.context.kind)) return false;
        const [reference, unit] = metadata[value.context.kind as keyof typeof metadata];
        return value.context.reference === reference && value.context.unit === unit
            && (bound.direction === 'less' && value.relationship === 'strictly-below-threshold'
                || bound.direction === 'greater' && value.relationship === 'strictly-above-threshold')
            && isCanonicalSignedRational(value.threshold.value) && equalAffineScalars(value.threshold.value, bound.value)
            && sameNotation(bound.notation, value.threshold.notation);
    } catch { return false; }
}
