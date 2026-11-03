import {Area, Scope} from 'edugraph-ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {selectExactLabelMap} from '../../../lib/resolvers.ts';

export const spec: GeneratorSpec = {
    generatorId: 'measurement-unit-scale',
    generalLabels: [Area.UnitScaleRelation, Scope.SegmentScale, Scope.IntegerNumbers,
        Scope.NumbersWithoutNegatives, Scope.NumbersWithoutZero]
};

export const MeasurementUnitScaleGeneratorSchema = {
    range: [[Scope.NumbersSmaller10, Scope.NumbersSmaller20], selectExactLabelMap([
        [Scope.NumbersSmaller10, createCanonicalNumericRange(10)],
        [Scope.NumbersSmaller20, createCanonicalNumericRange(20)]
    ])]
} as const;
export type MeasurementUnitScaleGeneratorConfig = ConfigFromSchema<typeof MeasurementUnitScaleGeneratorSchema>;
