import {Area, Scope} from 'edugraph-ts';
import {canonicalRangeLabelChoices, canonicalRangeLabels} from '../../../lib/canonical-range-labels.ts';
import {hasLabel} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {arithmeticTripleLabels} from '../arithmetic-triple-schema.ts';
import {canonicalTripleFields, canonicalTripleDomainRule, canonicalTripleWidthRule, resolveCanonicalTripleRange} from '../canonical-triple-schema.ts';

import {generatorLabelRule} from '../../compatibility-rules.ts';

export const spec: GeneratorSpec = {
    generatorId: 'arithmetic-ops-triples',
    compatibility: [canonicalTripleWidthRule, canonicalTripleDomainRule, generatorLabelRule('three-operand-property-law', [
        Area.Addition, Area.Subtraction, Area.Multiplication, Area.Division,
        Area.CommutativeLaw, Area.AssociativeLaw, Area.DistributiveLaw
    ], selected => {
        const commutative = selected(Area.CommutativeLaw);
        const associative = selected(Area.AssociativeLaw);
        const distributive = selected(Area.DistributiveLaw);
        const multiplication = selected(Area.Multiplication);
        if (Number(commutative) + Number(associative) + Number(distributive) > 1) return false;
        if ((commutative || associative) && !selected(Area.Addition) && !multiplication) return false;
        if (distributive && !multiplication) return false;
        return !selected(Area.Addition) || !multiplication || distributive;
    })],
    generalLabels: arithmeticTripleLabels
};

export const ArithmeticOpsTriplesGeneratorSchema = {
    ...canonicalTripleFields,
    requireTwoDigitOperands: [[Scope.TwoDigitLargestOperand], hasLabel(Scope.TwoDigitLargestOperand)],
    range: [canonicalRangeLabels, resolveCanonicalTripleRange, canonicalRangeLabelChoices()]
} as const;

export type ArithmeticOpsTriplesGeneratorConfig = ConfigFromSchema<typeof ArithmeticOpsTriplesGeneratorSchema>;
