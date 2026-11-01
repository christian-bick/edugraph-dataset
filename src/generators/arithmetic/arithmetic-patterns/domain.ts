import {createCanonicalNumericRange, hasCanonicalRangeWitness, type CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import type {ArithmeticPatternOperation, ArithmeticRecurrencePatternProblem} from '../../../types/problems.ts';

export type PatternProperty = 'commutative' | 'associative' | 'distributive';

export const patternProperty = (commutative: boolean, associative: boolean, distributive: boolean): PatternProperty | false | undefined =>
    Number(commutative) + Number(associative) + Number(distributive) > 1 ? undefined
        : commutative ? 'commutative' : associative ? 'associative' : distributive ? 'distributive' : false;

/** The rule, complete sequence (including a missing answer), and any required law calculation. */
export const patternQuantities = (data: ArithmeticRecurrencePatternProblem): number[] => [
    ...data.terms,
    ...(data.recurrence.kind === 'position-multiple'
        ? [data.recurrence.factor, ...data.terms.map((_, index) => index)]
        : [data.recurrence.start, data.recurrence.operand]),
    ...(data.emergentFeature.kind === 'two-step-recurrence' ? [data.emergentFeature.combinedOperand] : []),
    ...(data.lawWitness?.law === 'distributive'
        ? [data.lawWitness.multiplier, ...data.lawWitness.addends, data.lawWitness.result]
        : data.lawWitness ? [...data.lawWitness.operands, data.lawWitness.result] : [])
];

const frames = new Map<string, ArithmeticRecurrencePatternProblem[]>();
for (const operation of ['addition', 'multiplication'] as const) {
    for (const property of [false, 'commutative', 'associative', 'distributive'] as const) {
        if (property === 'distributive' && operation !== 'multiplication') continue;
        const entries: ArithmeticRecurrencePatternProblem[] = [];
        frames.set(`${operation}:${property}`, entries);
        if (property === 'distributive') {
            for (let factor = 2; factor <= 6; factor++) for (let column = 1; column <= 5; column++) {
                const terms = Array.from({length: 7}, (_, index) => factor * index);
                entries.push({kind: 'recurrence', recurrence: {kind: 'position-multiple', factor}, terms,
                    emergentFeature: {kind: 'constant-difference', difference: factor},
                    lawWitness: {law: 'distributive', multiplier: factor, addends: [column, 1], result: terms[column + 1]!}});
            }
            continue;
        }
        const starts = property === 'associative' ? [1, 2] : property === 'commutative' ? [1, 2, 3]
            : operation === 'addition' ? Array.from({length: 10}, (_, index) => index + 1) : [1, 3, 5];
        const operands = property ? [2, 3] : operation === 'addition' ? [1, 3, 5] : [2, 4];
        for (const start of starts) for (const operand of operands) {
            const recurrence = operation === 'addition' ? {kind: 'add-constant' as const, start, operand}
                : {kind: 'multiply-constant' as const, start, operand};
            const terms = [start];
            while (terms.length < (!property && operation === 'addition' ? 6 : 5)) {
                terms.push(operation === 'addition' ? terms.at(-1)! + operand : terms.at(-1)! * operand);
            }
            entries.push({kind: 'recurrence', recurrence, terms,
                emergentFeature: property === 'commutative' ? {kind: 'operand-order-invariance'}
                    : property === 'associative' ? {kind: 'two-step-recurrence',
                        combinedOperand: operation === 'addition' ? operand + operand : operand * operand}
                        : operation === 'addition' ? {kind: 'alternating-parity'} : {kind: 'even-after-start'},
                ...(property ? {lawWitness: property === 'commutative'
                    ? {law: 'commutative' as const, operands: [start, operand] as [number, number], result: terms[1]!}
                    : {law: 'associative' as const, operands: [start, operand, operand] as [number, number, number], result: terms[2]!}} : {})});
        }
    }
}

const domains = new Map<string, readonly ArithmeticRecurrencePatternProblem[]>();

/** Each profile conditions a uniform original branch; their disjoint union retains all 81 frames. */
export function patternDomain(operation: ArithmeticPatternOperation, property: PatternProperty | false,
    range: CanonicalNumericRange): readonly ArithmeticRecurrencePatternProblem[] {
    if (!range || ![5, 10, 20, 100, 120, 1000, 10000].includes(range.max)
        || ![0, 5].includes(range.min) || range.min >= range.max) {
        throw new GeneratorValidationError('arithmetic-patterns', 'Expected reviewed canonical numeric bounds.');
    }
    const expected = createCanonicalNumericRange(range.max, range.min);
    if (range.maximumAbove !== expected.maximumAbove || range.minimumBelow !== expected.minimumBelow) {
        throw new GeneratorValidationError('arithmetic-patterns', 'Canonical range witnesses are missing or inconsistent.');
    }
    const key = `${operation}:${property}:${range.min}:${range.max}`;
    if (!domains.has(key)) domains.set(key, (frames.get(`${operation}:${property}`) ?? [])
        .filter(data => hasCanonicalRangeWitness(patternQuantities(data), range)));
    return domains.get(key)!;
}
