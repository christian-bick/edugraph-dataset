import {createCanonicalNumericRange, type CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import type {ArithmeticOperation, ArithmeticWordProblemLetterEquation} from '../../../types/problems.ts';

type Term = readonly [coefficient: number, constant: number];
type Terms = readonly [Term, Term, Term, Term, Term];
type Operations = readonly [ArithmeticOperation, ArithmeticOperation];
interface Formula {readonly operations: Operations; readonly secondLimit: number; readonly thirdLimit: number;
    readonly scalarMinimum?: number; readonly firstOperandMinimum?: number;
    readonly higherFloorPairs?: readonly (readonly [number, number])[];
    readonly terms: (second: number, third: number) => Terms}
const ceiling = 999999;
export const letterEquationFormulas: readonly Formula[] = [
    {operations: ['addition', 'addition'], secondLimit: 50, thirdLimit: 50,
        terms: (b, c) => [[1, 0], [0, b], [0, c], [1, b], [1, b + c]]},
    {operations: ['subtraction', 'subtraction'], secondLimit: 50, thirdLimit: 50,
        terms: (b, c) => [[1, b + c], [0, c], [0, b], [1, b], [1, 0]]},
    {operations: ['multiplication', 'multiplication'], secondLimit: 50, thirdLimit: 50,
        terms: (b, c) => [[1, 0], [0, b], [0, c], [b, 0], [b * c, 0]]},
    {operations: ['division', 'division'], secondLimit: 12, thirdLimit: 12,
        higherFloorPairs: [[20, 20]],
        terms: (b, c) => [[b * c, 0], [0, c], [0, b], [b, 0], [1, 0]]},
    {operations: ['addition', 'subtraction'], secondLimit: 50, thirdLimit: 50,
        terms: (b, c) => [[1, 0], [0, b], [0, c], [1, b], [1, b - c]]},
    {operations: ['multiplication', 'addition'], secondLimit: 50, thirdLimit: 50,
        terms: (b, c) => [[1, 0], [0, b], [0, c], [b, 0], [b, c]]},
    {operations: ['division', 'addition'], secondLimit: 12, thirdLimit: 50,
        higherFloorPairs: Array.from({length: 31}, (_, index) => [20, 20 + index] as const),
        terms: (b, c) => [[b, 0], [0, b], [0, c], [1, 0], [1, c]]},
    {operations: ['multiplication', 'subtraction'], secondLimit: 50, thirdLimit: 50,
        terms: (b, c) => [[1, 0], [0, b], [0, c], [b, 0], [b, -c]]},
    {operations: ['division', 'subtraction'], secondLimit: 50, thirdLimit: 12,
        higherFloorPairs: Array.from({length: 31}, (_, index) => [20 + index, 20] as const),
        terms: (b, c) => [[c, b * c], [0, c], [0, b], [1, b], [1, 0]]},
    // The factor b constructs num2=b*c; it is not a separate quantity in the two given steps.
    {operations: ['multiplication', 'division'], secondLimit: 10, thirdLimit: 10,
        higherFloorPairs: [[20, 20]],
        terms: (b, c) => [[1, 0], [0, b * c], [0, c], [b * c, 0], [b, 0]]},
    // Preserve the six further ordered sequences admitted by the public direct path.
    {operations: ['addition', 'multiplication'], secondLimit: 50, thirdLimit: 50,
        terms: (b, c) => [[1, 0], [0, b], [0, c], [1, b], [c, b * c]]},
    {operations: ['subtraction', 'addition'], secondLimit: 50, thirdLimit: 50,
        terms: (b, c) => [[1, 0], [0, b], [0, c], [1, -b], [1, c - b]]},
    {operations: ['subtraction', 'multiplication'], secondLimit: 50, thirdLimit: 50,
        terms: (b, c) => [[1, 0], [0, b], [0, c], [1, -b], [c, -b * c]]},
    // Scalar t is the integral quotient: congruence is constructive rather than rejected after drawing.
    {operations: ['addition', 'division'], secondLimit: 50, thirdLimit: 50, scalarMinimum: 1, firstOperandMinimum: 2,
        terms: (b, c) => [[c, -b], [0, b], [0, c], [c, 0], [1, 0]]},
    {operations: ['subtraction', 'division'], secondLimit: 50, thirdLimit: 50, scalarMinimum: 1,
        terms: (b, c) => [[c, b], [0, b], [0, c], [c, 0], [1, 0]]},
    {operations: ['division', 'multiplication'], secondLimit: 50, thirdLimit: 50, scalarMinimum: 1,
        terms: (b, c) => [[b, 0], [0, b], [0, c], [1, 0], [c, 0]]}
];
export interface LetterEquationRow {readonly second: number; readonly third: number;
    readonly first: number; readonly last: number; readonly end: number}
export interface LetterEquationDomain {readonly rows: readonly LetterEquationRow[]; readonly count: number}
const domains = new Map<string, LetterEquationDomain>();

export const letterEquationQuantities = (data: ArithmeticWordProblemLetterEquation): number[] =>
    [...data.operands, data.intermediate, data.answer];

/** All required quantities are affine in one scalar. Intersect inequalities before drawing it. */
function interval(terms: Terms, range: CanonicalNumericRange, formula: Formula, scalarMinimum?: number): readonly [number, number] | undefined {
    let first = scalarMinimum ?? formula.scalarMinimum ?? 2, last = ceiling;
    const minimum = Math.max(1, range.min), maximum = Math.min(ceiling, range.max);
    for (const [coefficient, constant] of terms) {
        if (coefficient === 0) {
            if (constant < minimum || constant > maximum) return undefined;
        } else {
            first = Math.max(first, Math.ceil((minimum - constant) / coefficient));
            last = Math.min(last, Math.floor((maximum - constant) / coefficient));
        }
    }
    if (formula.firstOperandMinimum) first = Math.max(first, Math.ceil((formula.firstOperandMinimum - terms[0][1]) / terms[0][0]));
    const moving = terms.filter(([coefficient]) => coefficient > 0);
    const fixed = terms.filter(([coefficient]) => coefficient === 0).map(([, constant]) => constant);
    if (!fixed.some(value => value > range.maximumAbove)) first = Math.max(first,
        Math.min(...moving.map(([coefficient, constant]) => Math.floor((range.maximumAbove - constant) / coefficient) + 1)));
    if (!fixed.some(value => value < range.minimumBelow)) last = Math.min(last,
        Math.max(...moving.map(([coefficient, constant]) => Math.floor((range.minimumBelow - 1 - constant) / coefficient))));
    return first <= last ? [first, last] : undefined;
}

export function letterEquationDomain(operations: Operations, range: CanonicalNumericRange): LetterEquationDomain {
    const formula = letterEquationFormulas.find(formula => formula.operations.join() === operations?.join());
    if (!formula || !range || ![5, 10, 20, 100, 120, 1000, 10000, 100000, 1000000].includes(range.max)
        || ![0, 5, 10, 20].includes(range.min) || range.min >= range.max) {
        throw new GeneratorValidationError('arithmetic-word-problems-letter-equation', 'Expected a reviewed operation sequence and canonical numeric bounds.');
    }
    const expected = createCanonicalNumericRange(range.max, range.min);
    if (range.maximumAbove !== expected.maximumAbove || range.minimumBelow !== expected.minimumBelow) {
        throw new GeneratorValidationError('arithmetic-word-problems-letter-equation', 'Canonical range witnesses are missing or inconsistent.');
    }
    const key = `${operations.join()}:${range.min}:${range.max}`;
    if (!domains.has(key)) {
        const rows: LetterEquationRow[] = [];
        let count = 0;
        const parameters = Array.from({length: formula.secondLimit - 1}, (_, index) => index + 2)
            .flatMap(second => Array.from({length: formula.thirdLimit - 1}, (_, index) => ({second, third: index + 2, minimum: formula.scalarMinimum ?? 2})))
            // The old draw(limit) uses max(requestedMinimum,limit): L20 therefore admits
            // these exact additional pairs at scalar>=20, rather than silently losing them.
            .concat((formula.higherFloorPairs ?? []).map(([second, third]) => ({second, third, minimum: 20})));
        for (const {second, third, minimum} of parameters) {
            const admitted = interval(formula.terms(second, third), range, formula, minimum);
            if (!admitted) continue;
            count += admitted[1] - admitted[0] + 1;
            rows.push({second, third, first: admitted[0], last: admitted[1], end: count});
        }
        domains.set(key, {rows, count});
    }
    return domains.get(key)!;
}

export function letterEquationFrame(domain: LetterEquationDomain, operations: Operations, index: number): ArithmeticWordProblemLetterEquation {
    if (!Number.isSafeInteger(index) || index < 0 || index >= domain.count) {
        throw new GeneratorValidationError('arithmetic-word-problems-letter-equation', 'Expected an admitted scalar-frame index.');
    }
    let low = 0, high = domain.rows.length - 1;
    while (low < high) {
        const middle = (low + high) >>> 1;
        if (index < domain.rows[middle]!.end) high = middle;
        else low = middle + 1;
    }
    const row = domain.rows[low]!, start = row.end - (row.last - row.first + 1);
    const first = row.first + index - start;
    const formula = letterEquationFormulas.find(formula => formula.operations.join() === operations.join());
    if (!formula) throw new GeneratorValidationError('arithmetic-word-problems-letter-equation', 'Expected a reviewed operation sequence.');
    const values = formula.terms(row.second, row.third).map(([coefficient, constant]) => coefficient * first + constant);
    return {kind: 'letter-equation', operands: [values[0]!, values[1]!, values[2]!], operations,
        intermediate: values[3]!, answer: values[4]!};
}
