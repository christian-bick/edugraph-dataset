import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {
    DecimalComparisonOperand,
    DecimalComparisonProblem
} from '../../../types/problems.ts';
import {
    DecimalComparisonGeneratorConfig,
    DecimalComparisonGeneratorSchema
} from './spec.ts';

type Precision = DecimalComparisonOperand['precision'];
type OperandSeed = {
    precision: Precision;
    normalizedHundredths: number;
};
type PairSeed = {
    left: OperandSeed;
    right: OperandSeed;
};

const TENTHS = Array.from({length: 9}, (_, index): OperandSeed => ({
    precision: 'tenths',
    normalizedHundredths: (index + 1) * 10
}));
const NONTRIVIAL_HUNDREDTHS = Array.from({length: 99}, (_, index) => index + 1)
    .filter(value => value % 10 !== 0)
    .map((normalizedHundredths): OperandSeed => ({
        precision: 'hundredths',
        normalizedHundredths
    }));

const INEQUALITY_PAIRS = TENTHS.flatMap(tenths =>
    NONTRIVIAL_HUNDREDTHS.flatMap(hundredths => [{
        left: tenths,
        right: hundredths
    }, {
        left: hundredths,
        right: tenths
    }])
);

const PAIRS_BY_RELATION = {
    greater: INEQUALITY_PAIRS.filter(pair =>
        pair.left.normalizedHundredths > pair.right.normalizedHundredths),
    less: INEQUALITY_PAIRS.filter(pair =>
        pair.left.normalizedHundredths < pair.right.normalizedHundredths)
} as const;

const randomItem = <T>(items: readonly T[]): T => items[Math.floor(random() * items.length)]!;

const makeOperand = (seed: OperandSeed): DecimalComparisonOperand => {
    const tenthsDigit = Math.floor(seed.normalizedHundredths / 10);
    const normalizedHundredthsDigit = seed.normalizedHundredths % 10;
    const hundredthsDigit = seed.precision === 'hundredths'
        ? normalizedHundredthsDigit
        : null;
    return {
        precision: seed.precision,
        wholeDigit: 0,
        tenthsDigit,
        hundredthsDigit,
        normalizedHundredths: seed.normalizedHundredths
    };
};

const equalityPair = (): PairSeed => {
    const tenths = randomItem(TENTHS);
    const hundredths: OperandSeed = {
        precision: 'hundredths',
        normalizedHundredths: tenths.normalizedHundredths
    };
    return random() < 0.5
        ? {left: tenths, right: hundredths}
        : {left: hundredths, right: tenths};
};

export class DecimalComparisonGenerator implements ProblemGenerator<
    DecimalComparisonProblem,
    DecimalComparisonGeneratorConfig
> {
    type: AbstractProblem['type'] = 'comparison';
    schema = DecimalComparisonGeneratorSchema;

    generate(config: DecimalComparisonGeneratorConfig): ProblemStub<DecimalComparisonProblem> {
        validateConfigFields('decimal-comparison', config, ['comparisonKind', 'relation']);
        if (Object.keys(config).some(key => key !== 'comparisonKind' && key !== 'relation')) {
            throw new GeneratorValidationError(
                'decimal-comparison',
                'The configuration contains an unexpected field.'
            );
        }

        const relation = config.relation;
        if (relation !== 'greater' && relation !== 'equal' && relation !== 'less') {
            throw new GeneratorValidationError(
                'decimal-comparison',
                'The relation must be Greater, Equal, or Less.'
            );
        }
        const expectedKind = relation === 'equal'
            ? 'equality'
            : 'inequality';
        if (config.comparisonKind !== expectedKind) {
            throw new GeneratorValidationError(
                'decimal-comparison',
                'Equal requires NumericEquality; Greater and Less require NumericInequality.'
            );
        }

        const pair = relation === 'equal'
            ? equalityPair()
            : randomItem(PAIRS_BY_RELATION[relation]);
        const left = makeOperand(pair.left);
        const right = makeOperand(pair.right);
        const firstDecidingPlace = relation === 'equal'
            ? 'equal' as const
            : left.tenthsDigit === right.tenthsDigit
                ? 'hundredths' as const
                : 'tenths' as const;
        return {
            data: {
                task: 'compare-decimals',
                sharedWhole: 1,
                relation,
                left,
                right,
                firstDecidingPlace
            }
        };
    }
}
