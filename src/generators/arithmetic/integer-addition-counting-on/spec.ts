import {Area, Scope} from 'edugraph-ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {spec as baseSpec} from '../integer-add-subtract-strategies/spec.ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {selectExactLabelMap} from '../../../lib/resolvers.ts';

export const spec: GeneratorSpec = {
    generatorId: 'integer-addition-counting-on',
    generalLabels: [...baseSpec.generalLabels, Area.AdditionCountingOn, Scope.SingleDigitSmallestOperand]
};
export const IntegerAdditionCountingOnGeneratorSchema = {
    range: [[Scope.NumbersSmaller5, Scope.NumbersSmaller10, Scope.NumbersSmaller20], selectExactLabelMap([
        [Scope.NumbersSmaller5, createCanonicalNumericRange(5)],
        [Scope.NumbersSmaller10, createCanonicalNumericRange(10)],
        [Scope.NumbersSmaller20, createCanonicalNumericRange(20)]
    ])]
} as const;
export type IntegerAdditionCountingOnGeneratorConfig = ConfigFromSchema<typeof IntegerAdditionCountingOnGeneratorSchema>;
