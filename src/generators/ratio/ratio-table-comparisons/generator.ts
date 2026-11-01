import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {RatioTableComparisonProblem} from '../../../types/problems.ts';
import {pick, ratioQuantities, ratioTable} from '../helpers.ts';
import {RatioTableComparisonsGeneratorSchema, type RatioTableComparisonsGeneratorConfig} from './spec.ts';
import {comparisonFramesForRange} from './numeric-domain.ts';

export class RatioTableComparisonsGenerator implements ProblemGenerator<RatioTableComparisonProblem, RatioTableComparisonsGeneratorConfig> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = RatioTableComparisonsGeneratorSchema;

    generate(config: RatioTableComparisonsGeneratorConfig): ProblemStub<RatioTableComparisonProblem> {
        validateConfigFields('ratio-table-comparisons', config, ['relation']);
        const relation = config.relation;
        if (relation !== 'less' && relation !== 'equal' && relation !== 'greater') {
            throw new GeneratorValidationError('ratio-table-comparisons', 'Relation must be less, equal, or greater.');
        }
        validateConfigFields('ratio-table-comparisons', config, ['range']);
        const frames = comparisonFramesForRange(relation, config.range!);
        if (frames.length === 0) throw new GeneratorValidationError('ratio-table-comparisons', 'Unsupported canonical range for this comparison.');
        const quantities = pick(ratioQuantities);
        const {leftBase, rightBase, consequent, leftScale, rightScale} = pick(frames);
        const left = ratioTable([...leftBase], quantities, [1, 2, 3, leftScale]);
        const right = ratioTable([...rightBase], quantities, [1, 2, 3, rightScale]);
        return {data: {
            kind: 'ratio-table-comparison', left, right, relation,
            normalized: {consequent, leftAntecedent: leftBase[0] * leftScale, rightAntecedent: rightBase[0] * rightScale}
        }};
    }
}
