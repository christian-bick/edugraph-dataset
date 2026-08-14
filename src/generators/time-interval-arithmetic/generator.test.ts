import {Area} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../lib/random.ts';
import {TimeIntervalArithmeticGenerator} from './generator.ts';

const toMinutes = (time: string): number => {
    const [hour, minute] = time.split(':').map(Number);
    return hour * 60 + minute;
};

describe('TimeIntervalArithmeticGenerator', () => {
    const generator = new TimeIntervalArithmeticGenerator();

    it.each([
        [Area.Addition, 'addition', 'end-time'],
        [Area.Subtraction, 'subtraction', 'elapsed-minutes']
    ] as const)('generates coherent %s stories', (operationLabel, operation, unknown) => {
        for (let seed = 0; seed < 100; seed++) {
            setSeed(seed);
            const stub = generator.generate({operation: operationLabel})!;
            const data = stub.data;

            expect(data.operation).toBe(operation);
            expect(data.unknown).toBe(unknown);
            expect(data.story).toContain('minutes');
            expect(toMinutes(data.endTime) - toMinutes(data.startTime)).toBe(data.elapsedMinutes);
            expect(data.startOffsetMinutes).toBe(toMinutes(data.startTime) % 60);
            expect(data.endOffsetMinutes).toBe(60 + toMinutes(data.endTime) % 60);
            expect(data.endOffsetMinutes - data.startOffsetMinutes).toBe(data.elapsedMinutes);
            expect(stub.tags).toContain(operationLabel);
        }
    });

    it('strictly validates and rejects unsupported operations', () => {
        expect(() => generator.generate({})).toThrow();
        expect(generator.generate({operation: 'unsupported'})).toBeNull();
    });
});
