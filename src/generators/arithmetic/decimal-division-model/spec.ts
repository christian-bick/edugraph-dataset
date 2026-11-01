import {Area, Scope} from 'edugraph-ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {selectExactLabelMap} from '../../../lib/resolvers.ts';
import {requireTargetLabels} from '../../../lib/target-policies.ts';

export const spec: GeneratorSpec = {
    generatorId: 'decimal-division-model',
    compatibility: [requireTargetLabels('decimal-grouping-numeric-domain', [Scope.DecimalNumbers])],
    generalLabels: [
        Area.Division,
        Area.PlaceValue,
        Scope.HundredthDecimals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.TwoOperands,
        Scope.NumbersWithZero
    ]
};

export const DecimalDivisionModelGeneratorSchema = {
    range: [[Scope.NumbersSmaller100, Scope.NumbersSmaller120, Scope.NumbersSmaller1000], selectExactLabelMap([
        [Scope.NumbersSmaller100, createCanonicalNumericRange(100)], [Scope.NumbersSmaller120, createCanonicalNumericRange(120)],
        [Scope.NumbersSmaller1000, createCanonicalNumericRange(1000)]
    ] as const)]
} as const;

export type DecimalDivisionModelGeneratorConfig = ConfigFromSchema<
    typeof DecimalDivisionModelGeneratorSchema
>;
