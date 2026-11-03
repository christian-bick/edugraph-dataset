import {validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {FractionProductProblem} from '../../../types/problems.ts';
import {buildFractionProduct, fractionProductDomain, selectFractionProductOperands} from '../fraction-product-domain.ts';
import {FractionProductsGeneratorSchema, type FractionProductsGeneratorConfig} from './spec.ts';

export class FractionProductsGenerator implements ProblemGenerator<FractionProductProblem, FractionProductsGeneratorConfig> {
    type: AbstractProblem['type'] = 'fraction';
    schema = FractionProductsGeneratorSchema;

    generate(config: FractionProductsGeneratorConfig): ProblemStub<FractionProductProblem> {
        validateConfigFields('fraction-products', config, ['productProfile', 'range']);
        const domain = fractionProductDomain('derivation', config.productProfile!, config.range!);
        const operands = selectFractionProductOperands(domain, random());
        return {data: buildFractionProduct(operands, config.productProfile!, random() < 0.5 ? 'ribbon' : 'rope')};
    }
}
