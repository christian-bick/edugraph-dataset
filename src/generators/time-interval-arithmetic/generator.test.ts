import {Area} from 'edugraph-ts';
import {describe, expect, it, vi} from 'vitest';
import {setSeed} from '../../lib/random.ts';
import * as rng from '../../lib/random.ts';
import {createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../lib/canonical-numeric-range.ts';
import {TimeIntervalArithmeticGenerator} from './generator.ts';

const toMinutes = (time: string): number => {
    const [hour, minute] = time.split(':').map(Number);
    return hour * 60 + minute;
};

describe('TimeIntervalArithmeticGenerator', () => {
    const generator = new TimeIntervalArithmeticGenerator();

    it.each([
        [Area.Addition, 'addition'],
        [Area.Subtraction, 'subtraction']
    ] as const)('generates coherent %s time relations', (operationLabel, operation) => {
        for (let seed = 0; seed < 100; seed++) {
            setSeed(seed);
            const stub = generator.generate({operation: operationLabel})!;
            const data = stub.data;

            expect(data.operation).toBe(operation);
            expect(toMinutes(data.endTime) - toMinutes(data.startTime)).toBe(data.elapsedMinutes);
            expect(data.startOffsetMinutes).toBe(toMinutes(data.startTime) % 60);
            expect(data.endOffsetMinutes).toBe(60 + toMinutes(data.endTime) % 60);
            expect(data.endOffsetMinutes - data.startOffsetMinutes).toBe(data.elapsedMinutes);
        }
    });

    it('strictly validates and rejects unsupported operations', () => {
        expect(() => generator.generate({})).toThrow();
        expect(generator.generate({operation: 'unsupported'})).toBeNull();
    });

    it('proves invariant upper100 across the complete clock-component support', () => {
        const draw = vi.spyOn(rng, 'random');
        const range = createCanonicalNumericRange(100);
        let count = 0;
        try {
            for (const operation of [Area.Addition, Area.Subtraction] as const) {
                for (let hour = 1; hour <= 9; hour++) for (let start = 35; start <= 54; start++) {
                    for (let end = 5; end <= 30; end++) {
                        draw.mockClear().mockReturnValueOnce((hour - 0.5) / 9)
                            .mockReturnValueOnce((start - 35 + 0.5) / 20)
                            .mockReturnValueOnce((end - 5 + 0.5) / 26);
                        const {data} = generator.generate({operation})!;
                        expect(data.referenceHour).toBe(hour);
                        expect(data.startOffsetMinutes).toBe(start);
                        expect(data.endOffsetMinutes).toBe(60 + end);
                        expect(hasCanonicalRangeWitness([0, hour, hour + 1, start, end,
                            data.endOffsetMinutes, data.elapsedMinutes], range)).toBe(true);
                        expect(draw).toHaveBeenCalledTimes(3);
                        count++;
                    }
                }
            }
            expect(count).toBe(9360);
        } finally {
            draw.mockRestore();
        }
    });
});
