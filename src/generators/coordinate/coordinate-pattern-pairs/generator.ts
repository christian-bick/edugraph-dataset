import {validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {ArithmeticPairedPatternSequence, CoordinatePatternPairsProblem} from '../../../types/problems.ts';
import {CoordinatePatternPairsGeneratorConfig, CoordinatePatternPairsGeneratorSchema} from './spec.ts';

const TERM_COUNT = 4;

const randomInteger = (minimum: number, maximum: number): number =>
    minimum + Math.floor(random() * (maximum - minimum + 1));

const sequence = (start: number, increment: number): ArithmeticPairedPatternSequence => ({
    start,
    rule: {kind: 'add-constant', increment},
    terms: Array.from({length: TERM_COUNT}, (_, index) => start + index * increment)
});

/** The initial pair is the origin or lies on one axis; every later point stays within 0–12. */
function coordinatePatterns(): CoordinatePatternPairsProblem {
    const axisCase = randomInteger(0, 2);
    const firstStart = axisCase === 0 || axisCase === 2 ? 0 : randomInteger(1, 3);
    const secondStart = axisCase === 0 || axisCase === 1 ? 0 : randomInteger(1, 3);
    const first = sequence(firstStart, randomInteger(1, 3));
    const second = sequence(secondStart, randomInteger(1, 3));

    return {
        kind: 'coordinate-pattern-pairs',
        first,
        second,
        points: first.terms.map((x, index) => ({x, y: second.terms[index]!}))
    };
}

export class CoordinatePatternPairsGenerator implements ProblemGenerator<
    CoordinatePatternPairsProblem,
    CoordinatePatternPairsGeneratorConfig
> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = CoordinatePatternPairsGeneratorSchema;

    generate(config: CoordinatePatternPairsGeneratorConfig): ProblemStub<CoordinatePatternPairsProblem> | null {
        validateConfigFields('coordinate-pattern-pairs', config, []);
        return {data: coordinatePatterns()};
    }
}
