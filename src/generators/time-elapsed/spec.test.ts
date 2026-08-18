import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {generateWithLabels} from '../../lib/utils.ts';
import {TimeElapsedGenerator} from './generator.ts';

describe('TimeElapsedGenerator spec integration', () => {
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
