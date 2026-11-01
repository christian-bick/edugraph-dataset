import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {generateWithLabels} from '../../lib/utils.ts';
import {TimeIntervalArithmeticGenerator} from './generator.ts';
import {spec} from './spec.ts';

describe('TimeIntervalArithmeticGenerator spec integration', () => {
    it('declares the required hour-relative endpoint ceiling invariantly', () => {
        expect(spec.generalLabels).toContain(Scope.NumbersSmaller100);
        expect(spec.generalLabels).not.toContain(Scope.NumbersLargerZero);
    });
    it.each([Area.Addition, Area.Subtraction])('resolves %s', operation => {
        const stub = generateWithLabels(new TimeIntervalArithmeticGenerator(), [
            Area.MeasuringTime,
            Scope.TimeIntervals,
            Scope.MinuteIntervals,
            Scope.IntegerNumbers,
            Scope.SingleStep,
            operation
        ]);

        expect(stub).not.toBeNull();
        expect(stub!.labels).toContain(operation);
    });
});
