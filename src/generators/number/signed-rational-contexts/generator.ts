import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {SignedRational, SignedRationalContextMetadata, SignedRationalContextProblem} from '../../../types/problems.ts';
import {absoluteSignedRational, isCanonicalSignedRational, makeSignedRational, negateSignedRational} from '../signed-rational-helpers.ts';
import {SignedRationalContextsGeneratorSchema, type SignedRationalContextsGeneratorConfig} from './spec.ts';
import {directedContextCaseCount, directedContextFrameAt} from './numeric-domain.ts';

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

export class SignedRationalContextsGenerator implements ProblemGenerator<SignedRationalContextProblem, SignedRationalContextsGeneratorConfig> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = SignedRationalContextsGeneratorSchema;

    generate(config: SignedRationalContextsGeneratorConfig): ProblemStub<SignedRationalContextProblem> {
        validateConfigFields(generatorId, config, ['relation']);
        if (config.relation !== 'reference-zero' && config.relation !== 'directed-pair') {
            throw new GeneratorValidationError(generatorId, 'Relation must be reference-zero or directed-pair.');
        }
        validateConfigFields(generatorId, config, ['range']);
        const range = config.range!;
        const count = directedContextCaseCount(range);
        if (count === 0 || config.relation === 'reference-zero' && (range.min !== 0 || range.max !== 5)) {
            throw new GeneratorValidationError(generatorId, 'Unsupported canonical range for this contextual relation.');
        }
        if (config.relation === 'reference-zero') {
            const context = contexts[randomInteger(0, contexts.length - 1)]!;
            return {data: buildSignedRationalContextProblem(context, [makeSignedRational(0, 1)])};
        }
        const frame = directedContextFrameAt(range, Math.floor(random() * count));
        const positive = makeSignedRational(frame.numerator, frame.denominator);
        const negativeMagnitude = frame.neighbor ? makeSignedRational(
            positive.numerator + (positive.numerator < 10 * positive.denominator ? 1 : -1), positive.denominator) : positive;
        const negative = negateSignedRational(negativeMagnitude);
        return {data: buildSignedRationalContextProblem(frame.context, frame.positiveFirst ? [positive, negative] : [negative, positive])};
    }
}
