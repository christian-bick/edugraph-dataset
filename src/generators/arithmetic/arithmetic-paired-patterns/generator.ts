import {validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {
    ArithmeticPairedPatternCorrespondence,
    ArithmeticPairedPatternProblem,
    ArithmeticPairedPatternSequence
} from '../../../types/problems.ts';
import {
    ArithmeticPairedPatternsGeneratorConfig,
    ArithmeticPairedPatternsGeneratorSchema
} from './spec.ts';

const randomInteger = (minimum: number, maximum: number): number =>
    minimum + Math.floor(random() * (maximum - minimum + 1));

const sequence = (start: number, increment: number, count: number): ArithmeticPairedPatternSequence => ({
    start,
    rule: {kind: 'add-constant', increment},
    terms: Array.from({length: count}, (_, index) => start + index * increment)
});

const paired = (
    firstStart: number,
    firstIncrement: number,
    secondStart: number,
    secondIncrement: number,
    correspondence?: ArithmeticPairedPatternCorrespondence
): ArithmeticPairedPatternProblem => ({
    kind: 'paired-additive-patterns',
    first: sequence(firstStart, firstIncrement, 6),
    second: sequence(secondStart, secondIncrement, 6),
    ...(correspondence && {correspondence})
});

/** A source-standard case: add 3 and add 6 from zero, with a 2:1 term relation. */
const sourceExample = (): ArithmeticPairedPatternProblem =>
    paired(0, 3, 0, 6);

const multiplicativePair = (): ArithmeticPairedPatternProblem => {
    const factor = randomInteger(2, 3);
    const firstStart = randomInteger(0, 4);
    const firstIncrement = randomInteger(2, 5);
    return paired(firstStart, firstIncrement, factor * firstStart, factor * firstIncrement,
        {kind: 'multiplicative', factor});
};

const additivePair = (): ArithmeticPairedPatternProblem => {
    const firstStart = randomInteger(0, 6);
    const increment = randomInteger(2, 7);
    const difference = randomInteger(2, 9);
    return paired(firstStart, increment, firstStart + difference, increment,
        {kind: 'additive', difference});
};

const independentPair = (): ArithmeticPairedPatternProblem => paired(
    randomInteger(0, 6), randomInteger(2, 7),
    randomInteger(0, 6), randomInteger(2, 7)
);

export class ArithmeticPairedPatternsGenerator implements ProblemGenerator<
    ArithmeticPairedPatternProblem,
    ArithmeticPairedPatternsGeneratorConfig
> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = ArithmeticPairedPatternsGeneratorSchema;

    generate(config: ArithmeticPairedPatternsGeneratorConfig): ProblemStub<ArithmeticPairedPatternProblem> | null {
        validateConfigFields('arithmetic-paired-patterns', config, ['hasCorrespondence']);
        if (typeof config.hasCorrespondence !== 'boolean') return null;

        const choice = random();
        const data = config.hasCorrespondence
            ? choice < 0.6 ? multiplicativePair() : additivePair()
            : choice < 0.2 ? sourceExample() : independentPair();
        return {data};
    }
}
