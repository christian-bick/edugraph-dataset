import {Area} from 'edugraph-ts';
import {validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {
    AngleArithmeticGeometry,
    AngleArithmeticProblem
} from '../../../types/problems.ts';
import {AngleArithmeticGeneratorConfig, AngleArithmeticGeneratorSchema} from './spec.ts';

type AnglePair = readonly [leftMeasure: number, rightMeasure: number];

const ANGLE_PAIRS: readonly AnglePair[] = [
    [25, 35],
    [30, 60],
    [45, 45],
    [45, 70],
    [55, 75],
    [65, 85],
    [80, 75]
];

function randomItem<T>(items: readonly T[]): T {
    return items[Math.floor(random() * items.length)];
}

function geometry(leftMeasure: number, rightMeasure: number): AngleArithmeticGeometry {
    const wholeMeasure = leftMeasure + rightMeasure;
    return {
        vertexLabel: 'O',
        startPointLabel: 'A',
        dividerPointLabel: 'B',
        endPointLabel: 'C',
        leftAngleName: 'AOB',
        rightAngleName: 'BOC',
        wholeAngleName: 'AOC',
        startDegrees: 0,
        dividerDegrees: leftMeasure,
        endDegrees: wholeMeasure,
        leftSweepDegrees: leftMeasure,
        rightSweepDegrees: rightMeasure,
        wholeSweepDegrees: wholeMeasure,
        direction: 'counterclockwise'
    };
}

export class AngleArithmeticGenerator implements ProblemGenerator<
    AngleArithmeticProblem,
    AngleArithmeticGeneratorConfig
> {
    type: AbstractProblem['type'] = 'shape';
    schema = AngleArithmeticGeneratorSchema;

    generate(config: AngleArithmeticGeneratorConfig): ProblemStub<AngleArithmeticProblem> | null {
        validateConfigFields('angle-arithmetic', config, ['operation']);

        if (config.operation !== Area.Addition && config.operation !== Area.Subtraction) {
            return null;
        }

        const [leftMeasure, rightMeasure] = randomItem(ANGLE_PAIRS);
        const wholeMeasure = leftMeasure + rightMeasure;
        return {
            data: {
                operation: config.operation === Area.Addition ? 'addition' : 'subtraction',
                geometry: geometry(leftMeasure, rightMeasure),
                leftMeasure,
                rightMeasure,
                wholeMeasure,
                relationStatement: 'm∠AOB + m∠BOC = m∠AOC'
            }
        };
    }
}
