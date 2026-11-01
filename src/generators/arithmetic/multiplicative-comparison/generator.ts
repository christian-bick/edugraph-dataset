import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {MultiplicativeComparisonProblem} from '../../../types/problems.ts';
import {
    MultiplicativeComparisonGeneratorConfig,
    MultiplicativeComparisonGeneratorSchema
} from './spec.ts';
import {comparisonDomain} from './domain.ts';

export class MultiplicativeComparisonGenerator implements ProblemGenerator<
    MultiplicativeComparisonProblem,
    MultiplicativeComparisonGeneratorConfig
> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = MultiplicativeComparisonGeneratorSchema;

    generate(
        config: MultiplicativeComparisonGeneratorConfig
    ): ProblemStub<MultiplicativeComparisonProblem> {
        validateConfigFields('multiplicative-comparison', config, ['profile']);
        const candidates = comparisonDomain(config.profile!);
        if (!candidates.length) {
            throw new GeneratorValidationError('multiplicative-comparison', 'The selected profile has no mathematical comparisons.');
        }
        const rows = [...new Set(candidates.map(data => data.scaleFactor))].map(scale => {
            const values = candidates.filter(data => data.scaleFactor === scale);
            const originalCount = Math.min(12, Math.floor(100 / scale)) - 1;
            return {values, weight: values.length / originalCount};
        });
        // Preserve the old uniform-scale/uniform-reference law conditional on the selected profile.
        let position = random() * rows.reduce((sum, row) => sum + row.weight, 0);
        const row = rows.find(candidate => {
            if (position < candidate.weight) return true;
            position -= candidate.weight;
            return false;
        }) ?? rows.at(-1)!;
        return {data: {...row.values[Math.floor(random() * row.values.length)]!}};
    }
}
