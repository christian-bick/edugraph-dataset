import {Scope} from 'edugraph-ts';
import {validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {PlaceValueExpandedProblem} from '../../../types/problems.ts';
import {PlaceValueExpandedGeneratorConfig, PlaceValueExpandedGeneratorSchema} from './spec.ts';

function expandedTerms(number: number): number[] {
    return [
        Math.floor(number / 100) * 100,
        Math.floor((number % 100) / 10) * 10,
        number % 10
    ].filter(value => value !== 0);
}

export class PlaceValueExpandedGenerator implements ProblemGenerator<PlaceValueExpandedProblem, PlaceValueExpandedGeneratorConfig> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = PlaceValueExpandedGeneratorSchema;

    generate(config: PlaceValueExpandedGeneratorConfig): ProblemStub<PlaceValueExpandedProblem> | null {
        validateConfigFields('place-value-expanded', config, ['range', 'operandCardinality']);
        const range = config.range!;
        const requiredTerms = config.operandCardinality === Scope.TwoOperands ? 2 : 3;
        const min = Math.max(100, Math.ceil(range.min));
        const max = Math.min(999, Math.floor(range.max));
        if (min > max) return null;

        const candidates = Array.from({length: max - min + 1}, (_, index) => min + index)
            .filter(number => expandedTerms(number).length === requiredTerms);
        if (candidates.length === 0) return null;

        const number = candidates[Math.floor(random() * candidates.length)];
        return {
            data: {
                number,
                terms: expandedTerms(number)
            }
        };
    }
}
