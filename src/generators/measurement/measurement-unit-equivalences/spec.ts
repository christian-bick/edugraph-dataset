import {Area, Scope} from 'edugraph-ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';
import {measurementConversionUnitPairSchema} from '../conversion-schema.ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {generatorLabelRule} from '../../compatibility-rules.ts';
import {createUnitEquivalenceProfile} from '../unit-equivalence-profile.ts';

const ranges = [
    [[Scope.NumbersSmaller100], createCanonicalNumericRange(100)],
    [[Scope.NumbersSmaller120], createCanonicalNumericRange(120)],
    [[Scope.NumbersSmaller1000], createCanonicalNumericRange(1000)],
    [[Scope.NumbersSmaller1000, Scope.NumbersLarger5], createCanonicalNumericRange(1000, 5)],
    [[Scope.NumbersSmaller10000], createCanonicalNumericRange(10000)],
    [[Scope.NumbersSmaller10000, Scope.NumbersLarger5], createCanonicalNumericRange(10000, 5)],
    [[Scope.NumbersSmaller100000, Scope.NumbersLarger5], createCanonicalNumericRange(100000, 5)]
] as const;
const profile = createUnitEquivalenceProfile('sequence', ranges);

export const spec: GeneratorSpec = {
    generatorId: 'measurement-unit-equivalences',
    generalLabels: [
        Area.UnitScaleRelation,
        Scope.IntegerNumbers,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero
    ],
    compatibility: [generatorLabelRule('unit-sequence-range-pair', profile.contextLabels, profile.permits)]
};

export const MeasurementUnitEquivalencesGeneratorSchema = {
    unitPair: [measurementConversionUnitPairSchema[0], profile.resolvePair, measurementConversionUnitPairSchema[2]],
    range: [profile.rangeLabels, profile.resolveRange, profile.rangeChoices]
} as const;

export type MeasurementUnitEquivalencesGeneratorConfig = ConfigFromSchema<
    typeof MeasurementUnitEquivalencesGeneratorSchema
>;
