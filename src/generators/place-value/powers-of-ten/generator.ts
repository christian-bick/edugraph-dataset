import {validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {PowerTenNotationProblem, PowerTenPower} from '../../../types/problems.ts';
import {PowersOfTenGeneratorSchema} from './spec.ts';
import type {PowersOfTenGeneratorConfig} from './spec.ts';

const POWERS: readonly PowerTenPower[] = [
    {base: 10, exponent: 1, value: 10, repeatedFactors: [10]},
    {base: 10, exponent: 2, value: 100, repeatedFactors: [10, 10]},
    {base: 10, exponent: 0, value: 1, repeatedFactors: []}
];

export class PowersOfTenGenerator implements ProblemGenerator<
    PowerTenNotationProblem,
    PowersOfTenGeneratorConfig
> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = PowersOfTenGeneratorSchema;

    generate(config: PowersOfTenGeneratorConfig): ProblemStub<PowerTenNotationProblem> {
        validateConfigFields('powers-of-ten', config, []);
        const power = POWERS[Math.floor(random() * POWERS.length)]!;
        return {data: {kind: 'power-ten-notation', power}};
    }
}
