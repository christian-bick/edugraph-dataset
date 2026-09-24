import {Area, deductCompatible, Scope} from 'edugraph-ts';
import {resolveRangeFromLabels} from '../../../lib/ontology.ts';
import {hasAllLabels, hasLabel} from '../../../lib/resolvers.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {arithmeticOperations, resolveDeclaredOperation} from '../helpers.ts';

import {generatorLabelRule} from '../../compatibility-rules.ts';

export const spec: GeneratorSpec = {
    generatorId: 'arithmetic-ops-pairs',
    compatibility: [generatorLabelRule('equal-addends-domain', [
        Area.Addition, Area.IteratedOperation, Scope.NumbersWithNegatives, Scope.NumbersWithZero
    ], selected => !(selected(Area.Addition) && selected(Area.IteratedOperation))
        || !selected(Scope.NumbersWithNegatives) && !selected(Scope.NumbersWithZero))],
    generalLabels: [
        Scope.IntegerNumbers,
        Scope.Base10,
        Scope.TwoOperands,
        Scope.SingleStep
    ]
};

export const ArithmeticOpsPairsGeneratorSchema = {
    operation: [arithmeticOperations, resolveDeclaredOperation],
    requireNegative: [
        [Scope.NumbersWithNegatives, Scope.NumbersWithoutNegatives],
        hasLabel(Scope.NumbersWithNegatives),
        [[Scope.NumbersWithNegatives], [Scope.NumbersWithoutNegatives]]
    ],
    requireZero: [
        [Scope.NumbersWithZero, Scope.NumbersWithoutZero],
        hasLabel(Scope.NumbersWithZero)
    ],
    requireMultipleOf10: [
        [Scope.MultiplesOf10],
        hasLabel(Scope.MultiplesOf10)
    ],
    requireEqualAddends: [
        [Area.IteratedOperation],
        hasAllLabels([Area.Addition, Area.IteratedOperation])
    ],
    requireEvenResult: [
        [Scope.EvenNumbers],
        hasLabel(Scope.EvenNumbers)
    ],
    range: [
        deductCompatible([Scope.NumbersLargerZero, Scope.NumbersSmaller1000000]),
        resolveRangeFromLabels
    ]
} as const;

export type ArithmeticOpsPairsGeneratorConfig = ConfigFromSchema<typeof ArithmeticOpsPairsGeneratorSchema>;
