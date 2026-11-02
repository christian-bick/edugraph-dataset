import {Scope} from 'edugraph-ts';
import {validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {
    createWholeNumberPlaceValues
} from '../../../lib/whole-number-notation.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {PlaceValueExpandedProblem} from '../../../types/problems.ts';
import {PlaceValueExpandedGeneratorConfig, PlaceValueExpandedGeneratorSchema, spec} from './spec.ts';
import {expandedNumbers} from './domain.ts';

function expandedTerms(number: number): number[] {
    return createWholeNumberPlaceValues(number)
        .map(place => place.value)
        .filter(value => value !== 0);
}

export class PlaceValueExpandedGenerator implements ProblemGenerator<PlaceValueExpandedProblem, PlaceValueExpandedGeneratorConfig> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = PlaceValueExpandedGeneratorSchema;
    readonly spec = spec;

    generate(config: PlaceValueExpandedGeneratorConfig): ProblemStub<PlaceValueExpandedProblem> {
        validateConfigFields('place-value-expanded', config, ['range', 'operandCardinality']);
        const range = config.range!;
        const requiredTerms = config.operandCardinality === Scope.TwoOperands
            ? 2
            : config.operandCardinality === Scope.ThreeOperands
                ? 3
                : undefined;

        const candidates = expandedNumbers(range, requiredTerms!);
        const number = candidates[Math.floor(random() * candidates.length)]!;
        if (range.max > 1000) return {data: {task: 'multi-digit-expanded-form', number,
            terms: expandedTerms(number), placeValues: createWholeNumberPlaceValues(number)}};
        return {
            data: {
                number,
                terms: expandedTerms(number)
            }
        };
    }
}
