import {Area, Scope} from 'edugraph-ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';
import {generatorLabelRule} from '../../compatibility-rules.ts';
import {countingQuantityLabels, countingQuantitySchema} from '../counting-quantity-schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'parity-grouping',
    generalLabels: countingQuantityLabels,
    compatibility: [generatorLabelRule('parity-grouping-positive-domain', [
        Area.EvenDivisibility, Area.UnevenDivisibility, Scope.EvenNumbers, Scope.OddNumbers,
        Scope.NumbersLarger5, Scope.NumbersLarger10, Scope.NumbersLarger20,
        Scope.NumbersSmaller5, Scope.NumbersSmaller10, Scope.NumbersSmaller20
    ], selected => {
        const even = selected(Area.EvenDivisibility) || selected(Scope.EvenNumbers);
        const odd = selected(Area.UnevenDivisibility) || selected(Scope.OddNumbers);
        if (even && odd) return false;
        let minimum = selected(Scope.NumbersLarger20) ? 20 : selected(Scope.NumbersLarger10) ? 10
            : selected(Scope.NumbersLarger5) ? 5 : 1;
        const maximum = selected(Scope.NumbersSmaller5) ? 5 : selected(Scope.NumbersSmaller10) ? 10 : 20;
        if (even && minimum % 2 !== 0 || odd && minimum % 2 !== 1) minimum++;
        return minimum <= maximum;
    })]
};

export const ParityGroupingGeneratorSchema = countingQuantitySchema;
export type ParityGroupingGeneratorConfig = ConfigFromSchema<typeof ParityGroupingGeneratorSchema>;
