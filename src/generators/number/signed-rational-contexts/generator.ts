import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {SignedRational, SignedRationalContextMetadata, SignedRationalContextProblem} from '../../../types/problems.ts';
import {absoluteSignedRational, isCanonicalSignedRational, makeSignedRational, negateSignedRational} from '../signed-rational-helpers.ts';
import {SignedRationalContextsGeneratorSchema, type SignedRationalContextsGeneratorConfig} from './spec.ts';

const generatorId = 'signed-rational-contexts';
type ContextKind = SignedRationalContextMetadata['kind'];
const metadata: {[Kind in ContextKind]: Extract<SignedRationalContextMetadata, {kind: Kind}>} = {
    temperature: {kind: 'temperature', reference: 'celsius-zero', unit: 'degrees-celsius'},
    elevation: {kind: 'elevation', reference: 'sea-level', unit: 'meters'},
    balance: {kind: 'balance', reference: 'settled-balance', unit: 'dollars'},
    charge: {kind: 'charge', reference: 'neutral-net-charge', unit: 'coulombs'}
};
const contexts: readonly ContextKind[] = ['temperature', 'elevation', 'balance', 'charge'];
const randomInteger = (minimum: number, maximum: number): number => minimum + Math.floor(random() * (maximum - minimum + 1));

/** Semantic context and exact signed quantities, independent of any requested learner action. */
export function buildSignedRationalContextProblem(context: ContextKind, values: readonly SignedRational[]): SignedRationalContextProblem {
    if (!Object.hasOwn(metadata, context)) {
        throw new GeneratorValidationError(generatorId, 'Context must be temperature, elevation, balance or charge.');
    }
    if (!Array.isArray(values) || values.length === 0 || !Array.from(values).every(isCanonicalSignedRational)) {
        throw new GeneratorValidationError(generatorId, 'Supply a nonempty array of canonical signed rationals.');
    }
    const observations = values.map((value, index) => ({
        id: index === 0 ? 'A' : index === 1 ? 'B' : `V${index + 1}`,
        value: {...value},
        magnitude: absoluteSignedRational(value),
        sign: value.numerator < 0 ? -1 as const : value.numerator > 0 ? 1 as const : 0 as const
    }));
    return {kind: 'signed-rational-contexts', context: {...metadata[context]},
        observations: [observations[0]!, ...observations.slice(1)]};
}

function sampleDirectedPair(context: ContextKind): readonly SignedRational[] {
    // Dollar balances use exact cent-compatible fractions; the pure contract stays rational.
    const denominators = context === 'balance' ? [1, 2, 4, 5] : [1, 2, 3, 4, 5, 6];
    const denominator = denominators[randomInteger(0, denominators.length - 1)]!;
    const positive = makeSignedRational(randomInteger(1, 10 * denominator), denominator);
    // A neighboring positive rational gives an unequal pair constructively, without retries.
    const negativeMagnitude = random() < 0.5 ? positive : makeSignedRational(
        positive.numerator + (positive.numerator < 10 * positive.denominator ? 1 : -1), positive.denominator);
    const negative = negateSignedRational(negativeMagnitude);
    return random() < 0.5 ? [positive, negative] : [negative, positive];
}

export class SignedRationalContextsGenerator implements ProblemGenerator<SignedRationalContextProblem, SignedRationalContextsGeneratorConfig> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = SignedRationalContextsGeneratorSchema;

    generate(config: SignedRationalContextsGeneratorConfig): ProblemStub<SignedRationalContextProblem> {
        validateConfigFields(generatorId, config, ['relation']);
        if (config.relation !== 'reference-zero' && config.relation !== 'directed-pair') {
            throw new GeneratorValidationError(generatorId, 'Relation must be reference-zero or directed-pair.');
        }
        const context = contexts[randomInteger(0, contexts.length - 1)]!;
        const values = config.relation === 'reference-zero' ? [makeSignedRational(0, 1)] : sampleDirectedPair(context);
        return {data: buildSignedRationalContextProblem(context, values)};
    }
}
