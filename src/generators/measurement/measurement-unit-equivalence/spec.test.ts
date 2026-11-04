import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {measurementConversionUnitPairSchema} from '../conversion-schema.ts';
import {measurementConversionPairSeeds} from '../helpers.ts';
import {MeasurementUnitEquivalenceGenerator} from './generator.ts';
import {MeasurementUnitEquivalenceGeneratorSchema as schema, spec} from './spec.ts';

describe('single named-unit capabilities', () => {
    it('retains positive integer unit relations while consumers own learner actions', () => {
        expect(spec.generalLabels).toEqual([Area.UnitScaleRelation, Scope.IntegerNumbers,
            Scope.NumbersWithoutNegatives, Scope.NumbersWithoutZero]);
        expect(Object.keys(schema)).toEqual(['unitPair', 'range']);
        for (const ability of Object.values(Ability)) expect(spec.generalLabels).not.toContain(ability);
    });

    it.each(Object.values(measurementConversionPairSeeds))('preserves $id mathematics independently of the consumer Ability', pair => {
        const index = Object.keys(measurementConversionPairSeeds).indexOf(pair.id);
        const labels = [...measurementConversionUnitPairSchema[2][index]!];
        const generator = new MeasurementUnitEquivalenceGenerator();
        setSeed(pair.id); const reference = generateWithLabels(generator, labels)!;
        for (const ability of [Ability.ConceptDerivation, Ability.ProcedureExecution]) {
            setSeed(pair.id); const result = generateWithLabels(generator, [...labels, ability])!;
            expect(result.data).toEqual(reference.data);
            expect(new Set(result.labels)).toEqual(new Set(reference.labels));
            expect(result.data.kind).toBe('unit-equivalence');
            expect(result.data.pair.id).toBe(pair.id);
            expect(result.data).not.toHaveProperty('equivalents');
            expect(result.labels).toEqual(expect.arrayContaining(labels));
            expect(result.labels).not.toContain(Scope.NumbersLarger5);
        }
    });

    it('completes broad requests to a concrete labeled pair and preselected upper band', () => {
        for (let seed = 0; seed < 24; seed++) {
            setSeed(seed); const result = generateWithLabels(new MeasurementUnitEquivalenceGenerator(), [Ability.ProcedureExecution])!;
            const maximum = result.data.equivalent.smallerValue;
            const upper = [5, 10, 20, 100, 120, 1000, 10000].find(bound => maximum <= bound)!;
            expect(result.labels).toContain(Scope[`NumbersSmaller${upper}` as keyof typeof Scope]);
            expect(result.labels).not.toContain(Scope.NumbersLarger5);
        }
    });
});
