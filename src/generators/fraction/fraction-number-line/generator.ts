import { GeneratorValidationError, validateConfigFields } from '../../../lib/errors.ts';
import { random } from '../../../lib/random.ts';
import { AbstractProblem, ProblemGenerator, ProblemStub } from '../../../types/ml-engine.ts';
import { FractionNumberLineProblem } from '../../../types/problems.ts';
import { fractionLineCandidates } from './domain.ts';
import { FractionNumberLineGeneratorConfig, FractionNumberLineGeneratorSchema } from './spec.ts';
export class FractionNumberLineGenerator implements ProblemGenerator<FractionNumberLineProblem, FractionNumberLineGeneratorConfig> {
    type: AbstractProblem['type'] = 'fraction';
    schema = FractionNumberLineGeneratorSchema;
    generate(config: FractionNumberLineGeneratorConfig): ProblemStub<FractionNumberLineProblem> {
        validateConfigFields('fraction-number-line', config, ['fractionType', 'range']);
        const fractionType = config.fractionType!;
        if (!['unit', 'nonunit', 'improper'].includes(fractionType)) {
            throw new GeneratorValidationError('fraction-number-line', `Unsupported fractionType "${fractionType}".`);
        }
        const candidates = fractionLineCandidates(fractionType, config.range!);
        if (!candidates.length)
            throw new GeneratorValidationError('fraction-number-line', 'No values support the selected kind/range.');
        const { numerator, denominator } = candidates[Math.floor(random() * candidates.length)]!;
        return {
            data: {
                task: 'locate-fraction',
                numerator,
                denominator,
                wholeCount: numerator > denominator ? 2 : 1,
                steps: Array.from({ length: numerator }, (_, index) => ({
                    fromNumerator: index,
                    toNumerator: index + 1
                }))
            }
        };
    }
}
