import {GeneratorValidationError} from '../../lib/errors.ts';
import type {AlgebraicDomainBound, AlgebraicEquationProblem, AlgebraicInequalityProblem, AlgebraicNotation,
    AlgebraicScalar, AmbientStatementSolution, CommonAffineDomain, ElementaryEquationForm,
    ElementaryEquationSolutionWitness, ExactAlgebraicStatement, ExactEquation, ExactStrictInequality,
    ExactSymbolicExpressionNode as Node, RestrictedIntervalSolution, SignedRationalAxis,
    StatementAmbientDomain, StatementAssignmentCheck, StatementBinding, StatementCandidate,
    StatementSolutionCardinality} from '../../types/problems.ts';
import {isCoordinateNotation} from '../coordinate/coordinate-helpers.ts';
import {isSignedRationalAxis, isSignedRationalLocation, makeSignedRationalLocation} from '../number/signed-rational-axis-helpers.ts';
import {isCanonicalSignedRational} from '../number/signed-rational-helpers.ts';
import {addAffineScalars, affineScalar, compareAffineScalars, divideAffineScalars, equalAffineNormalForms,
    equalAffineScalars, normalizeAffineExpression, subtractAffineScalars} from './algebra-affine-helpers.ts';
import {buildStatementAssignmentCheck, isElementaryEquationContext, isStatementAmbientDomain,
    isStatementAssignmentCheck, isStatementDomainMember, isStrictThresholdContext} from './algebra-statement-core-helpers.ts';
import {inspectAlgebraicExpression} from './algebra-syntax-helpers.ts';

type Variable = AlgebraicEquationProblem['variable'];
type BaseInput = Readonly<{
    variable: Variable;
    ambientDomain: StatementAmbientDomain;
    candidateUniverse: readonly [StatementCandidate, ...StatementCandidate[]];
    assignment: StatementBinding;
}>;
export type EquationBuildInput = BaseInput & Readonly<{statement: ExactEquation; context: AlgebraicEquationProblem['context']}>;
export type InequalityBuildInput = BaseInput & Readonly<{statement: ExactStrictInequality; context: AlgebraicInequalityProblem['context']; axis: SignedRationalAxis}>;
type Interval = Readonly<{kind: 'interval'; lower: AlgebraicDomainBound | null; upper: AlgebraicDomainBound | null; excludedValues: readonly AlgebraicScalar[]}>;
type ExactSet = Interval | Readonly<{kind: 'finite'; values: readonly AlgebraicScalar[]}>;
const zero: AlgebraicScalar = {numerator: 0, denominator: 1}, one: AlgebraicScalar = {numerator: 1, denominator: 1};
const fail = (message: string): never => { throw new GeneratorValidationError('algebra-statements', message); };
const require = (condition: unknown, message: string): void => { if (!condition) fail(message); };
const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === 'string' && value.length > 0 && value.trim() === value;
const dense = (value: unknown): value is unknown[] => {
    if (!Array.isArray(value)) return false;
    for (let index = 0; index < value.length; index++) if (!Object.hasOwn(value, index)) return false;
    return true;
};
const clone = <T>(value: T): T => structuredClone(value);
const key = (value: AlgebraicScalar): string => `${value.numerator}/${value.denominator}`;
const same = equalAffineScalars;
const compare = compareAffineScalars;
const ungroup = (node: Node): Node => node.kind === 'group' ? ungroup(node.expression) : node;
const notation = (value: AlgebraicScalar): AlgebraicNotation => value.denominator === 1
    ? {kind: 'integer', numeral: String(value.numerator)} : {kind: 'fraction', numerator: value.numerator, denominator: value.denominator};
function equal(expected: unknown, value: unknown): boolean {
    if (Object.is(expected, value)) return true;
    if (Array.isArray(expected)) return dense(value) && expected.length === value.length && expected.every((item, index) => equal(item, value[index]));
    return record(expected) && record(value) && Object.keys(expected).length === Object.keys(value).length
        && Object.keys(expected).every(field => Object.hasOwn(value, field) && equal(expected[field], value[field]));
}
function declaration(variable: Variable): CommonAffineDomain {
    return {domainId: 'statement-proof', kind: 'independent-rational-variables', symbols: [{...variable,
        domain: {kind: 'rational', lower: null, upper: null, excludedValues: []}}]};
}
function syntax(statement: unknown, variable: Variable): asserts statement is ExactAlgebraicStatement {
    require(record(statement) && ['equal', 'less', 'greater'].includes(statement.operator as string), 'Expected an exact algebraic relation.');
    const value = statement as ExactAlgebraicStatement, symbols = declaration(variable).symbols;
    for (const side of [value.left, value.right]) require(!inspectAlgebraicExpression(side, symbols).some(node => node.kind === 'power'), 'Elementary statements have no powers.');
}
function equationForm(statement: ExactEquation, variable: Variable): ElementaryEquationForm {
    syntax(statement, variable);
    require(statement.operator === 'equal', 'An equation must use equality.');
    const left = ungroup(statement.left), right = ungroup(statement.right);
    require(left.kind === 'binary' && right.kind === 'number', 'Expected exactly x+p=q or p*x=q.');
    const expression = left as Extract<Node, {kind: 'binary'}>, total = (right as Extract<Node, {kind: 'number'}>).value;
    const first = ungroup(expression.left), second = ungroup(expression.right);
    if (expression.operation === 'addition' && first.kind === 'variable' && second.kind === 'number' && first.symbolId === variable.symbolId) {
        return {kind: 'additive', variableNodeId: first.id, addend: second.value, total};
    }
    require(expression.operation === 'multiplication' && first.kind === 'number' && second.kind === 'variable'
        && second.symbolId === variable.symbolId, 'Expected exactly x+p=q or p*x=q.');
    return {kind: 'multiplicative', variableNodeId: second.id, coefficient: (first as Extract<Node, {kind: 'number'}>).value, total};
}
function inequalityBound(statement: ExactStrictInequality, variable: Variable): AlgebraicInequalityProblem['bound'] {
    syntax(statement, variable);
    require(['less', 'greater'].includes(statement.operator) && statement.left.kind === 'variable' && statement.left.symbolId === variable.symbolId
        && statement.right.kind === 'number', 'A strict bound must be exactly x<c or x>c.');
    const right = statement.right as Extract<Node, {kind: 'number'}>;
    return {variableNodeId: statement.left.id, value: right.value, notation: right.notation, direction: statement.operator};
}

/** Canonical set comparison absorbs excluded endpoints, while preserving every interior hole. */
function interval(lower: AlgebraicDomainBound | null, upper: AlgebraicDomainBound | null, exclusions: readonly AlgebraicScalar[]): ExactSet {
    if (lower && upper) {
        const comparison = compare(lower.value, upper.value);
        if (comparison > 0 || comparison === 0 && (!lower.inclusive || !upper.inclusive || exclusions.some(value => same(value, lower.value)))) return {kind: 'finite', values: []};
        if (comparison === 0) return {kind: 'finite', values: [lower.value]};
    }
    const low = lower && exclusions.some(value => same(value, lower.value)) ? {...lower, inclusive: false} : lower;
    const high = upper && exclusions.some(value => same(value, upper.value)) ? {...upper, inclusive: false} : upper;
    const holes = exclusions.filter(value => (!low || compare(value, low.value) > 0) && (!high || compare(value, high.value) < 0)).sort(compare);
    return {kind: 'interval', lower: low, upper: high, excludedValues: holes};
}
function domainSet(domain: StatementAmbientDomain): ExactSet {
    return domain.kind === 'finite' ? {kind: 'finite', values: domain.values} : interval(domain.values.lower, domain.values.upper, domain.values.excludedValues);
}
function equalSets(first: ExactSet, second: ExactSet): boolean {
    if (first.kind === 'finite' && second.kind === 'finite') return first.values.length === second.values.length
        && first.values.every(value => second.values.some(other => same(value, other)));
    return first.kind === 'interval' && second.kind === 'interval' && equal(first.lower, second.lower) && equal(first.upper, second.upper)
        && first.excludedValues.length === second.excludedValues.length && first.excludedValues.every((value, index) => same(value, second.excludedValues[index]!));
}
const cardinality = (set: ExactSet): StatementSolutionCardinality => set.kind === 'finite' ? {kind: 'finite', count: set.values.length} : {kind: 'infinite'};
function nonnegative(domain: StatementAmbientDomain): boolean {
    return domain.kind === 'finite' ? domain.values.every(value => value.numerator >= 0)
        : domain.values.lower !== null && domain.values.lower.value.numerator >= 0;
}
function equationMath(form: ElementaryEquationForm, domain: StatementAmbientDomain): {set: ExactSet; root: AlgebraicScalar | null; exceptional: 'zero' | 'nonnegative' | null} {
    if (form.kind === 'multiplicative' && form.coefficient.numerator === 0) return {set: form.total.numerator === 0 ? domainSet(domain) : {kind: 'finite', values: []}, root: null, exceptional: 'zero'};
    if (form.kind === 'additive' && nonnegative(domain) && compare(form.addend, form.total) > 0) return {set: {kind: 'finite', values: []}, root: null, exceptional: 'nonnegative'};
    const root = form.kind === 'additive' ? subtractAffineScalars(form.total, form.addend) : divideAffineScalars(form.total, form.coefficient);
    return {set: {kind: 'finite', values: isStatementDomainMember(root, domain) ? [root] : []}, root, exceptional: null};
}
function inequalityMath(bound: AlgebraicInequalityProblem['bound'], domain: StatementAmbientDomain): ExactSet {
    const trueValue = (value: AlgebraicScalar): boolean => bound.direction === 'less' ? compare(value, bound.value) < 0 : compare(value, bound.value) > 0;
    if (domain.kind === 'finite') return {kind: 'finite', values: domain.values.filter(trueValue)};
    let {lower, upper} = domain.values;
    if (bound.direction === 'less' && (!upper || compare(bound.value, upper.value) <= 0)) upper = {value: bound.value, inclusive: false};
    if (bound.direction === 'greater' && (!lower || compare(bound.value, lower.value) >= 0)) lower = {value: bound.value, inclusive: false};
    return interval(lower, upper, domain.values.excludedValues);
}

function baseChecks(input: BaseInput, statement: ExactAlgebraicStatement): {
    candidateChecks: AlgebraicEquationProblem['candidateChecks']; ambientChecks: readonly StatementAssignmentCheck[];
    restrictedSolutions: AlgebraicEquationProblem['restrictedSolutions']
} {
    require(isStatementAmbientDomain(input.ambientDomain) && dense(input.candidateUniverse) && input.candidateUniverse.length > 0, 'Expected a nonempty domain and candidate universe.');
    const ids = new Set<string>(), values = new Set<string>();
    const candidateChecks = input.candidateUniverse.map(candidate => {
        require(record(candidate) && text(candidate.id) && !ids.has(candidate.id) && isCanonicalSignedRational(candidate.value)
            && !values.has(key(candidate.value)) && isCoordinateNotation(candidate.value, candidate.notation), 'Candidate ids and admitted exact values must be unique.');
        ids.add(candidate.id); values.add(key(candidate.value));
        return {...buildStatementAssignmentCheck(statement, input.variable, input.ambientDomain,
            {symbolId: input.variable.symbolId, value: candidate.value, notation: candidate.notation}), candidateId: candidate.id};
    });
    require(candidateChecks.some(row => equal(row.binding, input.assignment)), 'The supplied assignment must exactly match a candidate binding, including notation.');
    const selected = candidateChecks.filter(row => row.comparison.truth);
    const ambientChecks = input.ambientDomain.kind === 'numeric' ? [] : input.ambientDomain.values.map(value =>
        buildStatementAssignmentCheck(statement, input.variable, input.ambientDomain, {symbolId: input.variable.symbolId, value, notation: notation(value)}));
    return {candidateChecks: [candidateChecks[0]!, ...candidateChecks.slice(1)], ambientChecks,
        restrictedSolutions: {candidateIds: selected.map(row => row.candidateId), values: selected.map(row => row.binding.value)}};
}
function validBase(value: AlgebraicEquationProblem | AlgebraicInequalityProblem): boolean {
    if (!isStatementAmbientDomain(value.ambientDomain) || !dense(value.candidateUniverse) || value.candidateUniverse.length === 0
        || !dense(value.candidateChecks) || value.candidateChecks.length !== value.candidateUniverse.length) return false;
    const ids = new Set<string>(), values = new Set<string>();
    for (const [index, candidate] of value.candidateUniverse.entries()) {
        if (!record(candidate) || !text(candidate.id) || ids.has(candidate.id) || !isCanonicalSignedRational(candidate.value)
            || values.has(key(candidate.value)) || !isCoordinateNotation(candidate.value, candidate.notation)) return false;
        ids.add(candidate.id); values.add(key(candidate.value));
        const check = value.candidateChecks[index];
        if (!isStatementAssignmentCheck(check, value.statement, value.variable, value.ambientDomain) || check.candidateId !== candidate.id
            || !equal(check.binding, {symbolId: value.variable.symbolId, value: candidate.value, notation: candidate.notation})) return false;
    }
    if (!value.candidateChecks.some(check => equal(check.binding, value.assignment))) return false;
    const selected = value.candidateChecks.filter(check => check.comparison.truth);
    if (!equal(value.restrictedSolutions, {candidateIds: selected.map(check => check.candidateId), values: selected.map(check => check.binding.value)})) return false;
    if (!dense(value.ambientChecks)) return false;
    if (value.ambientDomain.kind === 'numeric') return value.ambientChecks.length === 0;
    const seen = new Set<string>();
    for (const check of value.ambientChecks) {
        if (!isStatementAssignmentCheck(check, value.statement, value.variable, value.ambientDomain) || seen.has(key(check.binding.value))) return false;
        seen.add(key(check.binding.value));
    }
    return value.ambientDomain.values.length === seen.size;
}

/** Construct an excluded-point-free open rational gap, not a finite sample claiming infinity. */
function gap(set: Interval): RestrictedIntervalSolution['infiniteSubinterval'] {
    const boundaries = [set.lower?.value ?? null, ...set.excludedValues, set.upper?.value ?? null];
    for (let index = 0; index < boundaries.length - 1; index++) {
        try {
            const low = boundaries[index], high = boundaries[index + 1];
            const lower = low ?? (high ? subtractAffineScalars(high, one) : zero);
            const upper = high ?? addAffineScalars(lower, one);
            const interior = affineScalar(BigInt(lower.numerator) * BigInt(upper.denominator) + BigInt(upper.numerator) * BigInt(lower.denominator),
                2n * BigInt(lower.denominator) * BigInt(upper.denominator));
            return {lower, upper, interior};
        } catch { /* Another gap may have safe exact storage even when this one does not. */ }
    }
    return fail('The infinite interval has no safely representable gap witness.');
}
function buildAmbient(set: ExactSet, domain: StatementAmbientDomain, bound: AlgebraicInequalityProblem['bound']): AmbientStatementSolution {
    if (set.kind === 'finite' && set.values.length === 0) return {kind: 'empty', reason: 'domain-excluded-by-bound'};
    if (equalSets(set, domainSet(domain))) return {kind: 'all-domain', reason: 'domain-entirely-satisfies-bound'};
    if (set.kind === 'finite') return set.values.length === 1 ? {kind: 'singleton', value: set.values[0]!, notation: notation(set.values[0]!)}
        : {kind: 'finite', values: [set.values[0]!, ...set.values.slice(1)]};
    if (domain.kind === 'numeric' && domain.values.lower === null && domain.values.upper === null && domain.values.excludedValues.length === 0) {
        return {kind: 'ray', boundary: bound.value, direction: bound.direction, boundaryIncluded: false,
            infiniteFamily: {kind: 'boundary-plus-positive-integer-step', base: bound.value, direction: bound.direction === 'less' ? 'subtract' : 'add', step: one}};
    }
    return {...set, infiniteSubinterval: gap(set)};
}
function validBound(value: unknown): value is AlgebraicDomainBound | null {
    return value === null || record(value) && isCanonicalSignedRational(value.value) && typeof value.inclusive === 'boolean';
}
function uniqueScalars(value: unknown): value is AlgebraicScalar[] {
    return dense(value) && value.every(isCanonicalSignedRational) && new Set(value.map(key)).size === value.length;
}
function validGap(value: unknown, set: Interval): boolean {
    return record(value) && isCanonicalSignedRational(value.lower) && isCanonicalSignedRational(value.upper) && isCanonicalSignedRational(value.interior)
        && compare(value.lower, value.interior) < 0 && compare(value.interior, value.upper) < 0
        && (!set.lower || compare(value.lower, set.lower.value) >= 0) && (!set.upper || compare(value.upper, set.upper.value) <= 0)
        && !set.excludedValues.some(hole => compare(hole, value.lower as AlgebraicScalar) > 0 && compare(hole, value.upper as AlgebraicScalar) < 0);
}
function validAmbient(value: unknown, expected: ExactSet, domain: StatementAmbientDomain,
    bound?: AlgebraicInequalityProblem['bound'], form?: ElementaryEquationForm): value is AmbientStatementSolution {
    if (!record(value)) return false;
    let supplied: ExactSet;
    if (value.kind === 'empty') {
        if (!['constant-contradiction', 'outside-domain', 'domain-excluded-by-bound'].includes(value.reason as string)) return false;
        if (value.reason === 'constant-contradiction' && !(form?.kind === 'multiplicative' && form.coefficient.numerator === 0 && form.total.numerator !== 0)) return false;
        if (value.reason === 'domain-excluded-by-bound' && !bound) return false;
        supplied = {kind: 'finite', values: []};
    } else if (value.kind === 'all-domain') {
        if (bound ? value.reason !== 'domain-entirely-satisfies-bound'
            : value.reason !== 'constant-identity' || form?.kind !== 'multiplicative' || form.coefficient.numerator !== 0 || form.total.numerator !== 0) return false;
        supplied = domainSet(domain);
    } else if (value.kind === 'singleton') {
        if (!isCanonicalSignedRational(value.value) || !isCoordinateNotation(value.value, value.notation)) return false;
        supplied = {kind: 'finite', values: [value.value]};
    } else if (value.kind === 'finite') {
        if (!uniqueScalars(value.values) || value.values.length === 0) return false;
        supplied = {kind: 'finite', values: value.values};
    } else if (value.kind === 'interval') {
        if (!validBound(value.lower) || !validBound(value.upper) || !uniqueScalars(value.excludedValues)) return false;
        supplied = interval(value.lower, value.upper, value.excludedValues);
        if (supplied.kind !== 'interval' || !validGap(value.infiniteSubinterval, supplied)) return false;
    } else if (value.kind === 'ray') {
        if (!bound || domain.kind !== 'numeric' || domain.values.lower !== null || domain.values.upper !== null || domain.values.excludedValues.length !== 0
            || !isCanonicalSignedRational(value.boundary) || !same(value.boundary, bound.value) || value.direction !== bound.direction || value.boundaryIncluded !== false
            || !record(value.infiniteFamily) || value.infiniteFamily.kind !== 'boundary-plus-positive-integer-step'
            || !isCanonicalSignedRational(value.infiniteFamily.base) || !same(value.infiniteFamily.base, bound.value)
            || !isCanonicalSignedRational(value.infiniteFamily.step) || value.infiniteFamily.step.numerator <= 0
            || value.infiniteFamily.direction !== (bound.direction === 'less' ? 'subtract' : 'add')) return false;
        supplied = interval(bound.direction === 'greater' ? {value: bound.value, inclusive: false} : null,
            bound.direction === 'less' ? {value: bound.value, inclusive: false} : null, []);
    } else return false;
    return equalSets(expected, supplied);
}
function validCardinality(value: unknown, set: ExactSet): boolean {
    return record(value) && (set.kind === 'interval' ? value.kind === 'infinite' : value.kind === 'finite' && typeof value.count === 'number'
        && Number.isSafeInteger(value.count) && !Object.is(value.count, -0) && value.count === set.values.length);
}

function buildEquationWitness(input: EquationBuildInput, form: ElementaryEquationForm, math: ReturnType<typeof equationMath>): ElementaryEquationSolutionWitness {
    if (math.exceptional === 'zero' && form.kind === 'multiplicative') return {kind: 'zero-coefficient', coefficient: form.coefficient, constant: form.total,
        constantTruth: form.total.numerator === 0, classification: form.total.numerator === 0 ? 'all-domain' : 'empty'};
    if (math.exceptional === 'nonnegative' && form.kind === 'additive') return {kind: 'nonnegative-addend-exceeds-total', addend: form.addend,
        total: form.total, addendGreaterThanTotal: true};
    const root = math.root!, rootNotation = notation(root), ids = new Set([...inspectAlgebraicExpression(input.statement.left, declaration(input.variable).symbols),
        ...inspectAlgebraicExpression(input.statement.right, declaration(input.variable).symbols)].map(node => node.id));
    let id = 'isolated-result'; while (ids.has(id)) id += '-next';
    const after: ExactEquation = {operator: 'equal', left: {kind: 'variable', id: form.variableNodeId, symbolId: input.variable.symbolId},
        right: {kind: 'number', id, value: root, notation: rootNotation}};
    const transformation = form.kind === 'additive' ? {kind: 'subtract-same-addend' as const, before: input.statement, operand: form.addend, after, rightDifference: root}
        : {kind: 'divide-by-nonzero-coefficient' as const, before: input.statement, divisor: form.coefficient, after, rightQuotient: root};
    const admissible = isStatementDomainMember(root, input.ambientDomain);
    return {kind: 'isolated-variable', transformations: [transformation], algebraicValue: root, admissible,
        verification: admissible ? buildStatementAssignmentCheck(input.statement, input.variable, input.ambientDomain,
            {symbolId: input.variable.symbolId, value: root, notation: rootNotation}) : null};
}
function normal(statement: ExactEquation, variable: Variable, side: 'left' | 'right') {
    const domain = declaration(variable);
    return normalizeAffineExpression({expressionId: side, domainId: domain.domainId, root: statement[side]}, domain).rootNormalForm;
}
function validTransformations(value: unknown, statement: ExactEquation, variable: Variable, root: AlgebraicScalar): boolean {
    if (!dense(value) || value.length === 0) return false;
    let previous = statement;
    for (const step of value) {
        if (!record(step) || !record(step.before) || !record(step.after) || !equal(step.before, previous)) return false;
        const before = step.before as ExactEquation, after = step.after as ExactEquation;
        syntax(before, variable); syntax(after, variable);
        if (before.operator !== 'equal' || after.operator !== 'equal') return false;
        const left = normal(before, variable, 'left'), right = normal(before, variable, 'right'), afterLeft = normal(after, variable, 'left'), afterRight = normal(after, variable, 'right');
        if (right.coefficients.length !== 0 || afterRight.coefficients.length !== 0) return false;
        if (step.kind === 'subtract-same-addend' && isCanonicalSignedRational(step.operand) && isCanonicalSignedRational(step.rightDifference)) {
            if (!equalAffineNormalForms(afterLeft, {...left, constant: subtractAffineScalars(left.constant, step.operand)})
                || !same(step.rightDifference, subtractAffineScalars(right.constant, step.operand)) || !same(afterRight.constant, step.rightDifference)) return false;
        } else if (step.kind === 'divide-by-nonzero-coefficient' && isCanonicalSignedRational(step.divisor) && step.divisor.numerator !== 0 && isCanonicalSignedRational(step.rightQuotient)) {
            const divided = {constant: divideAffineScalars(left.constant, step.divisor), coefficients: left.coefficients.map(row => ({symbolId: row.symbolId, coefficient: divideAffineScalars(row.coefficient, step.divisor as AlgebraicScalar)}))};
            if (!equalAffineNormalForms(afterLeft, divided) || !same(step.rightQuotient, divideAffineScalars(right.constant, step.divisor)) || !same(afterRight.constant, step.rightQuotient)) return false;
        } else return false;
        previous = after;
    }
    const left = ungroup(previous.left), right = ungroup(previous.right);
    return left.kind === 'variable' && left.symbolId === variable.symbolId && right.kind === 'number' && same(right.value, root);
}
function validEquationWitness(value: unknown, input: EquationBuildInput, form: ElementaryEquationForm): boolean {
    if (!record(value)) return false;
    if (value.kind === 'zero-coefficient') return form.kind === 'multiplicative' && form.coefficient.numerator === 0 && equal(value.coefficient, form.coefficient)
        && equal(value.constant, form.total) && value.constantTruth === (form.total.numerator === 0) && value.classification === (form.total.numerator === 0 ? 'all-domain' : 'empty');
    if (value.kind === 'nonnegative-addend-exceeds-total') return form.kind === 'additive' && nonnegative(input.ambientDomain) && compare(form.addend, form.total) > 0
        && equal(value.addend, form.addend) && equal(value.total, form.total) && value.addendGreaterThanTotal === true;
    if (value.kind !== 'isolated-variable' || form.kind === 'multiplicative' && form.coefficient.numerator === 0) return false;
    const root = form.kind === 'additive' ? subtractAffineScalars(form.total, form.addend) : divideAffineScalars(form.total, form.coefficient);
    if (!isCanonicalSignedRational(value.algebraicValue) || !same(value.algebraicValue, root) || !validTransformations(value.transformations, input.statement, input.variable, root)
        || value.admissible !== isStatementDomainMember(root, input.ambientDomain)) return false;
    return value.admissible ? isStatementAssignmentCheck(value.verification, input.statement, input.variable, input.ambientDomain)
        && same(value.verification.binding.value, root) && value.verification.comparison.truth : value.verification === null;
}

function lineValues(domain: StatementAmbientDomain, boundary: AlgebraicScalar): AlgebraicScalar[] {
    const values = domain.kind === 'finite' ? [...domain.values] : [
        ...(domain.values.lower ? [domain.values.lower.value] : []), ...(domain.values.upper ? [domain.values.upper.value] : []),
        ...domain.values.excludedValues.filter(value => (!domain.values.lower || compare(value, domain.values.lower.value) >= 0)
            && (!domain.values.upper || compare(value, domain.values.upper.value) <= 0))];
    return values.filter((value, index) => !same(value, boundary) && values.findIndex(other => same(other, value)) === index);
}
function buildLine(axis: SignedRationalAxis, boundary: AlgebraicScalar, domain: StatementAmbientDomain): AlgebraicInequalityProblem['solutionLine'] {
    require(isSignedRationalAxis(axis), 'Expected a coherent exact scaled axis.');
    const location = (value: AlgebraicScalar) => {
        const tick = axis.ticks.findIndex(other => same(other, value));
        require(tick >= 0, 'The axis must supply every boundary, domain endpoint, member and relevant excluded point.');
        return makeSignedRationalLocation(axis, tick);
    };
    return {axis, boundary: location(boundary), auxiliaryLocations: lineValues(domain, boundary).map(location)};
}
function validLine(value: unknown, boundary: AlgebraicScalar, domain: StatementAmbientDomain): boolean {
    if (!record(value) || !isSignedRationalAxis(value.axis) || !isSignedRationalLocation(value.boundary, value.axis)
        || !same(value.boundary.value, boundary) || !dense(value.auxiliaryLocations)
        || !value.auxiliaryLocations.every(location => isSignedRationalLocation(location, value.axis as SignedRationalAxis))) return false;
    const locations = value.auxiliaryLocations;
    return lineValues(domain, boundary).every(required => locations.some(location => same((location as {value: AlgebraicScalar}).value, required)));
}

export function buildAlgebraicEquationProblem(input: EquationBuildInput): AlgebraicEquationProblem {
    const form = equationForm(input.statement, input.variable);
    require(isStatementAmbientDomain(input.ambientDomain) && isElementaryEquationContext(input.context, input.statement, form, input.ambientDomain), 'Invalid elementary equation context or domain.');
    const checks = baseChecks(input, input.statement), math = equationMath(form, input.ambientDomain);
    const ambientSolution: AmbientStatementSolution = math.exceptional === 'zero' ? form.total.numerator === 0 ? {kind: 'all-domain', reason: 'constant-identity'}
        : {kind: 'empty', reason: 'constant-contradiction'} : math.set.kind === 'finite' && math.set.values.length === 0
            ? {kind: 'empty', reason: 'outside-domain'} : {kind: 'singleton', value: math.root!, notation: notation(math.root!)};
    return clone({kind: 'algebra-equations', variable: input.variable, ambientDomain: input.ambientDomain, statement: input.statement,
        candidateUniverse: input.candidateUniverse, assignment: input.assignment, ...checks, ambientSolution, solutionCardinality: cardinality(math.set),
        form, solutionWitness: buildEquationWitness(input, form, math), context: input.context});
}
export function buildAlgebraicInequalityProblem(input: InequalityBuildInput): AlgebraicInequalityProblem {
    const bound = inequalityBound(input.statement, input.variable);
    require(isStatementAmbientDomain(input.ambientDomain) && isStrictThresholdContext(input.context, bound, input.ambientDomain), 'Invalid strict threshold context or domain.');
    const checks = baseChecks(input, input.statement), set = inequalityMath(bound, input.ambientDomain);
    return clone({kind: 'algebra-inequalities', variable: input.variable, ambientDomain: input.ambientDomain, statement: input.statement,
        candidateUniverse: input.candidateUniverse, assignment: input.assignment, ...checks,
        ambientSolution: buildAmbient(set, input.ambientDomain, bound), solutionCardinality: cardinality(set),
        bound, solutionLine: buildLine(input.axis, bound.value, input.ambientDomain), context: input.context});
}
export function isAlgebraicEquationProblem(value: unknown): value is AlgebraicEquationProblem {
    try {
        if (!record(value) || value.kind !== 'algebra-equations') return false;
        const data = value as AlgebraicEquationProblem, form = equationForm(data.statement, data.variable);
        if (!equal(data.form, form) || !validBase(data) || !isElementaryEquationContext(data.context, data.statement, form, data.ambientDomain)) return false;
        const math = equationMath(form, data.ambientDomain);
        return validAmbient(data.ambientSolution, math.set, data.ambientDomain, undefined, form)
            && validCardinality(data.solutionCardinality, math.set) && validEquationWitness(data.solutionWitness, data, form);
    } catch { return false; }
}
export function isAlgebraicInequalityProblem(value: unknown): value is AlgebraicInequalityProblem {
    try {
        if (!record(value) || value.kind !== 'algebra-inequalities') return false;
        const data = value as AlgebraicInequalityProblem, bound = inequalityBound(data.statement, data.variable);
        if (!equal(data.bound, bound) || !validBase(data) || !isStrictThresholdContext(data.context, bound, data.ambientDomain)) return false;
        const set = inequalityMath(bound, data.ambientDomain);
        return validAmbient(data.ambientSolution, set, data.ambientDomain, bound)
            && validCardinality(data.solutionCardinality, set) && validLine(data.solutionLine, bound.value, data.ambientDomain);
    } catch { return false; }
}
