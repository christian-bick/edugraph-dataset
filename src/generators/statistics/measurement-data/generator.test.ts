import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {MeasurementDataGenerator} from './generator.ts';

describe('MeasurementDataGenerator', () => {
    it('generates six whole-centimeter observations in a compact range', () => {
        setSeed(42);
        const problem = new MeasurementDataGenerator().generate({numberKind: Scope.IntegerNumbers});

        expect(problem.data).toEqual(expect.objectContaining({unit: 'cm', subdivisions: 1}));
        expect(problem.data.observations).toHaveLength(6);
        expect(new Set(problem.data.observations.map(({object}) => object)).size).toBe(6);
        expect(problem.data.observations.every(({value}) => Number.isInteger(value) && value >= 2 && value <= 10)).toBe(true);
        expect(problem.data.extremaRelation).toBeUndefined();
    });

    it('generates quarter-inch observations including halves and fourths', () => {
        setSeed(42);
        const data = new MeasurementDataGenerator().generate({numberKind: Scope.FractionNumbers}).data;
        const quarterUnits = data.observations.map(({value}) => value * 4);

        expect(data.unit).toBe('in');
        expect(data.subdivisions).toBe(4);
        expect(quarterUnits.every(Number.isInteger)).toBe(true);
        expect(quarterUnits.every(value => value >= 8 && value <= 32)).toBe(true);
        expect(quarterUnits.some(value => value % 4 === 2)).toBe(true);
        expect(quarterUnits.some(value => value % 2 === 1)).toBe(true);
    });

    it('generates neutral eighth-inch observations for one measurement frame', () => {
        for (let seed = 0; seed < 40; seed++) {
            setSeed(`eighth-inch-data-${seed}`);
            const data = new MeasurementDataGenerator().generate({
                numberKind: Scope.FractionNumbers,
                useSingleFrame: true
            }).data;
            const eighths = data.observations.map(({value}) => value * 8);

            expect(data.unit).toBe('in');
            expect(data.subdivisions).toBe(8);
            expect(eighths.every(Number.isInteger)).toBe(true);
            expect(new Set(eighths).size).toBeLessThan(6);
            expect(data.extremaRelation).toBeUndefined();
            expect(Object.keys(data).sort()).toEqual(['observations', 'subdivisions', 'unit']);
        }
    });

    it.each([
        [Area.Addition, 'addition'],
        [Area.Subtraction, 'subtraction']
    ] as const)('derives a canonical extrema %s relation without presentation prose', (operation, expectedOperation) => {
        setSeed(expectedOperation);
        const data = new MeasurementDataGenerator().generate({
            numberKind: Scope.FractionNumbers,
            useSingleFrame: true,
            includeFractionArithmetic: true,
            operation
        }).data;
        const relation = data.extremaRelation!;
        const lengths = data.observations.map(({value}) => value);

        expect(relation.operation).toBe(expectedOperation);
        expect(relation.shortest).toBe(Math.min(...lengths));
        expect(relation.longest).toBe(Math.max(...lengths));
        expect(relation.leftOperand).toBe(operation === Area.Addition ? relation.shortest : relation.longest);
        expect(relation.rightOperand).toBe(operation === Area.Addition ? relation.longest : relation.shortest);
        expect(relation.answer).toBe(operation === Area.Addition
            ? relation.leftOperand + relation.rightOperand
            : relation.leftOperand - relation.rightOperand);
        expect(Object.keys(relation).sort()).toEqual([
            'answer', 'leftOperand', 'longest', 'operation', 'rightOperand', 'shortest'
        ]);
    });

    it('is deterministic for the same seed', () => {
        const generator = new MeasurementDataGenerator();
        setSeed(7);
        const first = generator.generate({numberKind: Scope.IntegerNumbers});
        setSeed(7);
        expect(generator.generate({numberKind: Scope.IntegerNumbers})).toEqual(first);
    });

    it('strictly rejects incomplete arithmetic configurations', () => {
        const generator = new MeasurementDataGenerator();
        expect(() => generator.generate({
            numberKind: Scope.IntegerNumbers,
            useSingleFrame: true
        })).toThrow('requires fractional measurements');
        expect(() => generator.generate({
            numberKind: Scope.FractionNumbers,
            includeFractionArithmetic: true,
            operation: Area.Addition
        })).toThrow('requires a single measurement frame');
        expect(() => generator.generate({
            numberKind: Scope.FractionNumbers,
            useSingleFrame: true,
            includeFractionArithmetic: true
        })).toThrow('requires addition or subtraction');
        expect(() => generator.generate({
            numberKind: Scope.FractionNumbers,
            useSingleFrame: true,
            operation: Area.Addition
        })).toThrow('requires FractionArithmetic');
    });

    it('rejects a missing configuration object', () => {
        expect(() => new MeasurementDataGenerator().generate(null as never)).toThrow();
    });
});
