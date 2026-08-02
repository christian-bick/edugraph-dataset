import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {Area, deductCompatible, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {hasLabel} from '../../../lib/resolvers.ts';
import {resolveRangeFromLabels} from '../../../lib/ontology.ts';
import {random} from '../../../lib/random.ts';

export const spec: GeneratorSpec = {
    generatorId: 'arithmetic-ops-pairs',
    generalLabels: [
        Scope.IntegerNumbers,
        Scope.Base10,
        Area.Addition,
        Area.Subtraction,
        Area.Multiplication,
        Area.Division
    ]
};

const operations = [
    Area.Addition,
    Area.Subtraction,
    Area.Multiplication,
    Area.Division
] as const;

const resolveExplicitOperation = (labels: string[]) => {
    // Preserve the legacy resolver's one RNG draw so tightening operation
    // selection does not churn existing seeded arithmetic samples.
    random();
    return operations.find(operation => labels.includes(operation)) ?? 'unsupported';
};

export const ArithmeticOpsPairsGeneratorSchema = {
    // Function-only resolution prevents an ontologically related label such as
    // Area.Difference from silently falling back to a random arithmetic operation.
    operation: resolveExplicitOperation,
    requireNegative: [
        [Scope.NumbersWithNegatives, Scope.NumbersWithoutNegatives],
        hasLabel(Scope.NumbersWithNegatives)
    ],
    requireZero: [
        [Scope.NumbersWithZero, Scope.NumbersWithoutZero],
        hasLabel(Scope.NumbersWithZero)
    ],
    requireMultipleOf10: [
        [Scope.MultiplesOf10],
        hasLabel(Scope.MultiplesOf10)
    ],
    useThreeAddends: [
        [Area.Sum],
        hasLabel(Area.Sum)
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

export type ArithmeticOpsPairsGeneratorConfig = ConfigFromSchema<typeof ArithmeticOpsPairsGeneratorSchema>;
