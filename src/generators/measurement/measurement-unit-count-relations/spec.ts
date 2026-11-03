import {Area, Scope} from 'edugraph-ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';
import {withLabelChoices} from '../../../types/schema.ts';

const ranges = [
    [[Scope.NumbersSmaller10], createCanonicalNumericRange(10)],
    [[Scope.NumbersSmaller20], createCanonicalNumericRange(20)],
    [[Scope.NumbersSmaller10, Scope.NumbersLarger5], createCanonicalNumericRange(10, 5)],
    [[Scope.NumbersSmaller20, Scope.NumbersLarger5], createCanonicalNumericRange(20, 5)]
] as const;
const choices = ranges.map(([labels]) => [...labels]);

export const spec: GeneratorSpec = {
    generatorId: 'measurement-unit-count-relations',
    generalLabels: [Area.UnitScaleRelation, Scope.SegmentScale, Scope.IntegerNumbers,
        Scope.NumbersWithoutNegatives, Scope.NumbersWithoutZero]
};
export const MeasurementUnitCountRelationsGeneratorSchema = {
    range: [[Scope.NumbersSmaller10, Scope.NumbersSmaller20, Scope.NumbersLarger5],
        withLabelChoices(selectExactLabelSetMap(ranges), {kind: 'alternatives', alternatives: choices, relation: 'capability'}), choices]
} as const;
export type MeasurementUnitCountRelationsGeneratorConfig = ConfigFromSchema<typeof MeasurementUnitCountRelationsGeneratorSchema>;
