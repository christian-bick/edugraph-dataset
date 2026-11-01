import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {CommonDivisorWitness, CommonFactorMultipleProblem} from '../../../types/problems.ts';
import {commonPositiveDivisors} from '../common-factor-helpers.ts';
import {CommonFactorMultipleRelationsGeneratorSchema, type CommonFactorMultipleRelationsGeneratorConfig} from './spec.ts';
import {commonRelationDomain} from './domain.ts';

const generatorId = 'common-factor-multiple-relations';

/** Both relations are canonical data, including their distinct zero boundaries. */
export function buildCommonFactorMultipleProblem(first: number, second: number): CommonFactorMultipleProblem {
    if (![first, second].every(value => Number.isSafeInteger(value) && value >= 0 && value <= 100 && !Object.is(value, -0))) {
        throw new GeneratorValidationError(generatorId, 'Inputs must be canonical whole numbers from 0 through 100.');
    }
    let gcd: CommonDivisorWitness;
    if (first === 0 && second === 0) gcd = {kind: 'undefined-zero-pair'};
    else {
        const commonDivisors = commonPositiveDivisors(first, second);
        const value = commonDivisors.at(-1)!;
        gcd = {kind: 'defined', value, commonDivisors,
            cofactors: [first / value, second / value],
            // Dividing both inputs by their greatest common divisor leaves coprime cofactors.
            cofactorCommonDivisors: [1]};
    }
    const inputs = [first, second] as const;
    if (first === 0 || second === 0) {
        const zeroInputIndices: (0 | 1)[] = [];
        if (first === 0) zeroInputIndices.push(0);
        if (second === 0) zeroInputIndices.push(1);
        return {kind: 'common-factor-multiple-relations', inputs, gcd,
            lcm: {kind: 'zero-extension', value: 0, zeroInputIndices, zeroProducts: [0, 0]}};
    }
    // Positive inputs ensure the defined branch and its supplied coprime cofactors.
    const definedGcd = gcd as Extract<CommonDivisorWitness, {kind: 'defined'}>;
    const [firstCofactor, secondCofactor] = definedGcd.cofactors;
    const commonMultipliers = [secondCofactor, firstCofactor] as const;
    const commonProducts = [first * secondCofactor, second * firstCofactor] as const;
    return {kind: 'common-factor-multiple-relations', inputs, gcd,
        lcm: {kind: 'positive', value: commonProducts[0], commonMultipliers, commonProducts}};
}

export class CommonFactorMultipleRelationsGenerator implements ProblemGenerator<CommonFactorMultipleProblem, CommonFactorMultipleRelationsGeneratorConfig> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = CommonFactorMultipleRelationsGeneratorSchema;

    generate(config: CommonFactorMultipleRelationsGeneratorConfig): ProblemStub<CommonFactorMultipleProblem> {
        validateConfigFields(generatorId, config, ['profile']);
        const candidates = commonRelationDomain(config.profile!);
        let position = random() * candidates.reduce((sum, candidate) => sum + candidate.weight, 0);
        const selected = candidates.find(candidate => {
            if (position < candidate.weight) return true;
            position -= candidate.weight;
            return false;
        }) ?? candidates.at(-1)!;
        const [first, second] = selected.inputs;
        return {data: buildCommonFactorMultipleProblem(first, second)};
    }
}
