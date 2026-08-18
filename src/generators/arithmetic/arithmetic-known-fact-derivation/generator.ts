import {Ability, Scope} from 'edugraph-ts';
import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {
    KnownFactDerivationProblem,
    KnownMultiplicationFact
} from '../../../types/problems.ts';
import {
    ArithmeticKnownFactDerivationGeneratorConfig,
    ArithmeticKnownFactDerivationGeneratorSchema
} from './spec.ts';

type FactorPair = readonly [number, number];
type FactorTriple = readonly [number, number, number];

const positiveFactors = [2, 3, 4, 5, 6, 7, 8, 9] as const;

const randomItem = <T>(items: readonly T[]): T =>
    items[Math.floor(random() * items.length)]!;

const multiplicationFact = (firstFactor: number, secondFactor: number): KnownMultiplicationFact => ({
    firstFactor,
    secondFactor,
    product: firstFactor * secondFactor,
    equation: `${firstFactor} × ${secondFactor} = ${firstFactor * secondFactor}`
});

const validPairs = (maximumExclusive: number): FactorPair[] =>
    positiveFactors.flatMap(firstFactor =>
        positiveFactors
            .filter(secondFactor => firstFactor * secondFactor < maximumExclusive)
            .map(secondFactor => [firstFactor, secondFactor] as const)
    );

const validTriples = (maximumExclusive: number): FactorTriple[] =>
    positiveFactors.flatMap(firstFactor =>
        positiveFactors.flatMap(secondFactor =>
            positiveFactors
                .filter(thirdFactor => firstFactor * secondFactor * thirdFactor < maximumExclusive)
                .map(thirdFactor => [firstFactor, secondFactor, thirdFactor] as const)
        )
    );

const buildCommutativeProblem = (maximumExclusive: number): KnownFactDerivationProblem | null => {
    const pairs = validPairs(maximumExclusive).filter(([first, second]) => first !== second);
    if (pairs.length === 0) return null;

    const [firstFactor, secondFactor] = randomItem(pairs);
    const knownFact = multiplicationFact(firstFactor, secondFactor);
    const questionEquation = `${secondFactor} × ${firstFactor} = ?`;
    const solutionEquation = `${secondFactor} × ${firstFactor} = ${knownFact.product}`;

    return {
        task: 'known-fact-derivation',
        strategy: 'commutative',
        operation: 'multiplication',
        knownFact,
        derivedOperands: [secondFactor, firstFactor],
        answer: knownFact.product,
        prompt: `Use the known fact and the commutative property to solve ${questionEquation}`,
        questionEquation,
        solutionEquation,
        relationEquation: `${firstFactor} × ${secondFactor} = ${secondFactor} × ${firstFactor}`,
        explanation: `The commutative property changes the order of the factors without changing the product, so ${solutionEquation}.`
    };
};

const buildAssociativeProblem = (maximumExclusive: number): KnownFactDerivationProblem | null => {
    const triples = validTriples(maximumExclusive);
    if (triples.length === 0) return null;

    const [firstFactor, secondFactor, thirdFactor] = randomItem(triples);
    const knownFact = multiplicationFact(secondFactor, thirdFactor);
    const answer = firstFactor * knownFact.product;
    const questionEquation = `(${firstFactor} × ${secondFactor}) × ${thirdFactor} = ?`;
    const solutionEquation = `(${firstFactor} × ${secondFactor}) × ${thirdFactor} = ${answer}`;

    return {
        task: 'known-fact-derivation',
        strategy: 'associative',
        operation: 'multiplication',
        knownFact,
        derivedOperands: [firstFactor, secondFactor, thirdFactor],
        answer,
        prompt: `Use the known fact and the associative property to solve ${questionEquation}`,
        questionEquation,
        solutionEquation,
        relationEquation: `(${firstFactor} × ${secondFactor}) × ${thirdFactor} = ${firstFactor} × (${secondFactor} × ${thirdFactor})`,
        explanation: `The grouped factors give the known fact ${knownFact.equation}. Then multiply ${firstFactor} × ${knownFact.product} to get ${answer}.`
    };
};

const buildInverseDivisionProblem = (maximumExclusive: number): KnownFactDerivationProblem | null => {
    const pairs = validPairs(maximumExclusive);
    if (pairs.length === 0) return null;

    const [divisor, quotient] = randomItem(pairs);
    const knownFact = multiplicationFact(divisor, quotient);
    const questionEquation = `${knownFact.product} ÷ ${divisor} = ?`;
    const solutionEquation = `${knownFact.product} ÷ ${divisor} = ${quotient}`;

    return {
        task: 'known-fact-derivation',
        strategy: 'inverse-division',
        operation: 'division',
        knownFact,
        derivedOperands: [knownFact.product, divisor],
        answer: quotient,
        prompt: `Use the known multiplication fact to solve ${questionEquation}`,
        questionEquation,
        solutionEquation,
        relationEquation: `${divisor} × ? = ${knownFact.product}`,
        explanation: `Division asks for the missing factor. Since ${knownFact.equation}, ${solutionEquation}.`
    };
};

const buildPlaceValueScalingProblem = (maximumExclusive: number): KnownFactDerivationProblem | null => {
    const pairs = validPairs(Math.ceil(maximumExclusive / 10))
        .filter(([firstFactor, secondFactor]) => {
            const scaledFactor = secondFactor * 10;
            const scaledProduct = firstFactor * scaledFactor;
            return scaledFactor >= 10
                && scaledFactor < 100
                && scaledProduct < maximumExclusive;
        });
    if (pairs.length === 0) return null;

    const [firstFactor, baseFactor] = randomItem(pairs);
    const scaledFactor = baseFactor * 10;
    const knownFact = multiplicationFact(firstFactor, baseFactor);
    const answer = knownFact.product * 10;
    const questionEquation = `${firstFactor} × ${scaledFactor} = ?`;
    const solutionEquation = `${firstFactor} × ${scaledFactor} = ${answer}`;

    return {
        task: 'known-fact-derivation',
        strategy: 'place-value-scaling',
        operation: 'multiplication',
        knownFact,
        derivedOperands: [firstFactor, scaledFactor],
        answer,
        prompt: `Use the known one-digit fact and place-value scaling to solve ${questionEquation}`,
        questionEquation,
        solutionEquation,
        relationEquation: `${firstFactor} × ${scaledFactor} = (${firstFactor} × ${baseFactor}) × 10`,
        explanation: `${scaledFactor} is 10 times ${baseFactor}, so the known product ${knownFact.product} is also scaled by 10: ${knownFact.product} × 10 = ${answer}.`
    };
};

export class ArithmeticKnownFactDerivationGenerator implements ProblemGenerator<
    KnownFactDerivationProblem,
    ArithmeticKnownFactDerivationGeneratorConfig
> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = ArithmeticKnownFactDerivationGeneratorSchema;

    generate(
        config: ArithmeticKnownFactDerivationGeneratorConfig
    ): ProblemStub<KnownFactDerivationProblem> | null {
        validateConfigFields('arithmetic-known-fact-derivation', config, [
            'operation',
            'arity',
            'useCommutativeLaw',
            'useAssociativeLaw',
            'taskAbilities',
            'usePlaceValueScaling',
            'range'
        ]);

        const {
            operation,
            arity,
            useCommutativeLaw,
            useAssociativeLaw,
            taskAbilities,
            usePlaceValueScaling,
            range
        } = config;
        if (operation !== 'multiplication' && operation !== 'division') {
            throw new GeneratorValidationError(
                'arithmetic-known-fact-derivation',
                `Unsupported operation "${operation}".`
            );
        }
        if (arity !== Scope.TwoOperands && arity !== Scope.ThreeOperands) {
            throw new GeneratorValidationError(
                'arithmetic-known-fact-derivation',
                `Unsupported arity "${arity}".`
            );
        }

        const explicitStrategies = [
            useCommutativeLaw,
            useAssociativeLaw,
            taskAbilities!.includes(Ability.ProcedureInversion),
            usePlaceValueScaling
        ].filter(Boolean).length;
        if (explicitStrategies > 1) return null;
        if (useCommutativeLaw && (operation !== 'multiplication' || arity !== Scope.TwoOperands)) return null;
        if (useAssociativeLaw && (operation !== 'multiplication' || arity !== Scope.ThreeOperands)) return null;
        if (!taskAbilities!.includes(Ability.ProcedureUnderstanding)) return null;
        if (taskAbilities!.includes(Ability.ProcedureInversion)
            && (operation !== 'division' || arity !== Scope.TwoOperands)) return null;
        if (usePlaceValueScaling && (operation !== 'multiplication' || arity !== Scope.TwoOperands)) return null;
        if (arity === Scope.ThreeOperands && !useAssociativeLaw) return null;

        const maximumExclusive = Math.floor(range!.max);
        if (!Number.isSafeInteger(maximumExclusive) || maximumExclusive <= 1) return null;

        if (useAssociativeLaw) {
            const problem = buildAssociativeProblem(maximumExclusive);
            return problem ? {data: problem} : null;
        }
        if (usePlaceValueScaling) {
            const problem = buildPlaceValueScalingProblem(maximumExclusive);
            return problem ? {data: problem} : null;
        }
        if (operation === 'division') {
            const problem = buildInverseDivisionProblem(maximumExclusive);
            return problem ? {data: problem} : null;
        }

        const problem = buildCommutativeProblem(maximumExclusive);
        return problem ? {data: problem} : null;
    }
}
