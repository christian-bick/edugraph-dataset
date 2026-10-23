import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {PolygonAreaDissectionProblem} from '../../../types/problems.ts';
import {buildPolygonAreaDissectionProblem} from '../polygon-area-helpers.ts';
import {makePolygonAreaSamplerBlueprint, type PolygonAreaSamplerScale} from '../polygon-area-sampler-helpers.ts';
import {PolygonAreaDissectionGeneratorSchema, type PolygonAreaDissectionGeneratorConfig} from './spec.ts';

const generatorId = 'polygon-area-dissection';
const families = ['right-triangle', 'acute-triangle', 'obtuse-triangle', 'parallelogram', 'rhombus', 'trapezoid', 'kite', 'polygon'];
const contexts = ['floor-region', 'garden-bed', 'fabric-panel'] as const;
const variants = ['convex', 'star', 'nonstar'] as const;
const integer = (maximum: number): number => Math.floor(random() * maximum);

export class PolygonAreaDissectionGenerator implements ProblemGenerator<PolygonAreaDissectionProblem, PolygonAreaDissectionGeneratorConfig> {
    type: AbstractProblem['type'] = 'shape';
    schema = PolygonAreaDissectionGeneratorSchema;

    generate(config: PolygonAreaDissectionGeneratorConfig): ProblemStub<PolygonAreaDissectionProblem> {
        validateConfigFields(generatorId, config, ['family']);
        if (!config.family || !families.includes(config.family)) {
            throw new GeneratorValidationError(generatorId, 'Choose a complete admitted source shape and dissection construction.');
        }
        const scale = integer(4) as PolygonAreaSamplerScale;
        // A different story noun must not disguise identical geometry and measurements
        // from the canonical train/validation content deduplicator.
        const blueprint = makePolygonAreaSamplerBlueprint(config.family, scale,
            contexts[scale % contexts.length]!, config.family === 'polygon' ? variants[integer(variants.length)]! : 'convex');
        return {data: buildPolygonAreaDissectionProblem(blueprint)};
    }
}

export default new PolygonAreaDissectionGenerator();
