import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {UnitRateRelationProblem} from '../../../types/problems.ts';
import {pick, rational} from '../helpers.ts';
import {UnitRateRelationsGeneratorSchema, type UnitRateRelationsGeneratorConfig} from './spec.ts';
import {unitRateFramesForRange} from './numeric-domain.ts';

export class UnitRateRelationsGenerator implements ProblemGenerator<UnitRateRelationProblem, UnitRateRelationsGeneratorConfig> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = UnitRateRelationsGeneratorSchema;

    generate(config: UnitRateRelationsGeneratorConfig): ProblemStub<UnitRateRelationProblem> {
        validateConfigFields('unit-rate-relations', config, ['range']);
        const frames = unitRateFramesForRange(config.range!);
        if (frames.length === 0) throw new GeneratorValidationError('unit-rate-relations', 'Unsupported canonical range.');
        const context = pick(['price', 'speed'] as const);
        const {first, second, scaleFactor} = pick(frames);
        const antecedent = context === 'price'
            ? {name: 'cost', unit: 'dollars', value: rational(first)}
            : {name: 'distance', unit: 'kilometers', value: rational(first)};
        const consequent = context === 'price'
            ? {name: 'apples', unit: 'kilograms', value: rational(second)}
            : {name: 'time', unit: 'hours', value: rational(second)};
        return {data: {
            kind: 'unit-rate', context, antecedent, consequent,
            unitRate: rational(first, second), scaleFactor: {...scaleFactor},
            scaled: {
                antecedent: rational(first * scaleFactor.numerator, scaleFactor.denominator),
                consequent: rational(second * scaleFactor.numerator, scaleFactor.denominator)
            }
        }};
    }
}
