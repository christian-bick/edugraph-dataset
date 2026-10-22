import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {MeasurementRatioRelationsGenerator} from './generator.ts';
import {spec} from './spec.ts';

const mathematicalLabels = [Area.UnitConversion, Area.RatioEquivalence, Scope.RationalNumbers];

describe('measurement-ratio-relations capabilities', () => {
    it('owns the reviewed conversion, ratio and rational mathematics', () => {
        expect(spec.generalLabels).toEqual(mathematicalLabels);
    });

    it('generates the real Grade6 target without an explicit magnitude label', () => {
        const problem = generateWithLabels(new MeasurementRatioRelationsGenerator(), [
            ...mathematicalLabels, Ability.ProcedureExecution, Ability.ProcedureUnderstanding
        ])!;
        expect(problem.data.kind).toBe('measurement-ratio-relation');
        expect(problem.data.quantityEquality.first.numerator).toBeLessThan(10000);
        expect(problem.data.quantityEquality.second.numerator).toBeLessThan(10000);
        expect(problem.labels).toEqual([]);
    });

    it.each([[Scope.NumbersSmaller10000, 10000], [Scope.NumbersSmaller100000, 100000]] as const)(
        'resolves the true mathematical magnitude capability %s', (label, bound) => {
            const problem = generateWithLabels(new MeasurementRatioRelationsGenerator(), [...mathematicalLabels, label])!;
            expect(problem.labels).toEqual([label]);
            expect(problem.data.quantityEquality.first.numerator).toBeLessThan(bound);
            expect(problem.data.quantityEquality.second.numerator).toBeLessThan(bound);
        }
    );

    it('keeps the symmetric relation independent of requested learner action', () => {
        setSeed(71);
        const execution = generateWithLabels(new MeasurementRatioRelationsGenerator(), [
            ...mathematicalLabels, Ability.ProcedureExecution
        ]);
        setSeed(71);
        expect(generateWithLabels(new MeasurementRatioRelationsGenerator(), [
            ...mathematicalLabels, Ability.ProcedureUnderstanding
        ])).toEqual(execution);
    });
});
