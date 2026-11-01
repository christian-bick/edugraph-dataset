import {createCanonicalNumericRange, type CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import type {IntegerAddSubtractStrategyStep, IntegerFlexibleStrategyProblem} from '../../../types/problems.ts';

export type FlexibleStrategy = 'addition-make-ten' | 'addition-near-doubles'
    | 'addition-compensation-single' | 'addition-compensation-multiple'
    | 'subtraction-compensation-single' | 'subtraction-compensation-multiple'
    | 'subtraction-make-ten' | 'subtraction-think-addition';

export interface StrategyRow {
    readonly anchor: number;
    readonly minimum: number;
    readonly maximum: number;
    readonly weight: number;
}

const strategies: readonly FlexibleStrategy[] = ['addition-make-ten', 'addition-near-doubles',
    'addition-compensation-single', 'addition-compensation-multiple', 'subtraction-compensation-single',
    'subtraction-compensation-multiple', 'subtraction-make-ten', 'subtraction-think-addition'];
const domains = new Map<string, readonly StrategyRow[]>();

/** Compact intervals condition the original row/tail law, without materializing a million proof payloads. */
export function flexibleStrategyRows(strategy: FlexibleStrategy, range: CanonicalNumericRange): readonly StrategyRow[] {
    if (!strategies.includes(strategy) || !range || ![5, 10, 20, 100, 120, 1000].includes(range.max)
        || ![0, 5].includes(range.min) || range.min >= range.max) {
        throw new GeneratorValidationError('integer-add-subtract-strategies', 'Expected a supported strategy and reviewed canonical bounds.');
    }
    const expected = createCanonicalNumericRange(range.max, range.min);
    if (range.maximumAbove !== expected.maximumAbove || range.minimumBelow !== expected.minimumBelow) {
        throw new GeneratorValidationError('integer-add-subtract-strategies', 'Canonical range witnesses are missing or inconsistent.');
    }
    const key = `${strategy}:${range.min}:${range.max}`;
    if (domains.has(key)) return domains.get(key)!;
    const rows: StrategyRow[] = [];
    const append = (anchor: number, minimum: number, maximum: number, originalCount: number) => {
        if (minimum <= maximum) rows.push({anchor, minimum, maximum, weight: (maximum - minimum + 1) / originalCount});
    };
    if (strategy === 'addition-near-doubles') {
        if (range.min === 0) {
            const minimum = Math.max(1, Math.ceil(range.maximumAbove / 2));
            const maximum = Math.min(499, Math.floor((range.max - 1) / 2));
            for (let base = minimum; base <= maximum; base++) append(base, 0, 1, 2);
        }
    } else if (strategy === 'addition-make-ten') {
        if (range.min === 0) for (let left = 6; left <= 9; left++) {
            append(left, Math.max(1, range.maximumAbove - 9), Math.min(989, range.max - 10), 989);
        }
    } else if (strategy === 'subtraction-make-ten') {
        for (let adjustment = 1; adjustment <= 9; adjustment++) {
            const largest = 10 + adjustment;
            if (largest <= range.maximumAbove || largest > range.max) continue;
            if (range.min === 5) {
                if (adjustment >= 5) append(adjustment, 5, 5, 9);
            } else if (adjustment >= 5) {
                append(adjustment, 1, 4, 9);
                append(adjustment, 6, 9, 9);
            } else append(adjustment, 1, 9, 9);
        }
    } else {
        for (let right = 1; right <= 989; right++) {
            if (right % 10 === 0) continue;
            const adjustment = 10 - right % 10;
            const friendly = right + adjustment;
            let minimum = Math.max(1, range.maximumAbove - friendly + 1);
            let maximum = Math.min(999 - friendly, range.max - friendly);
            if (range.min === 5) {
                if (right < 5 || adjustment < 5) continue;
                minimum = Math.max(5, minimum);
            } else if (right >= 5 && adjustment >= 5) maximum = Math.min(4, maximum);
            if (strategy === 'addition-compensation-single') {
                if (right >= 10) continue;
                maximum = Math.min(right - 1, maximum);
            } else if (strategy === 'addition-compensation-multiple' && right < 10) minimum = Math.max(right, minimum);
            else if (strategy === 'subtraction-compensation-single') {
                if (right >= 10) continue;
                maximum = Math.min(9 - right, maximum);
            } else if (strategy === 'subtraction-compensation-multiple' && right < 10) minimum = Math.max(10 - right, minimum);
            append(right, minimum, maximum, 999 - friendly);
        }
    }
    domains.set(key, rows);
    return rows;
}

const operationStep = (operation: 'addition' | 'subtraction', leftOperand: number, rightOperand: number, result: number): IntegerAddSubtractStrategyStep =>
    ({kind: 'operation', operation, leftOperand, rightOperand, result});
const decompositionStep = (whole: number, first: number, second: number): IntegerAddSubtractStrategyStep =>
    ({kind: 'decomposition', whole, parts: [first, second]});

/** Build the original required typed proof only after its feasible mathematical parameters are selected. */
export function buildFlexibleStrategy(strategy: FlexibleStrategy, anchor: number, tail: number): IntegerFlexibleStrategyProblem {
    const task = 'integer-add-subtract-strategy' as const;
    if (strategy === 'addition-near-doubles') {
        const leftOperand = anchor + tail, rightOperand = anchor + 1 - tail, answer = 2 * anchor + 1;
        return {task, strategy, operation: 'addition', leftOperand, rightOperand, answer, adjustment: 1,
            steps: [operationStep('addition', anchor, anchor, 2 * anchor), operationStep('addition', 2 * anchor, 1, answer)]};
    }
    if (strategy === 'addition-make-ten') {
        const adjustment = 10 - anchor, rightOperand = adjustment + tail, answer = 10 + tail;
        return {task, strategy, operation: 'addition', leftOperand: anchor, rightOperand, answer, adjustment,
            steps: [decompositionStep(rightOperand, adjustment, tail), operationStep('addition', anchor, adjustment, 10),
                operationStep('addition', 10, tail, answer)]};
    }
    if (strategy === 'subtraction-make-ten') {
        const leftOperand = 10 + anchor, rightOperand = anchor + tail, answer = 10 - tail;
        return {task, strategy, operation: 'subtraction', leftOperand, rightOperand, answer, adjustment: anchor,
            steps: [decompositionStep(rightOperand, anchor, tail), operationStep('subtraction', leftOperand, anchor, 10),
                operationStep('subtraction', 10, tail, answer)]};
    }
    const rightOperand = anchor, adjustment = 10 - anchor % 10, friendly = anchor + adjustment;
    if (strategy.startsWith('addition-compensation')) {
        const leftOperand = tail + adjustment, answer = friendly + tail;
        return {task, strategy: 'addition-compensation', operation: 'addition', leftOperand, rightOperand, answer, adjustment,
            steps: [operationStep('subtraction', leftOperand, adjustment, tail), operationStep('addition', rightOperand, adjustment, friendly),
                operationStep('addition', tail, friendly, answer)]};
    }
    if (strategy.startsWith('subtraction-compensation')) {
        const leftOperand = anchor + tail;
        return {task, strategy: 'subtraction-compensation', operation: 'subtraction', leftOperand, rightOperand, answer: tail, adjustment,
            steps: [operationStep('addition', rightOperand, adjustment, friendly), operationStep('addition', leftOperand, adjustment, friendly + tail),
                operationStep('subtraction', friendly + tail, friendly, tail)]};
    }
    const leftOperand = friendly + tail, answer = adjustment + tail;
    return {task, strategy: 'subtraction-think-addition', operation: 'subtraction', leftOperand, rightOperand, answer, adjustment,
        steps: [operationStep('addition', rightOperand, adjustment, friendly), operationStep('addition', friendly, tail, leftOperand),
            operationStep('addition', adjustment, tail, answer)]};
}
