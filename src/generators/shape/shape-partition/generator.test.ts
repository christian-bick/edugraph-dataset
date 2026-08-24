import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import {setSeed} from '../../../lib/random.ts';
import {ShapePartitionGeneratorConfig} from './spec.ts';
import {ShapePartitionGenerator} from './generator.ts';

const generator = new ShapePartitionGenerator();

function config(
    overrides: Partial<ShapePartitionGeneratorConfig> = {}
): ShapePartitionGeneratorConfig {
    return {
        taskAreas: [Area.ShapeDecomposition],
        shape: Area.Circle,
        fractionTypes: [],
        fractionNotation: false,
        isLessComparison: false,
        ...overrides
    };
}

describe('ShapePartitionGenerator', () => {
    it('has the shape problem type', () => {
        expect(generator.type).toBe('shape');
    });

    it('strictly validates every mathematical configuration field', () => {
        expect(() => generator.generate({})).toThrow(GeneratorValidationError);
        expect(() => generator.generate(config({taskAreas: undefined}))).toThrow(
            GeneratorValidationError
        );
        expect(() => generator.generate(config({shape: undefined}))).toThrow(
            GeneratorValidationError
        );
        expect(() => generator.generate(config({fractionTypes: undefined}))).toThrow(
            GeneratorValidationError
        );
        expect(() => generator.generate(config({fractionNotation: undefined}))).toThrow(
            GeneratorValidationError
        );
        expect(() => generator.generate(config({isLessComparison: undefined}))).toThrow(
            GeneratorValidationError
        );
    });

    it('rejects unsupported shapes and mathematical task areas', () => {
        expect(generator.generate(config({
            shape: 'unsupported-shape' as typeof Area.Circle
        }))).toBeNull();
        expect(generator.generate(config({
            taskAreas: ['unsupported-area']
        }))).toBeNull();
    });

    it('generates canonical two- and four-share partitions for both shapes', () => {
        for (const shape of [Area.Circle, Area.Rectangle] as const) {
            const seenParts = new Set<number>();
            for (let seed = 0; seed < 50; seed++) {
                setSeed(seed);
                const data = generator.generate(config({shape}))!.data;

                expect(data.kind).toBe('partition');
                if (data.kind !== 'partition') continue;
                expect(data.shape).toBe(shape === Area.Circle ? 'circle' : 'rectangle');
                expect([2, 4]).toContain(data.parts);
                expect(Object.keys(data).sort()).toEqual(['kind', 'parts', 'shape']);
                seenParts.add(data.parts);
            }
            expect(seenParts).toEqual(new Set([2, 4]));
        }
    });

    it('does not duplicate a partition as a unit-fraction display model', () => {
        for (let seed = 0; seed < 50; seed++) {
            setSeed(seed);
            const withoutFractionType = generator.generate(config())!.data;
            setSeed(seed);
            const withUnitFraction = generator.generate(config({
                fractionTypes: [Scope.UnitFractions]
            }))!.data;

            expect(withUnitFraction).toEqual(withoutFractionType);
            expect(withUnitFraction.kind).toBe('partition');
        }
    });

    it('supports the full Grade 3 equal-share denominator set through proportion sense', () => {
        const seen = new Set<number>();
        for (let seed = 0; seed < 300; seed++) {
            setSeed(seed);
            const data = generator.generate(config({
                taskAreas: [Area.ProportionSense],
                fractionTypes: [Scope.UnitFractions]
            }))!.data;

            expect(data.kind).toBe('partition');
            if (data.kind !== 'partition') continue;
            seen.add(data.parts);
        }
        expect(seen).toEqual(new Set([2, 3, 4, 6, 8]));
    });

    it('creates a complete mathematical comparison without choosing a task', () => {
        expect(generator.generate(config({
            taskAreas: [Area.FractionCommonNumeratorComparison],
            fractionTypes: [Scope.UnitFractions],
            isLessComparison: true
        }))!.data).toEqual({
            kind: 'share-comparison',
            shape: 'circle',
            leftParts: 4,
            relation: 'less',
            rightParts: 2
        });
    });

    it.each([
        [Scope.UnitFractions, true],
        [Scope.NonUnitFractions, false]
    ] as const)('generates a consistent %s selected region', (fractionType, isUnit) => {
        for (let seed = 0; seed < 50; seed++) {
            setSeed(seed);
            const data = generator.generate(config({
                taskAreas: [Area.ProportionSense],
                fractionTypes: [fractionType],
                fractionNotation: true
            }))!.data;

            expect(data.kind).toBe('selected-region');
            if (data.kind !== 'selected-region') continue;
            expect(data.numerator === 1).toBe(isUnit);
            expect(Object.keys(data).sort()).toEqual([
                'kind',
                'numerator',
                'parts',
                'shape'
            ]);
        }
    });

    it('rejects incoherent mathematical combinations', () => {
        expect(generator.generate(config({
            isLessComparison: true
        }))).toBeNull();
        expect(generator.generate(config({
            fractionNotation: true
        }))).toBeNull();
        expect(generator.generate(config({
            fractionTypes: [Scope.NonUnitFractions]
        }))).toBeNull();
        expect(generator.generate(config({
            fractionTypes: [Scope.UnitFractions, Scope.NonUnitFractions]
        }))).toBeNull();
        expect(generator.generate(config({
            taskAreas: [Area.ShapeDecomposition],
            fractionTypes: [Scope.UnitFractions],
            isLessComparison: true
        }))).toBeNull();
        expect(generator.generate(config({
            taskAreas: [Area.ShapeDecomposition],
            fractionTypes: [Scope.UnitFractions],
            fractionNotation: true
        }))).toBeNull();
    });

    it('is deterministic for a fixed seed', () => {
        const mathematicalConfig = config({
            taskAreas: [Area.ProportionSense],
            fractionTypes: [Scope.NonUnitFractions],
            fractionNotation: true
        });
        setSeed(18);
        const first = generator.generate(mathematicalConfig);
        setSeed(18);
        const second = generator.generate(mathematicalConfig);

        expect(second).toEqual(first);
    });
});
