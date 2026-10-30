import {createElement, type ComponentType} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {buildDecimalStandardAddSubtractProblem as addSubtract} from '../../../generators/arithmetic/standard-algorithm-decimal-add-subtract/generator.ts';
import {buildDecimalStandardMultiplicationProblem as multiply} from '../../../generators/arithmetic/standard-algorithm-decimal-multiplication/generator.ts';
import {buildDecimalStandardDivisionProblem as divide} from '../../../generators/arithmetic/standard-algorithm-decimal-division/generator.ts';
import {decimalAdditionOracle, decimalAlignmentOracle, decimalBorrowOracle, decimalDivisionOracle, decimalExtensionOracle,
    decimalMultiplicationOracle, decimalSmallDivisionOracle, decimalTrailingDivisionOracle} from './decimal-standard-fixtures.ts';
import {DecimalStandardAddSubtractBody, DecimalStandardDivisionBody, DecimalStandardMultiplicationBody} from './decimal-standard-view.tsx';

const text = (markup: string): string => markup.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
const add = (data: typeof decimalAdditionOracle, solution: boolean) => renderToStaticMarkup(<DecimalStandardAddSubtractBody data={data} isSolutionView={solution} />);
const mul = (data: typeof decimalMultiplicationOracle, solution: boolean) => renderToStaticMarkup(<DecimalStandardMultiplicationBody data={data} isSolutionView={solution} />);
const div = (data: typeof decimalDivisionOracle, solution: boolean) => renderToStaticMarkup(<DecimalStandardDivisionBody data={data} isSolutionView={solution} />);

const unitCaptions = (markup: string, role: 'aligned-top-units' | 'aligned-bottom-units') => {
    const marker = `data-role="${role}"`;
    const start = markup.indexOf(marker);
    if (start < 0) throw new Error(`Missing operand unit row: ${role}`);
    const next = markup.indexOf('data-role=', start + marker.length);
    const row = markup.slice(start, next < 0 ? markup.length : next);
    return Object.fromEntries([...row.matchAll(/<div[^>]*data-place="(-?\d+)"[^>]*>([\s\S]*?)<\/div>/g)]
        .map(match => [match[1], text(match[2]!).trim()]).filter(([, unit]) => unit !== ''));
};

describe('given decimal operand unit captions', () => {
    it('identifies the original zero-unit counts without revealing the disputed subtraction answer', () => {
        const data = addSubtract('subtraction', '660.005', '0.092');
        for (const solution of [false, true]) {
            const markup = add(data, solution);
            expect(unitCaptions(markup, 'aligned-top-units')).toEqual({
                2: 'hundreds', 1: 'tens', 0: 'ones', '-1': 'tenths', '-2': 'hundredths', '-3': 'thousandths'
            });
            expect(unitCaptions(markup, 'aligned-bottom-units')).toEqual({
                0: 'ones', '-1': 'tenths', '-2': 'hundredths', '-3': 'thousandths'
            });
            expect(markup.match(/data-role="aligned-(?:top|bottom)-units"/g)).toHaveLength(2);
            if (!solution) {
                expect(markup).not.toContain('659.913');
                expect(markup).not.toContain('column-calculations');
                expect(markup).not.toContain('data-role="regrouping"');
                expect(markup).not.toContain('emerald');
            }
        }
    });

    it('leaves unwritten fractional and leading places uncaptioned in Question', () => {
        const data = addSubtract('subtraction', '5.20', '0.004');
        expect(unitCaptions(add(data, false), 'aligned-top-units')).toEqual({
            0: 'ones', '-1': 'tenths', '-2': 'hundredths'
        });
        expect(unitCaptions(add(data, true), 'aligned-top-units')).toEqual({
            0: 'ones', '-1': 'tenths', '-2': 'hundredths', '-3': 'thousandths'
        });
        expect(unitCaptions(add(data, false), 'aligned-bottom-units')).toEqual({
            0: 'ones', '-1': 'tenths', '-2': 'hundredths', '-3': 'thousandths'
        });
    });

    it('does not turn written result digits or carry-only leading places into captioned zero quantities', () => {
        for (const data of [addSubtract('addition', '12.5', '18.5'), decimalAdditionOracle]) {
            const markup = add(data, true);
            expect(markup.match(/data-role="aligned-(?:top|bottom)-units"/g)).toHaveLength(2);
            expect(markup).not.toContain('decimal-result-units');
            expect(markup).not.toContain('regrouping-units');
        }
        const positive = add(addSubtract('addition', '12.5', '18.5'), true);
        expect(text(positive)).toContain('tenths 5 + 5 = 10');
        expect(positive).not.toContain('5 + 5 + 0');
        expect(unitCaptions(add(decimalAdditionOracle, true), 'aligned-top-units')).not.toHaveProperty('1');
    });

    it('keeps Question captions and all givens independent of hidden results and regrouping traces', () => {
        const data = addSubtract('subtraction', '660.005', '0.092');
        const unrelated = addSubtract('addition', '999', '1');
        // The leaf rejects inconsistent payloads; a Question projection still must not leak their hidden work.
        expect(add({...data, result: unrelated.result, columns: []}, false)).toBe(add(data, false));
    });

    it('supports the supplied safe-integer and fifteen-place fractional boundaries', () => {
        for (const solution of [false, true]) {
            const largest = unitCaptions(add(addSubtract('addition', '9007199254740991', '0'), solution), 'aligned-top-units');
            expect(Object.keys(largest)).toHaveLength(16);
            expect(largest['15']).toBe('quadrillions');
            expect(largest).not.toHaveProperty('16');
            const smallest = unitCaptions(add(addSubtract('addition', '0.000000000000001', '0'), solution), 'aligned-top-units');
            expect(Object.keys(smallest)).toHaveLength(16);
            expect(smallest['-15']).toBe('quadrillionths');
            expect(unitCaptions(add(addSubtract('addition', '0.000000000000001', '0'), false), 'aligned-bottom-units'))
                .toEqual({0: 'ones'});
        }
    });
});

describe('decimal written-algorithm projections', () => {
    it('keeps original decimal forms and alignment while withholding all calculated work in Question', () => {
        for (const question of [add(decimalAdditionOracle, false), add(decimalAlignmentOracle, false), mul(decimalMultiplicationOracle, false), div(decimalDivisionOracle, false)]) {
            expect(question).toContain('data-role="blank-work"');
            expect(question).not.toContain('emerald');
            expect(question).not.toContain('□');
            expect(question).not.toContain('data-role="regrouping"');
            expect(question).not.toContain('data-role="multiplication-pass"');
            expect(question).not.toContain('data-role="decimal-division-step"');
            expect(question).not.toContain('placed-decimal-point');
        }
        expect(text(add(decimalAlignmentOracle, false))).toContain('5.20 − 0.004');
        expect(add(decimalAlignmentOracle, false)).not.toContain('5.196');
        expect(mul(decimalMultiplicationOracle, false)).not.toContain('62320');
        const divisionQuestion = div(decimalDivisionOracle, false);
        expect(divisionQuestion).not.toContain('123.45');
        expect(divisionQuestion).not.toContain('41.15');
        expect(divisionQuestion).not.toContain('decimal-quotient');
        expect(divisionQuestion).toContain('Equivalent division: __________ ÷ __________');
    });

    it('shows actual carry overflow and corrected top digits across a zero-borrow cascade', () => {
        const addition = add(decimalAdditionOracle, true);
        expect(text(addition)).toContain('9.995 + 0.005 = 10.000');
        expect(addition).toContain('data-role="regrouping"');
        const subtraction = add(decimalBorrowOracle, true);
        expect(subtraction.match(/line-through/g)).toHaveLength(6);
        expect(text(subtraction)).toContain('Regrouped top');
        expect(text(subtraction)).toContain('0 9 9 9 9 15');
        expect(text(subtraction)).toContain('100.005 − 0.017 = 99.988');
        expect(text(add(decimalAlignmentOracle, true))).toContain('5.20 − 0.004 = 5.196');
        expect(addition).toContain('emerald');
    });

    it('projects every unscaled multiplication pass, zero row, carries and supplied padded point', () => {
        const solution = mul(decimalMultiplicationOracle, true);
        expect(solution.match(/data-role="multiplication-pass"/g)).toHaveLength(3);
        expect(solution.match(/data-role="multiplication-carries"/g)).toHaveLength(3);
        expect(text(solution)).toContain('×0; shift 1');
        expect(text(solution)).toContain('Sum carries');
        expect(text(solution)).toContain('2 + 3 = 5 decimal places');
        expect(solution).toContain('data-role="placed-decimal-point"');
        expect(text(solution)).toContain('2.05 × 0.304 = 0.62320');
        const padded = multiply('0.004', '0.025');
        expect(text(mul(padded, true))).toContain('0.004 × 0.025 = 0.000100');
        for (const [a, b] of [['0.00', '1005.0'], ['1005.0', '0.00']]) {
            const zero = multiply(a!, b!);
            const markup = mul(zero, true);
            expect(markup.match(/data-role="multiplication-pass"/g)).toHaveLength(zero.multiplierDigits.length);
            expect(markup).toContain(`data-shift="${zero.multiplierDigits.length - 1}"`);
            expect(markup).not.toMatch(/NaN|undefined|null/);
        }
    });

    it('requires column arithmetic without exposing the decimal-subtraction solution in Question', () => {
        const data = addSubtract('subtraction', '660.005', '0.092');
        const question = add(data, false);
        expect(text(question)).toContain('recording the counts of place-value units in each column calculation and any regrouping');
        expect(question).not.toContain('659.913');
        expect(question).not.toContain('column-calculations');
        expect(question).not.toContain('emerald');
        const solution = text(add(data, true));
        expect(solution).toContain('hundredths 0 + 10 − 9 = 1');
        expect(solution).toContain('tenths 0 + 10 − 1 − 0 = 9');
        expect(solution).not.toContain('0 − 1 + 10');
        // A missing leading bottom place is not a numerical-zero operand.
        expect(solution).toContain('tens (6 − 1) = 5');
        expect(solution).not.toContain('(6 − 1) − 0 = 5');
    });

    it('shows positive working sums as quantities and handles carry-only leading addition places', () => {
        const positive = text(add(addSubtract('addition', '12.5', '18.5'), true));
        expect(positive).toContain('tenths 5 + 5 = 10');
        expect(positive).not.toContain('5 + 5 + 0');
        const overflow = text(add(decimalAdditionOracle, true));
        expect(overflow).toContain('tens 1 = 1');
        expect(overflow).not.toContain('0 + 0 + 1 = 1');
    });

    it('makes the supplied zero place shift an explicit method instruction without calculated Question answers', () => {
        const data = multiply('110', '748.2');
        const question = mul(data, false);
        expect(text(question)).toContain('Record each coefficient-column multiplication and carry');
        expect(text(question)).toContain('Begin the ones row with 0 place shifts');
        expect(question).not.toContain('82302.0');
        expect(question).not.toContain('column-calculations');
        expect(question).not.toContain('multiplication-pass');
        expect(question).not.toContain('emerald');
        const solution = text(mul(multiply('10.2', '24.15'), true));
        expect(solution).toContain('Coefficient ones row: ×5, 0 place shifts');
        expect(solution).toContain('tens 0 × 5 + 1 = 1');
        expect(solution).toContain('tens 0 × 1 = 0');
        expect(solution).toContain('tens 0 × 4 = 0');
        expect(solution).toContain('tens 0 × 2 = 0');
        expect(solution).not.toContain('2 × 5 + 0');
    });

    it('keeps a one-pass decimal multiplication concise and projects zero-product rows', () => {
        const single = mul(multiply('3764.16', '0.2'), true);
        expect(text(single)).toContain('Coefficient ones row: ×2, 0 place shifts');
        expect(single).not.toContain('Add the aligned rows by place');
        const zero = text(mul(multiply('0.00', '1005.0'), true));
        expect(zero).toContain('ones 0 × 0 = 0');
        expect(zero).toContain('ones 0 × 5 = 0');
        expect(zero).not.toContain('0 × 5 + 0');
    });

    it('shows both normalization equations and all original/extension division steps with aligned quotient point', () => {
        const solution = div(decimalDivisionOracle, true);
        expect(text(solution)).toContain('12.345 × 10 = 123.45');
        expect(text(solution)).toContain('0.3 × 10 = 3');
        expect(solution.match(/data-role="decimal-division-step"/g)).toHaveLength(4);
        expect(text(solution)).toContain('Bring down 3 (original)');
        expect(text(solution)).toContain('Bring down 4 (original)');
        expect(text(solution)).toContain('12.345 ÷ 0.3 = 41.15');
        const extension = div(decimalExtensionOracle, true);
        expect(extension).toContain('data-source="extension-zero"');
        expect(text(extension)).toContain('Append 0');
        expect(text(extension)).toContain('12.3 ÷ 0.5 = 24.6');
        expect(text(div(decimalSmallDivisionOracle, true))).toContain('0.0012 × 10 = 0.012');
        expect(text(div(decimalSmallDivisionOracle, true))).toContain('0.0012 ÷ 0.3 = 0.004');
        expect(text(div(decimalTrailingDivisionOracle, true))).toContain('1.20 ÷ 0.3 = 4.0');
    });

    it('keeps blank work independent of the stored result and does not reveal an extension count', () => {
        const other = {...decimalExtensionOracle, quotient: {coefficient: 123456, scale: 5, numeral: '1.23456'},
            steps: Array(12).fill(decimalExtensionOracle.steps[0])};
        // The validated leaf rejects this corrupt witness; the Q projection itself cannot leak its contents.
        expect(div(other, false)).toBe(div(decimalExtensionOracle, false));
        const zero = divide('0.000', '0.5');
        expect(text(div(zero, true))).toContain('0.000 ÷ 0.5 = 0.00');
        expect(div(zero, true).match(/data-role="decimal-division-step"/g)).toHaveLength(3);
        expect(div(zero, false)).not.toContain('data-source=');
    });
});

let cores: readonly ComponentType<{payload: unknown; config: object}>[];
beforeAll(async () => {
    vi.stubGlobal('window', {});
    const [addition, multiplication, division] = await Promise.all([
        import('./operations-decimal-standard-add-subtract/view.tsx'), import('./operations-decimal-standard-multiplication/view.tsx'), import('./operations-decimal-standard-division/view.tsx')]);
    cores = [addition.OperationsDecimalStandardAddSubtractCore, multiplication.OperationsDecimalStandardMultiplicationCore,
        division.OperationsDecimalStandardDivisionCore] as unknown as typeof cores;
});
afterAll(() => vi.unstubAllGlobals());
describe('decimal algorithm leaf contract boundaries', () => {
    const leaf = (index: number, data: unknown, solution: boolean) => renderToStaticMarkup(createElement(cores[index]!, {config: {}, payload: {
        problem: {type: 'arithmetic', data, labels: []}, targetLabels: [], isSolutionView: solution, seed: 17
    }}));
    it('accepts every valid exact family including zero and safe coefficient boundary members in both modes', () => {
        const cases = [[decimalAdditionOracle, decimalBorrowOracle, addSubtract('subtraction', '12.000', '12.000'), addSubtract('addition', '9007199254740991', '0')],
            [decimalMultiplicationOracle, multiply('0.00', '1005.0'), multiply('9007199254740991', '1')],
            [decimalDivisionOracle, decimalSmallDivisionOracle, divide('0.000', '0.5'), divide('9007199254740991', '1')]];
        cases.forEach((problems, index) => problems.forEach(data => {
            for (const solution of [false, true]) expect(leaf(index, data, solution)).not.toMatch(/NaN|undefined|null/);
        }));
    });
    it('rejects missing data and corrupted witnesses before any question or solution is rendered', () => {
        const bad = [{...decimalBorrowOracle, columns: []}, {...decimalMultiplicationOracle, decimalPlacement: {...decimalMultiplicationOracle.decimalPlacement, decimalIndex: 9}},
            {...decimalDivisionOracle, normalization: {...decimalDivisionOracle.normalization, powerOfTen: 100}}];
        bad.forEach((data, index) => {
            for (const solution of [false, true]) {
                expect(() => leaf(index, undefined, solution)).toThrow('Validation Error');
                expect(() => leaf(index, data, solution)).toThrow('Validation Error');
            }
        });
    });
});
