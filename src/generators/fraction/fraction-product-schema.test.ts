import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {createCanonicalNumericRange} from '../../lib/canonical-numeric-range.ts';
import {getRandomState, setSeed} from '../../lib/random.ts';
import {resolveSchemaChoices} from '../../lib/schema-choices.ts';
import {extractConfig, findSchemaFallbackContractIssues, generateWithLabels} from '../../lib/utils.ts';
import {FractionProductsGenerator} from './fraction-products/generator.ts';
import {FractionProductsGeneratorSchema} from './fraction-products/spec.ts';
import {FractionProductRelationsGenerator} from './fraction-product-relations/generator.ts';
import {FractionProductRelationsGeneratorSchema} from './fraction-product-relations/spec.ts';

const profiles = [
    ['fraction-partition-proper', [Area.Division, Area.FractionNumeratorInterpretation, Area.FractionDenominatorInterpretation,
        Scope.FractionNumbers, Scope.EqualShares, Scope.ProperFractions], [5,10,20,100], [5,10]],
    ['fraction-partition-improper', [Area.Division, Area.FractionNumeratorInterpretation, Area.FractionDenominatorInterpretation,
        Scope.FractionNumbers, Scope.EqualShares, Scope.ImproperFractions], [5,10,20,100,120], [5,10,20]],
    ['fraction-equation-proper', [Area.Equation, Scope.FractionNumbers, Scope.SingleFrameOfReference, Scope.ProperFractions], [5,10,20], [5,10]],
    ['fraction-equation-improper', [Area.Equation, Scope.FractionNumbers, Scope.SingleFrameOfReference, Scope.ImproperFractions], [5,10,20,100], [5,10,20]],
    ['mixed-equation', [Area.Equation, Scope.MixedNumbers, Scope.ImproperFractions, Scope.SingleFrameOfReference], [5,10,20,100], [5,10,20]]
] as const;
const rangeLabel = (upper: number) => Scope[`NumbersSmaller${upper}` as keyof typeof Scope];

for (const [family, schema, generator, column, rangeBounds] of [
    ['derivation', FractionProductsGeneratorSchema, new FractionProductsGenerator(), 2, [5,10,20,100,120]],
    ['relation', FractionProductRelationsGeneratorSchema, new FractionProductRelationsGenerator(), 3, [5,10,20]]
] as const) {
    describe(`${family} direct and planned product configuration`, () => {
        it.each(profiles)('%s resolves every complete cell without consuming entropy', (productProfile, labels, fineBounds, relationBounds) => {
            for (const upper of family === 'derivation' ? fineBounds : relationBounds) {
                const requested = [...labels, rangeLabel(upper)];
                setSeed(13); const direct = extractConfig(schema, requested), state = getRandomState();
                expect(direct.config).toEqual({productProfile, range: createCanonicalNumericRange(upper)});
                setSeed(13);
                const planned = resolveSchemaChoices(schema, requested, {productProfile: labels, range: [rangeLabel(upper)]});
                expect(planned.config).toEqual(direct.config);
                expect(new Set(planned.resolvedLabels)).toEqual(new Set(direct.resolvedLabels));
                expect(getRandomState()).toBe(state);
            }
        });

        it('conditions direct fallbacks using original upper requests and the earlier selected profile', () => {
            expect(findSchemaFallbackContractIssues(schema)).toEqual([]);
            const requests: readonly (readonly string[])[] = [[], ...rangeBounds.map(upper => [rangeLabel(upper)]),
                ...profiles.map(([, labels]) => labels), [Scope.FractionNumbers], [Area.Equation, Scope.FractionNumbers],
                [Scope.MixedNumbers, Area.Equation], [Scope.EqualShares, Area.Division]];
            for (const requested of requests) for (let seed = 0; seed < 24; seed++) {
                setSeed(seed);
                const config = extractConfig(schema, [...requested]).config;
                const profile = profiles.find(([name]) => name === config.productProfile)!;
                expect((profile[column] as readonly number[]).includes(config.range!.max)).toBe(true);
                const explicit = rangeBounds.find(upper => requested.includes(rangeLabel(upper)));
                if (explicit !== undefined) expect(config.range!.max).toBe(explicit);
                expect(() => generator.generate(config)).not.toThrow();
                setSeed(seed);
                const generated = family === 'derivation'
                    ? generateWithLabels(new FractionProductsGenerator(), [...requested])
                    : generateWithLabels(new FractionProductRelationsGenerator(), [...requested]);
                expect(generated!.data).toBeDefined();
            }
            for (const [, labels, fineBounds, relationBounds] of profiles) {
                for (const upper of rangeBounds) {
                    if (((family === 'derivation' ? fineBounds : relationBounds) as readonly number[]).includes(upper)) continue;
                    expect(() => extractConfig(schema, [...labels, rangeLabel(upper)])).toThrow();
                }
            }
        });
    });
}
