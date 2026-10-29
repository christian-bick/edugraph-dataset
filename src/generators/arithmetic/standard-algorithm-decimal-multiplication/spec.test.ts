import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {getRandomState, setSeed} from '../../../lib/random.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {StandardAlgorithmDecimalMultiplicationGenerator} from './generator.ts';
import {spec} from './spec.ts';
import {DecimalStandardMultiplicationBody} from '../../../visuals/views/operations/decimal-standard-view.tsx';

const mathematics = [Area.MultiplicationStandardAlgorithm, Scope.DecimalNumbers, Scope.Base10,
    Scope.NumbersWithoutNegatives, Scope.MultipleDigitLargestOperand];

describe('standard decimal multiplication schema', () => {
    it('owns the reviewed mathematical labels', () => expect(spec.generalLabels).toEqual([...mathematics, Scope.TwoOperands, Scope.NumbersWithZero]));
    it('has an explicit zero place-shift in every prescribed first coefficient pass', () => {
        for (const max of [100000, 1000000, Number.MAX_SAFE_INTEGER]) for (let seed = 0; seed < 30; seed++) {
            const generator = new StandardAlgorithmDecimalMultiplicationGenerator();
            setSeed(seed);
            const result = generator.generate({range: {min: 0, max}});
            const state = getRandomState();
            expect(result.data.partialRows.length).toBeGreaterThan(0);
            expect(result.data.partialRows[0]!.shiftPlaces).toBe(0);
            expect(renderToStaticMarkup(createElement(DecimalStandardMultiplicationBody,
                {data: result.data, isSolutionView: true}))).toContain('shift 0');
            setSeed(seed);
            expect(generator.generate({range: {min: 0, max}})).toEqual(result);
            expect(getRandomState()).toBe(state);
        }
    });
    it('resolves the real broad Grade 6 target without a magnitude label', () => {
        const problem = generateWithLabels(new StandardAlgorithmDecimalMultiplicationGenerator(), [
            ...mathematics, Scope.ArabicNumerals, Ability.ProcedureExecution
        ])!;
        expect(problem.data.kind).toBe('decimal-standard-multiplication');
        expect(problem.data.product.coefficient).toBeLessThanOrEqual(999999);
        expect(problem.labels).toEqual([]);
    });
    it.each([[Scope.NumbersSmaller100000, 100000], [Scope.NumbersSmaller1000000, 1000000]] as const)(
        'resolves real range capability %s', (label, bound) => {
            const problem = generateWithLabels(new StandardAlgorithmDecimalMultiplicationGenerator(), [...mathematics, label])!;
            expect(problem.labels).toEqual([label]);
            expect(problem.data.product.coefficient).toBeLessThanOrEqual(bound);
        }
    );
    it('does not select mathematics from the learner action', () => {
        setSeed(621);
        const first = generateWithLabels(new StandardAlgorithmDecimalMultiplicationGenerator(), [...mathematics, Ability.ProcedureExecution]);
        setSeed(621);
        expect(generateWithLabels(new StandardAlgorithmDecimalMultiplicationGenerator(), [...mathematics, Ability.ProcedureUnderstanding])).toEqual(first);
    });
});
