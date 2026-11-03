import {validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {FractionProductRelationProblem} from '../../../types/problems.ts';
import {buildFractionProductRelation, fractionProductDomain, selectFractionProductOperands} from '../fraction-product-domain.ts';
import {FractionProductRelationsGeneratorSchema, type FractionProductRelationsGeneratorConfig} from './spec.ts';

export class FractionProductRelationsGenerator implements ProblemGenerator<FractionProductRelationProblem, FractionProductRelationsGeneratorConfig> {
    type: AbstractProblem['type'] = 'fraction';
    schema = FractionProductRelationsGeneratorSchema;

    generate(config: FractionProductRelationsGeneratorConfig): ProblemStub<FractionProductRelationProblem> {
        validateConfigFields('fraction-product-relations', config, ['productProfile', 'range']);
        const domain = fractionProductDomain('relation', config.productProfile!, config.range!);
        const operands = selectFractionProductOperands(domain, random());
        return {data: buildFractionProductRelation(operands, config.productProfile!, random() < 0.5 ? 'ribbon' : 'rope')};
    }
}
