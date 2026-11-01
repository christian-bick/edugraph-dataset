import {createCanonicalNumericRange, type CanonicalNumericRange} from '../../lib/canonical-numeric-range.ts';
import type {AdditionCountingOnProblem, SubtractionCountingBackProblem} from '../../types/problems.ts';

/** Each pair contains the positive base and a count of one to three unit steps. */
export function countingStrategyPairs(range: CanonicalNumericRange): readonly (readonly [number, number])[] {
    if (!range || range.min !== 0 || ![5, 10, 20].includes(range.max)) {
        throw new Error('Counting strategies require a canonical upper5, upper10 or upper20 range without a positive lower.');
    }
    const expected = createCanonicalNumericRange(range.max);
    if (range.maximumAbove !== expected.maximumAbove || range.minimumBelow !== expected.minimumBelow) {
        throw new Error('Invalid canonical counting-strategy witnesses.');
    }
    const pairs: [number, number][] = [];
    for (let stepCount = 1; stepCount <= 3; stepCount++) {
        const firstBase = Math.max(1, range.maximumAbove + 1 - stepCount);
        for (let base = firstBase; base + stepCount <= range.max; base++) pairs.push([base, stepCount]);
    }
    return pairs;
}

export function sampleCountingStrategy(range: CanonicalNumericRange, operation: 'addition', draw: () => number): AdditionCountingOnProblem;
export function sampleCountingStrategy(range: CanonicalNumericRange, operation: 'subtraction', draw: () => number): SubtractionCountingBackProblem;
/** One draw selects a feasible ordered pair; all explicit unit-step witnesses are retained. */
export function sampleCountingStrategy(
    range: CanonicalNumericRange, operation: 'addition' | 'subtraction', draw: () => number
): AdditionCountingOnProblem | SubtractionCountingBackProblem {
    const pairs = countingStrategyPairs(range);
    const [base, rightOperand] = pairs[Math.floor(draw() * pairs.length)]!;
    const direction = operation === 'addition' ? 1 : -1;
    const leftOperand = operation === 'addition' ? base : base + rightOperand;
    return {
        task: 'integer-add-subtract-strategy',
        strategy: operation === 'addition' ? 'addition-counting-on' : 'subtraction-counting-back',
        operation,
        leftOperand,
        rightOperand,
        answer: leftOperand + direction * rightOperand,
        adjustment: rightOperand,
        steps: Array.from({length: rightOperand}, (_, index) => ({
            kind: 'operation', operation,
            leftOperand: leftOperand + direction * index,
            rightOperand: 1,
            result: leftOperand + direction * (index + 1)
        }))
    };
}
