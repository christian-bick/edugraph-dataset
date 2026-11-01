import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {generateWithLabels} from '../../lib/utils.ts';
import {TimeElapsedGenerator} from './generator.ts';
import {spec} from './spec.ts';
import {spec as viewSpec} from '../../visuals/views/time/time-elapsed/spec.ts';
import {createLabelDependencyEvaluator} from '../../lib/label-dependencies.ts';

describe('TimeElapsedGenerator spec integration', () => {
    it('declares its invariant tightest upper without a universal floor or additional missing dependencies', () => {
        expect(spec.generalLabels).toContain(Scope.NumbersSmaller100);
        expect(spec.generalLabels).not.toContain(Scope.NumbersLargerZero);
        for (const clock of [Scope.AnalogClock, Scope.DigitalClock]) {
            const result = createLabelDependencyEvaluator().evaluate([
                ...spec.generalLabels!, ...viewSpec.generalLabels!, Scope.IntegerNumbers, clock
            ]);
            expect(result.errors).toEqual([]);
            expect(result.conflicts).toEqual([]);
            expect(result.assessments.filter(item => item.status === 'missing')).toEqual([]);
        }
    });
    it('supports the elapsed-minute target labels', () => {
        const labels = [
            Area.MeasuringTime,
            Area.Difference,
            Scope.MinuteIntervals,
            Scope.IntegerNumbers,
            Scope.AnalogClock,
            Ability.ProcedureExecution
        ];
        const stub = generateWithLabels(new TimeElapsedGenerator(), labels);

        expect(stub).not.toBeNull();
        expect(stub!.data.crossesHour).toBe(true);
        expect(stub!.data.elapsedMinutes).toBeGreaterThan(0);
    });
});
