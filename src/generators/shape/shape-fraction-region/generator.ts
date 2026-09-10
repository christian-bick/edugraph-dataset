import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {ShapeFractionRegionProblem} from '../../../types/problems.ts';
import {ShapeFractionRegionGeneratorConfig, ShapeFractionRegionGeneratorSchema} from './spec.ts';

export class ShapeFractionRegionGenerator implements ProblemGenerator<ShapeFractionRegionProblem, ShapeFractionRegionGeneratorConfig> {
    type: AbstractProblem['type'] = 'shape';
    schema = ShapeFractionRegionGeneratorSchema;

    generate(config: ShapeFractionRegionGeneratorConfig): ProblemStub<ShapeFractionRegionProblem> {
        validateConfigFields('shape-fraction-region', config, ['shape', 'fraction']);
        const {shape, fraction} = config;
        const {parts, minNumerator, maxNumerator} = fraction!;
        if ((shape !== 'circle' && shape !== 'rectangle') || ![2, 3, 4, 6, 8].includes(parts)
            || !Number.isSafeInteger(minNumerator) || !Number.isSafeInteger(maxNumerator)
            || minNumerator < 1 || maxNumerator >= parts || minNumerator > maxNumerator) {
            throw new GeneratorValidationError('shape-fraction-region', 'Expected a proper fraction region within a supported equal partition.');
        }
        const numerator = minNumerator === maxNumerator ? minNumerator
            : minNumerator + Math.floor(random() * (maxNumerator - minNumerator + 1));
        return {data: {kind: 'selected-region', shape, parts, numerator}};
    }
}
