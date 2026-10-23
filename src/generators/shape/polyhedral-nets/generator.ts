import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {PolyhedralNetProblem} from '../../../types/problems.ts';
import {affineScalar} from '../../algebra/algebra-affine-helpers.ts';
import {makePolyhedralNetCatalogInput, type PolyhedralNetCatalogShape} from '../polyhedral-net-catalog.ts';
import {buildPolyhedralNetProblem} from '../polyhedral-net-helpers.ts';
import {PolyhedralNetsGeneratorSchema, type PolyhedralNetsGeneratorConfig} from './spec.ts';

const generatorId = 'polyhedral-nets';
const families = ['rectangular-prism', 'triangular-prism', 'pyramid'];
const relations = ['boundary-incidence', 'surface-additivity'];
const shapes: Record<NonNullable<PolyhedralNetsGeneratorConfig['solidFamily']>, readonly PolyhedralNetCatalogShape[]> = {
    'rectangular-prism': ['cube', 'box'],
    'triangular-prism': ['triangular-prism'],
    pyramid: ['triangular-pyramid', 'square-pyramid', 'rectangular-pyramid']
};
const scaleCount = 24;

export class PolyhedralNetsGenerator implements ProblemGenerator<PolyhedralNetProblem, PolyhedralNetsGeneratorConfig> {
    type: AbstractProblem['type'] = 'shape';
    schema = PolyhedralNetsGeneratorSchema;

    generate(config: PolyhedralNetsGeneratorConfig): ProblemStub<PolyhedralNetProblem> {
        validateConfigFields(generatorId, config, ['solidFamily', 'mathematicalRelation']);
        if (!config.solidFamily || !config.mathematicalRelation
            || !families.includes(config.solidFamily) || !relations.includes(config.mathematicalRelation)) {
            throw new GeneratorValidationError(generatorId, 'Choose an admitted solid family and exact boundary or surface relation.');
        }
        const choices = shapes[config.solidFamily];
        const selected = Math.floor(random() * choices.length * scaleCount);
        // Only visible solid geometry varies. A hidden alternative unfolding or story
        // noun must not disguise the same construction question as different content.
        const input = makePolyhedralNetCatalogInput({shape: choices[Math.floor(selected / scaleCount)]!,
            scale: affineScalar(BigInt(selected % scaleCount + 1), 4n), lengthUnit: 'centimeters',
            mathematicalRelation: config.mathematicalRelation});
        return {data: buildPolyhedralNetProblem(input)};
    }
}

export default new PolyhedralNetsGenerator();
