import {validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {AngleUnitIterationProblem} from '../../../types/problems.ts';
import {AngleUnitIterationGeneratorConfig, AngleUnitIterationGeneratorSchema} from './spec.ts';

const COUNTS = [5, 8, 10, 12, 15] as const;

export class AngleUnitIterationGenerator implements ProblemGenerator<AngleUnitIterationProblem, AngleUnitIterationGeneratorConfig> {
    type: AbstractProblem['type'] = 'shape';
    schema = AngleUnitIterationGeneratorSchema;

    generate(config: AngleUnitIterationGeneratorConfig): ProblemStub<AngleUnitIterationProblem> {
        validateConfigFields('angle-unit-iteration', config, []);
        const count = COUNTS[Math.floor(random() * COUNTS.length)];
        return {data: {kind: 'angle-iteration', fullTurnDegrees: 360, unitDegrees: 1, count, angleDegrees: count}};
    }
}
