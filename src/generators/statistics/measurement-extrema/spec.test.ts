import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {MeasurementExtremaGenerator} from './generator.ts';

describe('measurement-extrema schema integration', () => {
    const generator = new MeasurementExtremaGenerator();

    it.each([
        [Area.Addition, 'addition'], [Area.Subtraction, 'subtraction']
    ] as const)('resolves %s without a grouping label', (area, operation) => {
        for (const [unitLabel, unit] of [[Scope.InchScale, 'in'], [Scope.CentimeterScale, 'cm']] as const) {
            const result = generateWithLabels(generator, [area, unitLabel, Ability.ProcedureExecution])!;
            expect(result.data.extremaRelation.operation).toBe(operation);
            expect(result.data.unit).toBe(unit);
            expect(new Set(result.labels)).toEqual(new Set([area, unitLabel]));
        }
    });

    it('publishes the concrete operation and unit selected for a broad request', () => {
        const operations = new Set<string>();
        const units = new Set<string>();
        for (let seed = 0; seed < 40; seed++) {
            setSeed(seed);
            const result = generateWithLabels(generator, [Area.Statistics, Ability.ProcedureExecution])!;
            const {operation} = result.data.extremaRelation;
            expect(result.labels).toContain(operation === 'addition' ? Area.Addition : Area.Subtraction);
            expect(result.labels).toContain(result.data.unit === 'in' ? Scope.InchScale : Scope.CentimeterScale);
            operations.add(operation);
            units.add(result.data.unit);
        }
        expect(operations.size).toBe(2);
        expect(units.size).toBe(2);
    });

    it('rejects competing operations instead of choosing a task', () => {
        expect(() => generateWithLabels(generator, [Area.Addition, Area.Subtraction])).toThrow();
    });
});
