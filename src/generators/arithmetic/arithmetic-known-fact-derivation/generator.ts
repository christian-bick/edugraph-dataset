import {Scope} from 'edugraph-ts';
import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {KnownFactDerivationProblem} from '../../../types/problems.ts';
import {ArithmeticKnownFactDerivationGeneratorConfig, ArithmeticKnownFactDerivationGeneratorSchema} from './spec.ts';
import {knownFactDomain, knownFactStrategy} from './domain.ts';

export class ArithmeticKnownFactDerivationGenerator implements ProblemGenerator<KnownFactDerivationProblem, ArithmeticKnownFactDerivationGeneratorConfig> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = ArithmeticKnownFactDerivationGeneratorSchema;

    generate(config: ArithmeticKnownFactDerivationGeneratorConfig): ProblemStub<KnownFactDerivationProblem> | null {
        validateConfigFields('arithmetic-known-fact-derivation', config, [
            'operation', 'arity', 'useCommutativeLaw', 'useAssociativeLaw', 'usePlaceValueScaling', 'range'
        ]);
        const {operation, arity, useCommutativeLaw, useAssociativeLaw, usePlaceValueScaling, range} = config;
        if (operation !== 'multiplication' && operation !== 'division') {
            throw new GeneratorValidationError('arithmetic-known-fact-derivation', `Unsupported operation "${operation}".`);
        }
        if (arity !== Scope.TwoOperands && arity !== Scope.ThreeOperands) {
            throw new GeneratorValidationError('arithmetic-known-fact-derivation', `Unsupported arity "${arity}".`);
        }
        const strategy = knownFactStrategy(operation, arity === Scope.TwoOperands ? 2 : 3,
            useCommutativeLaw!, useAssociativeLaw!, usePlaceValueScaling!);
        if (!strategy) return null;
        const candidates = knownFactDomain(strategy, range!);
        if (!candidates.length) return null;
        const selected = candidates[Math.floor(random() * candidates.length)]!;
        return {data: {...selected, knownFact: {...selected.knownFact}, derivedOperands: [...selected.derivedOperands]}};
    }
}
