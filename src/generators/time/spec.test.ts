import {beforeEach, describe, expect, it} from 'vitest';
import {TimeGenerator} from './generator.ts';
import {setSeed} from '../../lib/random.ts';
import {Area, Scope} from 'edugraph-ts';
import {generateWithLabels} from '../../lib/utils.ts';

describe('TimeGenerator Spec Integration', () => {
    let generator: TimeGenerator;

    beforeEach(() => {
        generator = new TimeGenerator();
        setSeed(42);
    });

    it('should generate hour intervals when HourIntervals is targeted', () => {
        for (let i = 0; i < 20; i++) {
            const stub = generateWithLabels(generator, [
                Area.MeasuringTime,
                Scope.HourIntervals
            ]);
            expect(stub).not.toBeNull();
            expect(stub!.data.interval).toBe(3600);
            
            const [, m, s] = stub!.data.time.split(':').map(Number);
            expect(m).toBe(0);
            expect(s).toBe(0);
        }
    });

    it('should generate minute intervals when MinuteIntervals is targeted', () => {
        for (let i = 0; i < 20; i++) {
            const stub = generateWithLabels(generator, [
                Area.MeasuringTime,
                Scope.MinuteIntervals
            ]);
            expect(stub).not.toBeNull();
            expect(stub!.data.interval).toBe(60);
            
            const [, , s] = stub!.data.time.split(':').map(Number);
            expect(s).toBe(0);
        }
    });

    it('should generate second intervals when SecondIntervals is targeted', () => {
        for (let i = 0; i < 20; i++) {
            const stub = generateWithLabels(generator, [
                Area.MeasuringTime,
                Scope.SecondIntervals
            ]);
            expect(stub).not.toBeNull();
            expect(stub!.data.interval).toBe(1);
        }
    });
});
