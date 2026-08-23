import {Area, Scope} from 'edugraph-ts';
import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {
    DecimalComparisonOperand,
    DecimalComparisonProblem
} from '../../../types/problems.ts';
import {toTenthsHundredthsGrid} from '../../fraction/tenths-hundredths.ts';
import {
    DecimalComparisonGeneratorConfig,
    DecimalComparisonGeneratorSchema
} from './spec.ts';

type Relation = DecimalComparisonProblem['relation'];
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

const normalizedNotation = (hundredths: number): string =>
    `0.${String(hundredths).padStart(2, '0')}`;

const makeOperand = <Role extends DecimalComparisonOperand['role']>(
    role: Role,
    seed: OperandSeed
): DecimalComparisonOperand & {role: Role} => {
    const tenthsDigit = Math.floor(seed.normalizedHundredths / 10);
    const normalizedHundredthsDigit = seed.normalizedHundredths % 10;
    const hundredthsDigit = seed.precision === 'hundredths'
        ? normalizedHundredthsDigit
        : null;
    const decimalNotation = seed.precision === 'tenths'
        ? `0.${tenthsDigit}`
        : normalizedNotation(seed.normalizedHundredths);

    return {
        role,
        decimalNotation,
        normalizedHundredthsNotation: normalizedNotation(seed.normalizedHundredths),
        precision: seed.precision,
        wholeDigit: 0,
        tenthsDigit,
        hundredthsDigit,
        normalizedHundredths: seed.normalizedHundredths,
        placeValueRow: {
            ones: '0',
            tenths: String(tenthsDigit),
            hundredths: String(normalizedHundredthsDigit)
        },
        model: toTenthsHundredthsGrid(seed.normalizedHundredths, 100)
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

const toRelation = (label: string): Relation | null => label === Scope.Greater
    ? 'greater'
    : label === Scope.Equal
        ? 'equal'
        : label === Scope.Less
            ? 'less'
            : null;

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

        const relation = toRelation(config.relation!);
        if (!relation) {
            throw new GeneratorValidationError(
                'decimal-comparison',
                'The relation must be Greater, Equal, or Less.'
            );
        }
        const expectedKind = relation === 'equal'
            ? Area.NumericEquality
            : Area.NumericInequality;
        if (config.comparisonKind !== expectedKind) {
            throw new GeneratorValidationError(
                'decimal-comparison',
                'Equal requires NumericEquality; Greater and Less require NumericInequality.'
            );
        }

        const pair = relation === 'equal'
            ? equalityPair()
            : randomItem(PAIRS_BY_RELATION[relation]);
        const left = makeOperand('left', pair.left);
        const right = makeOperand('right', pair.right);
        const symbol = relation === 'greater' ? '>' as const : relation === 'less' ? '<' as const : '=' as const;
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
                symbol,
                left,
                right,
                firstDecidingPlace
            }
        };
    }
}
