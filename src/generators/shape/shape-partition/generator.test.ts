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

    it('generates two- and four-share decomposition models for both shapes', () => {
        for (const shape of [Area.Circle, Area.Rectangle] as const) {
            const seenParts = new Set<number>();
            for (let seed = 0; seed < 50; seed++) {
                setSeed(seed);
                const data = generator.generate(config({shape}))!.data;

                expect(data.model).toBe('equal-share-partition');
                if (data.model !== 'equal-share-partition') continue;
                expect(data.shape).toBe(shape === Area.Circle ? 'circle' : 'rectangle');
                expect([2, 4]).toContain(data.parts);
                expect(data.wholeCount).toBe(1);
                expect(data.unitFraction).toBeNull();
                seenParts.add(data.parts);
            }
            expect(seenParts).toEqual(new Set([2, 4]));
        }
    });

    it('carries a requested unit fraction into the equal-share model', () => {
        for (let seed = 0; seed < 50; seed++) {
            setSeed(seed);
            const data = generator.generate(config({
                fractionTypes: [Scope.UnitFractions]
            }))!.data;

            expect(data.model).toBe('equal-share-partition');
            if (data.model !== 'equal-share-partition') continue;
            expect(data.unitFraction).toBe(`1/${data.parts}`);
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

            expect(data.model).toBe('equal-share-partition');
            if (data.model !== 'equal-share-partition') continue;
            expect(data.unitFraction).toBe(`1/${data.parts}`);
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
            model: 'unit-share-comparison',
            shape: 'circle',
            unitFractions: [
                {numerator: 1, denominator: 2, display: '1/2'},
                {numerator: 1, denominator: 4, display: '1/4'}
            ],
            relation: 'less',
            lesserFraction: '1/4'
        });
    });

    it.each([
        [Scope.UnitFractions, true],
        [Scope.NonUnitFractions, false]
    ] as const)('generates a consistent %s fraction-region model', (fractionType, isUnit) => {
        for (let seed = 0; seed < 50; seed++) {
            setSeed(seed);
            const data = generator.generate(config({
                taskAreas: [Area.ProportionSense],
                fractionTypes: [fractionType],
                fractionNotation: true
            }))!.data;

            expect(data.model).toBe('fraction-region');
            if (data.model !== 'fraction-region') continue;
            expect(data.numerator === 1).toBe(isUnit);
            expect(data.unitFraction).toBe(`1/${data.parts}`);
            expect(data.fraction).toBe(`${data.numerator}/${data.parts}`);
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
