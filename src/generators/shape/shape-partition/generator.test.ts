import {Ability, Area, Scope} from 'edugraph-ts';
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
        shape: Area.Circle,
        taskAbilities: [Ability.VisualArticulation],
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

    it('strictly validates all required configuration fields', () => {
        expect(() => generator.generate({})).toThrow(GeneratorValidationError);
        expect(() => generator.generate({shape: Area.Circle})).toThrow(
            GeneratorValidationError
        );
        expect(() => generator.generate(config({fractionTypes: undefined}))).toThrow(
            GeneratorValidationError
        );
        expect(() => generator.generate(config({fractionNotation: undefined}))).toThrow(GeneratorValidationError);
        expect(() => generator.generate(config({isLessComparison: undefined}))).toThrow(
            GeneratorValidationError
        );
    });

    it.each([
        [Ability.VisualArticulation, false, false],
        [Ability.ActiveVocabulary, true, false],
        [Ability.ConceptComposition, true, false],
        [Ability.ConceptDerivation, true, true]
    ] as const)(
        'accepts only the valid unit-fraction and less combination for %s',
        (taskAbility, expectedUnitFractions, expectedLess) => {
            for (const unitFractions of [false, true]) {
                for (const isLessComparison of [false, true]) {
                    const stub = generator.generate(config({
                        taskAbilities: [taskAbility],
                        fractionTypes: unitFractions ? [Scope.UnitFractions] : [],
                        isLessComparison
                    }));
                    const invalidFractionLabels = taskAbility === Ability.VisualArticulation
                        ? false
                        : unitFractions !== expectedUnitFractions;
                    expect(stub === null).toBe(
                        invalidFractionLabels ||
                        isLessComparison !== expectedLess
                    );
                }
            }
        }
    );

    it('rejects unsupported shapes and task abilities', () => {
        expect(generator.generate(config({
            shape: 'unsupported-shape' as typeof Area.Circle
        }))).toBeNull();
        expect(generator.generate(config({
            taskAbilities: ['unsupported-ability']
        }))).toBeNull();
    });

    it('generates two- and four-share partition variations for both shapes', () => {
        for (const shape of [Area.Circle, Area.Rectangle] as const) {
            const seenParts = new Set<number>();
            for (let seed = 0; seed < 50; seed++) {
                setSeed(seed);
                const stub = generator.generate(config({shape}))!;

                expect(stub.data.task).toBe('partition');
                expect(stub.data.shape).toBe(shape === Area.Circle ? 'circle' : 'rectangle');
                if (stub.data.task === 'partition') {
                    expect([2, 4]).toContain(stub.data.parts);
                    seenParts.add(stub.data.parts);
                }
            }
            expect(seenParts).toEqual(new Set([2, 4]));
        }
    });

    it('names a selected half, fourth, or quarter consistently', () => {
        const seenNames = new Set<string>();
        const seenParts = new Set<number>();

        for (let seed = 0; seed < 200; seed++) {
            setSeed(seed);
            const stub = generator.generate(config({
                taskAbilities: [Ability.ActiveVocabulary],
                fractionTypes: [Scope.UnitFractions]
            }))!;

            expect(stub.data.task).toBe('name-share');
            if (stub.data.task !== 'name-share') continue;
            expect(stub.data.selectedShare).toBeGreaterThanOrEqual(0);
            expect(stub.data.selectedShare).toBeLessThan(stub.data.parts);
            expect(stub.data.answer).toBe(stub.data.shareName);
            if (stub.data.parts === 2) {
                expect(stub.data.shareName).toBe('half');
            } else {
                expect(['fourth', 'quarter']).toContain(stub.data.shareName);
            }
            seenNames.add(stub.data.shareName);
            seenParts.add(stub.data.parts);
        }

        expect(seenParts).toEqual(new Set([2, 4]));
        expect(seenNames).toEqual(new Set(['half', 'fourth', 'quarter']));
    });

    it('composes two halves or four fourths into one whole', () => {
        const seenParts = new Set<number>();

        for (let seed = 0; seed < 50; seed++) {
            setSeed(seed);
            const stub = generator.generate(config({
                taskAbilities: [Ability.ConceptComposition],
                fractionTypes: [Scope.UnitFractions]
            }))!;

            expect(stub.data.task).toBe('compose-whole');
            if (stub.data.task !== 'compose-whole') continue;
            expect(stub.data.shareName).toBe(stub.data.parts === 2 ? 'half' : 'fourth');
            expect(stub.data.answer).toBe('one whole');
            seenParts.add(stub.data.parts);
        }

        expect(seenParts).toEqual(new Set([2, 4]));
    });

    it('directly compares halves and fourths and identifies the smaller share', () => {
        const stub = generator.generate(config({
            taskAbilities: [Ability.ConceptDerivation],
            fractionTypes: [Scope.UnitFractions],
            isLessComparison: true
        }))!;

        expect(stub.data).toEqual({
            task: 'compare-share-size',
            shape: 'circle',
            shares: [
                {parts: 2, shareName: 'half'},
                {parts: 4, shareName: 'fourth'}
            ],
            relation: 'less',
            answer: 'fourth'
        });
    });

    it('partitions and labels every Grade 3 denominator as a unit fraction', () => {
        const seen = new Set<number>();
        for (let seed = 0; seed < 300; seed++) {
            setSeed(seed);
            const stub = generator.generate(config({
                taskAbilities: [Ability.VisualArticulation, Ability.Formalization],
                fractionTypes: [Scope.UnitFractions]
            }))!;
            expect(stub.data.task).toBe('partition-and-label-unit-fraction');
            if (stub.data.task !== 'partition-and-label-unit-fraction') continue;
            expect(stub.data.unitFraction).toBe(`1/${stub.data.parts}`);
            expect(stub.data.answer).toBe(`${stub.data.unitFraction} of the whole`);
            seen.add(stub.data.parts);
        }
        expect(seen).toEqual(new Set([2, 3, 4, 6, 8]));
    });

    it.each([
        [Scope.UnitFractions, true],
        [Scope.NonUnitFractions, false]
    ] as const)('interprets %s from highlighted equal parts', (fractionType, isUnit) => {
        for (let seed = 0; seed < 50; seed++) {
            setSeed(seed);
            const stub = generator.generate(config({
                taskAbilities: [Ability.Interpretation],
                fractionTypes: [fractionType],
                fractionNotation: true
            }))!;
            expect(stub.data.task).toBe('interpret-fraction');
            if (stub.data.task !== 'interpret-fraction') continue;
            expect(stub.data.numerator === 1).toBe(isUnit);
            expect(stub.data.highlightedShares).toHaveLength(stub.data.numerator);
            expect(stub.data.unitFraction).toBe(`1/${stub.data.parts}`);
            expect(stub.data.fraction).toBe(`${stub.data.numerator}/${stub.data.parts}`);
        }
    });
});
