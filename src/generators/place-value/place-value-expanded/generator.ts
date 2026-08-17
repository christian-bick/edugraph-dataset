import {Scope} from 'edugraph-ts';
import {validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {
    createWholeNumberPlaceValues,
    formatStandardNumeral
} from '../../../lib/whole-number-notation.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {PlaceValueExpandedProblem} from '../../../types/problems.ts';
import {PlaceValueExpandedGeneratorConfig, PlaceValueExpandedGeneratorSchema} from './spec.ts';

function expandedTerms(number: number): number[] {
    return createWholeNumberPlaceValues(number)
        .map(place => place.value)
        .filter(value => value !== 0);
}

export class PlaceValueExpandedGenerator implements ProblemGenerator<PlaceValueExpandedProblem, PlaceValueExpandedGeneratorConfig> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = PlaceValueExpandedGeneratorSchema;

    generate(config: PlaceValueExpandedGeneratorConfig): ProblemStub<PlaceValueExpandedProblem> | null {
        validateConfigFields('place-value-expanded', config, ['range']);
        const range = config.range!;
        if (range.max <= 1000) {
            validateConfigFields('place-value-expanded', config, ['range', 'operandCardinality']);
        }
        const requiredTerms = config.operandCardinality === Scope.TwoOperands
            ? 2
            : config.operandCardinality === Scope.ThreeOperands
                ? 3
                : undefined;

        if (range.max > 1000) {
            const min = Math.max(1000, Math.ceil(range.min));
            const max = Math.min(1_000_000, Math.floor(range.max));
            if (min > max) return null;

            for (let attempt = 0; attempt < 10_000; attempt++) {
                const number = Math.floor(random() * (max - min + 1)) + min;
                const terms = expandedTerms(number);
                if (requiredTerms !== undefined && terms.length !== requiredTerms) continue;
                const placeValues = createWholeNumberPlaceValues(number);
                return {
                    data: {
                        task: 'multi-digit-expanded-form',
                        number,
                        terms,
                        placeValues,
                        prompt: 'Write the numeral as a sum of its nonzero place values.',
                        expandedEquation: `${formatStandardNumeral(number)} = ${terms.map(formatStandardNumeral).join(' + ')}`
                    }
                };
            }

            return null;
        }

        const min = Math.max(100, Math.ceil(range.min));
        const max = Math.min(999, Math.floor(range.max));
        if (min > max) return null;

        const candidates = Array.from({length: max - min + 1}, (_, index) => min + index)
            .filter(number => requiredTerms === undefined || expandedTerms(number).length === requiredTerms);
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
