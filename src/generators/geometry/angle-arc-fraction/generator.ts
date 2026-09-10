import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {AngleArcFractionProblem} from '../../../types/problems.ts';
import {AngleArcFractionGeneratorConfig, AngleArcFractionGeneratorSchema} from './spec.ts';

export class AngleArcFractionGenerator implements ProblemGenerator<AngleArcFractionProblem, AngleArcFractionGeneratorConfig> {
    type: AbstractProblem['type'] = 'shape';
    schema = AngleArcFractionGeneratorSchema;

    generate(config: AngleArcFractionGeneratorConfig): ProblemStub<AngleArcFractionProblem> {
        validateConfigFields('angle-arc-fraction', config, ['denominator']);
        const denominator = config.denominator!;
        if (![2, 3, 4, 6].includes(denominator)) {
            throw new GeneratorValidationError('angle-arc-fraction', 'Expected a supported positive unit-arc denominator.');
        }
        return {data: {kind: 'fractional-arc', fullTurnDegrees: 360,
            angleDegrees: 360 / denominator, arcFraction: {numerator: 1, denominator}}};
    }
}
