import {validateConfigFields} from '../../../lib/errors.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {UnitRateRelationProblem} from '../../../types/problems.ts';
import {pick, randomInteger, rational, validateMagnitudeRange} from '../helpers.ts';
import {UnitRateRelationsGeneratorSchema, type UnitRateRelationsGeneratorConfig} from './spec.ts';

export class UnitRateRelationsGenerator implements ProblemGenerator<UnitRateRelationProblem, UnitRateRelationsGeneratorConfig> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = UnitRateRelationsGeneratorSchema;

    generate(config: UnitRateRelationsGeneratorConfig): ProblemStub<UnitRateRelationProblem> {
        validateConfigFields('unit-rate-relations', config, ['range']);
        const maximum = validateMagnitudeRange('unit-rate-relations', config.range!);
        const context = pick(['price', 'speed'] as const);
        const scaleFactor = pick([rational(1, 2), rational(2), rational(3)]);
        const originalMaximum = Math.floor(maximum / Math.max(1, scaleFactor.numerator / scaleFactor.denominator));
        const first = randomInteger(1, originalMaximum);
        const second = randomInteger(2, Math.min(8, originalMaximum));
        const antecedent = context === 'price'
            ? {name: 'cost', unit: 'dollars', value: rational(first)}
            : {name: 'distance', unit: 'kilometers', value: rational(first)};
        const consequent = context === 'price'
            ? {name: 'apples', unit: 'kilograms', value: rational(second)}
            : {name: 'time', unit: 'hours', value: rational(second)};

        return {data: {
            kind: 'unit-rate', context, antecedent, consequent,
            unitRate: rational(first, second),
            scaleFactor,
            scaled: {
                antecedent: rational(first * scaleFactor.numerator, scaleFactor.denominator),
                consequent: rational(second * scaleFactor.numerator, scaleFactor.denominator)
            }
        }};
    }
}
