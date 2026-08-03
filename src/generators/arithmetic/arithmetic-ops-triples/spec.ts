import {Area, deductCompatible, Scope} from 'edugraph-ts';
import {resolveRangeFromLabels} from '../../../lib/ontology.ts';
import {hasLabel} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {arithmeticOperations, resolveExplicitOperation} from '../helpers.ts';

export const spec: GeneratorSpec = {
    generatorId: 'arithmetic-ops-triples',
    generalLabels: [
        Scope.IntegerNumbers,
        Scope.Base10,
        Scope.NumbersWithoutNegatives
    ]
};

export const ArithmeticOpsTriplesGeneratorSchema = {
    operation: [[...arithmeticOperations, Area.Sum], resolveExplicitOperation],
    requireZero: [
        [Scope.NumbersWithZero, Scope.NumbersWithoutZero],
        hasLabel(Scope.NumbersWithZero)
    ],
    requireMultipleOf10: [
        [Scope.MultiplesOf10],
        hasLabel(Scope.MultiplesOf10)
    ],
    useCommutativeLaw: [
        [Area.CommutativeLaw],
        hasLabel(Area.CommutativeLaw)
    ],
    useAssociativeLaw: [
        [Area.AssociativeLaw],
        hasLabel(Area.AssociativeLaw)
    ],
    range: [
        deductCompatible([Scope.NumbersLargerZero, Scope.NumbersSmaller1000000]),
        resolveRangeFromLabels
    ]
} as const;

export type ArithmeticOpsTriplesGeneratorConfig = ConfigFromSchema<typeof ArithmeticOpsTriplesGeneratorSchema>;
