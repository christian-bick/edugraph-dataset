import {Ability, Scope} from 'edugraph-ts/generated';
import type {ArithmeticProblem, ArithmeticTripleProblem, CountingProblem, CountingSelectionProblem} from '../types/problems.ts';
import {
    dependencyEvidenceIds,
    type DependencyFacetEvidence,
    type DependencyTriggerEvidence,
    type LabelDependencyEvidence
} from '../types/label-dependencies.ts';

export const LABEL_DEPENDENCY_EVIDENCE_VERSION = 2;

export interface LabelDependencyEvidenceInput {
    generatorId: string;
    viewId: string;
    mode: 'question' | 'solution';
    data?: unknown;
}

const arithmeticArities = new Map([
    ['arithmetic-ops-pairs', 2], ['arithmetic-ops-triples', 3], ['arithmetic-ops-four', 4]
]);
const arithmeticViews = new Set([
    'operations-boxes', 'operations-boxes-inversion', 'operations-vertical', 'operations-vertical-inversion'
]);
const countingViews = new Set([
    'counting-conservation', 'counting-objects-simple', 'counting-objects-parity',
    'counting-objects-one-to-one', 'counting-objects-cardinality'
]);
const operations = new Set(['addition', 'subtraction', 'multiplication', 'division']);
const operandCounts = [Scope.TwoOperands, Scope.ThreeOperands, Scope.FourOperands];
const knownFacets = ['numberKind', 'numeralSystem', 'base', 'sign', 'zero', 'operandCount',
    'operandDigits', 'fractionMagnitude', 'fractionUnit', 'decimalPrecision', 'referenceFrames', 'articulation'];

/** The registry is explicit: a familiar payload shape does not establish an unfamiliar projection. */
function adapterFor(generatorId: string, viewId: string): string | undefined {
    if (arithmeticArities.has(generatorId) && arithmeticViews.has(viewId)) return 'integer-arithmetic-v1';
    if (generatorId === 'counting-basic' && countingViews.has(viewId)) return 'object-counting-v1';
    if (generatorId === 'counting-selection' && viewId === 'counting-objects-count-out') return 'count-out-v1';
    return undefined;
}

export const hasLabelDependencyEvidenceAdapter = (generatorId: string, viewId: string): boolean =>
    adapterFor(generatorId, viewId) !== undefined;

const trigger = (status: DependencyTriggerEvidence['status'], reason: string,
    references: readonly string[]): DependencyTriggerEvidence => ({status, reason, references});
const unresolved = (reason: string, references: readonly string[] = []): DependencyFacetEvidence =>
    ({status: 'unresolved', reason, references});
const applicable = (expectedLabels: readonly string[], reason: string,
    references: readonly string[]): DependencyFacetEvidence => ({status: 'applicable', expectedLabels, reason, references});
const notApplicable = (reason: string, references: readonly string[]): DependencyFacetEvidence =>
    ({status: 'not_applicable', reason, references});

function unavailable(adapter: string, reason: string): LabelDependencyEvidence {
    return {
        adapter,
        triggers: Object.fromEntries(dependencyEvidenceIds.map(id => [id, trigger('unresolved', reason, [])])),
        facets: Object.fromEntries(knownFacets.map(id => [id, unresolved(reason)]))
    };
}

const object = (value: unknown): value is Record<string, unknown> =>
    value !== null && typeof value === 'object' && !Array.isArray(value);
const integer = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value);
const validKeys = (data: Record<string, unknown>, keys: readonly string[]): boolean =>
    Object.keys(data).every(key => keys.includes(key));

function arithmeticPayload(value: unknown, arity: number): value is ArithmeticProblem {
    if (!object(value) || !validKeys(value, ['operation', 'answer', 'num1', 'num2', 'num3', 'num4',
        'propertyLaw', 'combinedFactor', 'partialProducts', 'blankPart'])
        || typeof value.operation !== 'string' || !operations.has(value.operation) || !integer(value.answer)
        || value.blankPart !== undefined) return false;
    for (let index = 1; index <= 4; index++) {
        if (index <= arity ? !integer(value[`num${index}`]) : value[`num${index}`] !== undefined) return false;
    }
    if (value.propertyLaw !== undefined) {
        return arity === 3 && typeof value.propertyLaw === 'string'
            && ['commutative', 'associative', 'distributive'].includes(value.propertyLaw);
    }
    return value.combinedFactor === undefined && value.partialProducts === undefined;
}

function countingPayload(value: unknown, selection: boolean): value is CountingProblem | CountingSelectionProblem {
    return object(value) && validKeys(value, ['numObjects', 'simpleAnswer', 'parity', ...(selection ? ['availableCount'] : [])])
        && integer(value.numObjects) && value.numObjects >= (selection ? 1 : 0)
        && value.simpleAnswer === value.numObjects
        && (value.parity === undefined || value.parity === (value.numObjects % 2 === 0 ? 'even' : 'odd'))
        && (!selection || integer(value.availableCount) && value.availableCount >= value.numObjects);
}

/** Includes prescribed left-associated intermediate values, never arbitrary numeric object fields. */
function arithmeticValues(data: ArithmeticProblem, operands: readonly number[]): number[] | undefined {
    const values = [...operands];
    let current = operands[0];
    for (const operand of operands.slice(1)) {
        if (data.operation === 'addition') current += operand;
        else if (data.operation === 'subtraction') current -= operand;
        else if (data.operation === 'multiplication') current *= operand;
        else current /= operand;
        if (!Number.isSafeInteger(current)) return undefined;
        values.push(current);
    }
    return current === data.answer ? values : undefined;
}

interface PropertyWitnessDomain {
    values: number[];
    references: string[];
    operandExpressions: {operands: readonly number[]; references: readonly string[]}[];
    operandCounts: string[];
}

/** Review both displayed expressions, including their necessary grouped values and explicit partial-product sum. */
function propertyWitnessDomain(data: ArithmeticTripleProblem, references: readonly string[]): PropertyWitnessDomain | undefined {
    if (data.operation !== 'addition' && data.operation !== 'multiplication') return undefined;
    const operands = [data.num1, data.num2, data.num3];
    if (data.propertyLaw === 'distributive') {
        const combined = data.num2 + data.num3;
        const products = [data.num1 * data.num2, data.num1 * data.num3];
        const values = [...operands, combined, ...products, data.answer];
        if (data.operation !== 'multiplication' || !values.every(Number.isSafeInteger)
            || data.combinedFactor !== combined || !Array.isArray(data.partialProducts)
            || data.partialProducts.length !== 2 || !data.partialProducts.every((value, index) => value === products[index])
            || data.answer !== data.num1 * combined || data.answer !== products[0] + products[1]) return undefined;
        const productReferences = ['data.partialProducts[0]', 'data.partialProducts[1]'];
        return {values, references: [...references, 'data.combinedFactor', ...productReferences, 'data.answer'],
            operandExpressions: [{operands, references}, {operands: products, references: productReferences}],
            // a × (b + c), a × b + a × c, and p + q are three separate displayed expressions.
            operandCounts: [Scope.TwoOperands, Scope.ThreeOperands, Scope.FourOperands]};
    }
    if (data.combinedFactor !== undefined || data.partialProducts !== undefined) return undefined;
    const combine = (left: number, right: number) => data.operation === 'addition' ? left + right : left * right;
    const firstGroup = combine(data.num1, data.num2);
    const secondGroup = combine(data.num2, data.num3);
    const values = [...operands, firstGroup, ...(data.propertyLaw === 'associative' ? [secondGroup] : []), data.answer];
    if (!values.every(Number.isSafeInteger) || data.answer !== combine(firstGroup, data.num3)
        || data.propertyLaw === 'associative' && data.answer !== combine(data.num1, secondGroup)) return undefined;
    return {values, references: [...references, 'data.answer', 'property-law grouped results'],
        operandExpressions: [{operands, references}], operandCounts: [Scope.ThreeOperands]};
}

function numericFacets(values: readonly number[], references: readonly string[]): Record<string, DependencyFacetEvidence> {
    return {
        numberKind: applicable([Scope.IntegerNumbers], 'All established task values are integers.', references),
        sign: applicable([values.some(value => value < 0) ? Scope.NumbersWithNegatives : Scope.NumbersWithoutNegatives],
            'Sign follows the established task values, including necessary results.', references),
        zero: applicable([values.some(value => value === 0) ? Scope.NumbersWithZero : Scope.NumbersWithoutZero],
            'Zero means a zero-valued task quantity, not a zero digit in a numeral.', references)
    };
}

function numeralFacets(reference: string): Record<string, DependencyFacetEvidence> {
    return {
        numeralSystem: applicable([Scope.ArabicNumerals], 'The reviewed view displays or explicitly requests digit numerals.', [reference]),
        base: applicable([Scope.Base10], 'The reviewed view renders these integers in decimal positional notation.', [reference])
    };
}

const digitCount = (value: number): number => String(Math.abs(value)).length;
function digitLabel(value: number, exact: readonly string[], multiple: string): string {
    return exact[digitCount(value) - 1] ?? multiple;
}

function operandDigits(data: ArithmeticProblem, operands: readonly number[], references: readonly string[]): DependencyFacetEvidence {
    if (operands.some(value => value < 0)) {
        return unresolved('Signed smallest/largest operand digit profiles are not covered by this adapter.', references);
    }
    const labels = [
        digitLabel(Math.min(...operands), [Scope.SingleDigitSmallestOperand, Scope.TwoDigitSmallestOperand,
            Scope.ThreeDigitSmallestOperand], Scope.MultipleDigitSmallestOperand),
        digitLabel(Math.max(...operands), [Scope.SingleDigitLargestOperand, Scope.TwoDigitLargestOperand,
            Scope.ThreeDigitLargestOperand, Scope.FourDigitLargestOperand], Scope.MultipleDigitLargestOperand)
    ];
    if (data.operation === 'division') {
        labels.push(digitLabel(operands[0], [Scope.SingleDigitDividend, Scope.TwoDigitDividend,
            Scope.ThreeDigitDividend, Scope.FourDigitDividend], Scope.MultipleDigitDividend));
        for (const divisor of operands.slice(1)) {
            labels.push(digitLabel(divisor, [Scope.SingleDigitDivisor, Scope.TwoDigitDivisor,
                Scope.ThreeDigitDivisor], Scope.MultipleDigitDivisor));
        }
    }
    return applicable([...new Set(labels)].sort(), 'Digit profiles describe the source operands in their mathematical roles.', references);
}

function propertyOperandDigits(data: ArithmeticProblem, domain: PropertyWitnessDomain): DependencyFacetEvidence {
    const profiles = domain.operandExpressions.map(expression => operandDigits(data, expression.operands, expression.references));
    const references = [...new Set(domain.operandExpressions.flatMap(expression => expression.references))];
    if (profiles.some(profile => profile.status === 'unresolved')) {
        return unresolved('Signed smallest/largest operand digit profiles are not covered by this adapter.', references);
    }
    return applicable([...new Set(profiles.flatMap(profile => profile.expectedLabels ?? []))].sort(),
        'Each displayed property-law expression contributes its explicit operand digit profile; results count only when reused as operands.', references);
}

function arithmeticEvidence(input: LabelDependencyEvidenceInput, adapter: string): LabelDependencyEvidence {
    const arity = arithmeticArities.get(input.generatorId)!;
    const data = input.data;
    if (!arithmeticPayload(data, arity)) return unavailable(adapter, 'Missing, unsupported, or malformed arithmetic payload.');
    const reference = `view:${input.viewId}:${input.mode}`;
    const references = Array.from({length: arity}, (_, index) => `data.num${index + 1}`);
    const operands = [data.num1, data.num2, ...('num3' in data && data.num3 !== undefined ? [data.num3] : []),
        ...('num4' in data ? [data.num4] : [])];
    const result = unavailable(adapter, 'No reviewed evidence adapter for this facet.');
    const triggers = {...result.triggers,
        numericTask: trigger('present', 'The typed task is a numerical arithmetic equation.', [...references, 'data.answer']),
        arithmeticOperands: trigger('present', 'The reviewed equation contains explicit operand occurrences.', references)};
    const facets = {...result.facets, ...numeralFacets(reference)};
    const witness = data.propertyLaw !== undefined ? propertyWitnessDomain(data, references) : undefined;
    if (data.propertyLaw !== undefined && !witness) return unavailable(adapter, 'Property-law witnesses do not satisfy the reviewed integer expression contract.');
    const values = witness?.values ?? arithmeticValues(data, operands);
    if (!values) return unavailable(adapter, 'Arithmetic results or intermediates do not satisfy the reviewed integer equation contract.');
    triggers.fractionValues = trigger('absent', 'This equation uses integer digit numerals, not fractions.', [reference]);
    triggers.decimalRepresentation = trigger('absent', 'The view renders integers without decimal fractional places.', [reference]);
    triggers.writtenExplanation = trigger('absent', 'The reviewed equation requests a missing value, not a written explanation.', [reference]);
    facets.operandCount = applicable(witness?.operandCounts ?? [operandCounts[arity - 2]],
        witness ? 'Count explicit operand occurrences separately in each displayed primary and witness expression.'
            : 'Count source operand occurrences, including repeated values.', references);
    const underdetermined = input.mode === 'question' && input.viewId.endsWith('-inversion')
        && ((data.operation === 'multiplication' && (data.propertyLaw === 'distributive'
            ? data.num1 === 0 : operands.filter((_, index) => index !== 1).includes(0)))
            || data.operation === 'division' && data.num1 === 0);
    if (underdetermined) {
        for (const facet of ['numberKind', 'sign', 'zero', 'operandDigits']) {
            facets[facet] = unresolved('The blank operand is underdetermined; its hidden sampled value is not observable evidence.', [reference]);
        }
    } else {
        Object.assign(facets, numericFacets(values, witness?.references ?? [...references, 'data.answer', 'prescribed arithmetic intermediates']));
        facets.operandDigits = witness ? propertyOperandDigits(data, witness) : operandDigits(data, operands, references);
    }
    return {...result, triggers, facets};
}

function countingEvidence(input: LabelDependencyEvidenceInput, adapter: string): LabelDependencyEvidence {
    const selection = input.generatorId === 'counting-selection';
    const data = input.data;
    if (!countingPayload(data, selection)) return unavailable(adapter, 'Missing, unsupported, or malformed counting payload.');
    if (input.viewId === 'counting-objects-parity' && (data.numObjects < 1 || data.numObjects > 20 || data.parity === undefined)) {
        return unavailable(adapter, 'Parity projection requires a correct parity and a count from one through twenty.');
    }
    const reference = `view:${input.viewId}:${input.mode}`;
    const references = ['data.numObjects', ...(selection ? ['data.availableCount'] : [])];
    const values = [data.numObjects, ...('availableCount' in data ? [data.availableCount] : [])];
    if (input.viewId === 'counting-objects-parity') values.push(Math.floor(data.numObjects / 2), data.numObjects % 2);
    const result = unavailable(adapter, 'No reviewed evidence adapter for this facet.');
    const triggers = {...result.triggers,
        numericTask: trigger('present', 'The task concerns the cardinality of the represented collection.', references),
        arithmeticOperands: trigger('absent', 'Object counting does not expose an arithmetic operand expression.', [reference]),
        fractionValues: trigger('absent', 'The reviewed collection task uses whole object counts.', references),
        decimalRepresentation: trigger('absent', 'The reviewed view has no decimal fractional-place representation.', [reference])};
    const facets = {...result.facets, ...numericFacets(values, references)};
    if (input.viewId === 'counting-conservation') {
        const reason = 'The conservation view uses object collections and word choices without a numeral response.';
        facets.numeralSystem = notApplicable(reason, [reference]);
        facets.base = notApplicable(reason, [reference]);
    } else Object.assign(facets, numeralFacets(reference));
    if (input.viewId === 'counting-objects-simple') {
        triggers.writtenExplanation = trigger('present', 'The question requests a written explanation and the solution supplies one.', [reference]);
        facets.articulation = applicable([Ability.TextualArticulation], 'The reviewed task explicitly requests or demonstrates a written explanation.', [reference]);
    } else triggers.writtenExplanation = trigger('absent', 'This reviewed counting projection does not request written explanation.', [reference]);
    return {...result, triggers, facets};
}

/** Read-only assessments over reviewed typed task/projection pairs; never walks arbitrary numbers. */
export function assessLabelDependencyEvidence(input: LabelDependencyEvidenceInput): LabelDependencyEvidence {
    const adapter = adapterFor(input.generatorId, input.viewId);
    if (!adapter) return unavailable('uncovered', `No reviewed adapter for ${input.generatorId}/${input.viewId}.`);
    return arithmeticArities.has(input.generatorId) ? arithmeticEvidence(input, adapter) : countingEvidence(input, adapter);
}
