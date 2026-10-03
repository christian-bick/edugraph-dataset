import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {MeasurementLinePlotProblemsGenerator} from './generator.ts';

const operations = ['addition', 'subtraction', 'multiplication', 'division'] as const;
const denominators = [2, 4, 8] as const;
const configurations = operations.flatMap(operation =>
    denominators.map(denominator => ({operation, denominator})));

describe('MeasurementLinePlotProblemsGenerator', () => {
    const generator = new MeasurementLinePlotProblemsGenerator();

    it.each(configurations)('generates exact $operation at denominator $denominator', config => {
        for (let seed = 0; seed < 80; seed++) {
            setSeed(seed);
            const data = generator.generate(config).data;
            const values = data.observationNumerators;
            const sorted = [...values].sort((a, b) => a - b);
            const counts = new Map<number, number>();
            for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
            const frequencies = [...counts.values()].sort((a, b) => b - a);
            expect(data.kind).toBe('beaker-liquid-line-plot');
            expect(data.unit).toBe('cup');
            expect(data.denominator).toBe(config.denominator);
            expect(values).toHaveLength(5);
            expect(values.every(value => Number.isSafeInteger(value)
                && value >= config.denominator && value <= 3 * config.denominator)).toBe(true);
            expect(values.some(value => value % 2 === 1)).toBe(true);
            expect(counts.size).toBeGreaterThanOrEqual(3);
            expect(frequencies[0]).toBeGreaterThanOrEqual(2);
            expect(frequencies[0]).toBeGreaterThan(frequencies[1] ?? 0);
            expect(data.relation.operation).toBe(config.operation);

            switch (data.relation.operation) {
                case 'addition':
                    expect(sorted[0]).toBeLessThan(sorted[1]!);
                    expect(data.relation.operandNumerators).toEqual([sorted[0], sorted[1]]);
                    expect(data.relation.resultNumerator).toBe(sorted[0]! + sorted[1]!);
                    expect(sorted[0]! % 2).not.toBe(sorted[1]! % 2);
                    expect(data.relation.resultNumerator % 2).toBe(1);
                    break;
                case 'subtraction':
                    expect(sorted[3]).toBeLessThan(sorted[4]!);
                    expect(data.relation.minuendNumerator).toBe(sorted[4]);
                    expect(data.relation.subtrahendNumerator).toBe(sorted[1]);
                    expect(data.relation.resultNumerator).toBe(sorted[4]! - sorted[1]!);
                    expect(data.relation.resultNumerator).toBeGreaterThan(0);
                    expect(sorted[4]! % 2).not.toBe(sorted[1]! % 2);
                    expect(data.relation.resultNumerator % 2).toBe(1);
                    break;
                case 'multiplication': {
                    const mode = [...counts].find(([, frequency]) => frequency === frequencies[0])!;
                    expect(data.relation.operandNumerator).toBe(mode[0]);
                    expect(data.relation.frequency).toBe(mode[1]);
                    expect(data.relation.frequency).toBe(3);
                    expect(data.relation.operandNumerator % 2).toBe(1);
                    expect(data.relation.resultNumerator).toBe(mode[0] * mode[1]);
                    expect(data.relation.resultNumerator % 2).toBe(1);
                    break;
                }
                case 'division': {
                    const total = values.reduce((sum, value) => sum + value, 0);
                    expect(data.relation.totalNumerator).toBe(total);
                    expect(data.relation.recipientCount).toBe(5);
                    expect(total % 5).toBe(0);
                    expect(data.relation.shareNumerator).toBe(total / 5);
                    expect(data.relation.shareNumerator % 2).toBe(1);
                    break;
                }
            }

            setSeed(seed);
            expect(generator.generate(config).data).toEqual(data);
        }
    });

    it.each([
        ['addition', 8],
        ['subtraction', 2],
        ['multiplication', 4],
        ['division', 4]
    ] as const)('varies bounded half-unit %s plots', (operation, minimumPlots) => {
        const plots = new Set<string>();
        for (let seed = 0; seed < 80; seed++) {
            setSeed(seed);
            const data = generator.generate({denominator: 2, operation}).data;
            plots.add([...data.observationNumerators].sort((a, b) => a - b).join(','));
        }
        expect(plots.size).toBeGreaterThanOrEqual(minimumPlots);
    });

    it('rejects empty, malformed, and unsupported configuration', () => {
        const valid = {denominator: 2, operation: 'addition'} as const;
        expect(() => generator.generate({})).toThrow();
        expect(() => generator.generate(null as never)).toThrow();
        for (const invalid of [
            {...valid, denominator: 0}, {...valid, denominator: 3},
            {...valid, denominator: 16}, {...valid, operation: 'averaging'},
            {...valid, operation: undefined}
        ]) expect(() => generator.generate(invalid as never)).toThrow();
    });
});
