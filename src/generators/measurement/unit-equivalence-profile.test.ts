import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {createCanonicalNumericRange} from '../../lib/canonical-numeric-range.ts';
import {getRandomState, setSeed} from '../../lib/random.ts';
import {resolveSchemaChoices} from '../../lib/schema-choices.ts';
import {extractConfig, findSchemaFallbackContractIssues} from '../../lib/utils.ts';
import {measurementConversionUnitPairSchema} from './conversion-schema.ts';
import {measurementConversionPairSeeds} from './helpers.ts';
import {MeasurementUnitEquivalenceGeneratorSchema as single} from './measurement-unit-equivalence/spec.ts';
import {MeasurementUnitEquivalencesGeneratorSchema as sequence} from './measurement-unit-equivalences/spec.ts';
import {unitEquivalenceRanges} from './unit-equivalence-domain.ts';
import {createUnitEquivalenceProfile} from './unit-equivalence-profile.ts';

const pairs = Object.values(measurementConversionPairSeeds);
const pairLabels = (id: string): string[] => [...measurementConversionUnitPairSchema[2][pairs.findIndex(pair => pair.id === id)]!];
const rangeLabels = (upper: number, lower: number): string[] => [Scope[`NumbersSmaller${upper}` as keyof typeof Scope],
    ...(lower ? [Scope[`NumbersLarger${lower}` as keyof typeof Scope]] : [])];

describe.each([['single', single], ['sequence', sequence]] as const)('%s unit/range correlation', (contract, schema) => {
    it('resolves every standalone profile fallback', () => {
        expect(findSchemaFallbackContractIssues(schema)).toEqual([]);
    });

    it.each(pairs)('retains all complete direct/planned bindings for $id', pair => {
        for (const range of unitEquivalenceRanges(contract, pair.id)) {
            const unitLabels = pairLabels(pair.id), bounds = rangeLabels(range.max, range.min), labels = [...unitLabels, ...bounds];
            setSeed(19); const direct = extractConfig(schema, labels), state = getRandomState();
            expect(direct.config).toEqual({unitPair: pair.id, range});
            expect(new Set(direct.resolvedLabels)).toEqual(new Set(labels));
            setSeed(19); const planned = resolveSchemaChoices(schema, labels, {unitPair: unitLabels, range: bounds});
            expect(planned.config).toEqual(direct.config);
            expect(new Set(planned.resolvedLabels)).toEqual(new Set(direct.resolvedLabels));
            expect(getRandomState()).toBe(state);
        }
    });

    it.each([...new Set(schema.range[2].map(labels => labels[0]!))])('completes partial range %s with a feasible pair', upper => {
        for (let seed = 0; seed < 16; seed++) {
            setSeed(seed); const {config, resolvedLabels} = extractConfig(schema, [upper]);
            expect(resolvedLabels).toContain(upper);
            expect(unitEquivalenceRanges(contract, config.unitPair!)).toContainEqual(config.range);
        }
    });

    it('rejects explicit incompatible unit/range combinations before generation', () => {
        expect(() => extractConfig(schema, [...pairLabels('kilometer-meter'), Scope.NumbersSmaller100])).toThrow();
        expect(() => extractConfig(schema, [Area.UnitMagnitudeScaling, Scope.KilometerScale, Scope.CentimeterScale])).toThrow();
    });
});

describe('reusable unit equality profile resolvers', () => {
    const mappings = [[[Scope.NumbersSmaller1000], createCanonicalNumericRange(1000)],
        [[Scope.NumbersSmaller1000, Scope.NumbersLarger5], createCanonicalNumericRange(1000, 5)],
        [[Scope.NumbersSmaller100000, Scope.NumbersLarger5], createCanonicalNumericRange(100000, 5)]] as const;
    const profile = createUnitEquivalenceProfile('sequence', mappings);

    it('preserves a standalone range while refusing an incompatible pair completion', () => {
        expect(profile.resolveRange([Scope.NumbersSmaller1000])).toEqual(createCanonicalNumericRange(1000));
        expect(profile.resolvePair([Scope.NumbersSmaller1000])).toBeUndefined();
        expect(profile.resolvePair([...pairLabels('hour-minute'), Scope.NumbersSmaller100000])).toBeUndefined();
        expect(profile.resolvePair([...pairLabels('kilometer-meter'), Scope.NumbersSmaller100000])).toBe('kilometer-meter');
        expect(profile.resolveRange([...pairLabels('hour-minute'), Scope.NumbersSmaller100000, Scope.NumbersLarger5])).toBeUndefined();
    });

    it('admits only complete compatible label bundles, including the strongest lower', () => {
        const valid = [...pairLabels('hour-minute'), Scope.NumbersSmaller1000, Scope.NumbersLarger5];
        expect(profile.permits(label => valid.includes(label))).toBe(true);
        expect(profile.permits(() => false)).toBe(false);
        const invalid = [...pairLabels('hour-minute'), Scope.NumbersSmaller100000, Scope.NumbersLarger5];
        expect(profile.permits(label => invalid.includes(label))).toBe(false);
        expect(profile.rangeChoices).toEqual(mappings.map(([labels]) => [...labels]));
        expect(profile.contextLabels).toEqual(expect.arrayContaining([...measurementConversionUnitPairSchema[0], ...profile.rangeLabels]));
    });
});
