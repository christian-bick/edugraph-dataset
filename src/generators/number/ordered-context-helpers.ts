import {GeneratorValidationError} from '../../lib/errors.ts';
import {random} from '../../lib/random.ts';
import type {OrderedSignedContextMetadata, RationalOrderContextProblem, SignedContextObservation, SignedRational} from '../../types/problems.ts';
import {absoluteSignedRational, compareSignedRationals, isCanonicalSignedRational, makeSignedRational, negateSignedRational} from './signed-rational-helpers.ts';

const helperId = 'ordered-rational-contexts';
export type OrderedContextKind = OrderedSignedContextMetadata['kind'];
type OrderedContextPair = Omit<RationalOrderContextProblem, 'kind'>;
const contexts: readonly OrderedContextKind[] = ['temperature', 'elevation', 'balance'];
const metadata: {[Kind in OrderedContextKind]: Extract<OrderedSignedContextMetadata, {kind: Kind}>} = {
    temperature: {kind: 'temperature', reference: 'celsius-zero', unit: 'degrees-celsius'},
    elevation: {kind: 'elevation', reference: 'sea-level', unit: 'meters'},
    balance: {kind: 'balance', reference: 'settled-balance', unit: 'dollars'}
};
const randomInteger = (minimum: number, maximum: number): number => minimum + Math.floor(random() * (maximum - minimum + 1));
const observation = (id: string, value: SignedRational): SignedContextObservation => ({
    id, value: {...value}, magnitude: absoluteSignedRational(value),
    sign: value.numerator < 0 ? -1 : value.numerator > 0 ? 1 : 0
});

/** Preserve nominal observation roles and the shared physical datum; never sort the pair. */
export function buildOrderedContextPair(context: OrderedContextKind, first: SignedRational, second: SignedRational): OrderedContextPair {
    if (!Object.hasOwn(metadata, context)) {
        throw new GeneratorValidationError(helperId, 'Context must be temperature, elevation or balance.');
    }
    if (!isCanonicalSignedRational(first) || !isCanonicalSignedRational(second)) {
        throw new GeneratorValidationError(helperId, 'Both values must be canonical signed rationals.');
    }
    const comparison = compareSignedRationals(first, second);
    if (comparison === 0) throw new GeneratorValidationError(helperId, 'The two contextual values must be unequal.');
    return {context: {...metadata[context]}, first: observation('A', first), second: observation('B', second),
        relation: comparison < 0 ? 'less' : 'greater'};
}

/** Small exact contextual instances; balances use cent-compatible denominators. */
export function sampleOrderedContextPair(domain: 'unrestricted' | 'signed' | 'nonnegative'): OrderedContextPair {
    if (domain !== 'unrestricted' && domain !== 'signed' && domain !== 'nonnegative') {
        throw new GeneratorValidationError(helperId, 'Unsupported contextual sign domain.');
    }
    const context = contexts[randomInteger(0, contexts.length - 1)]!;
    const denominators = context === 'balance' ? [1, 2, 4, 5] : [1, 2, 3, 4, 5, 6];
    const denominator = denominators[randomInteger(0, denominators.length - 1)]!;
    const maximum = 10 * denominator;
    const pattern = domain === 'nonnegative' ? 4 : randomInteger(0, domain === 'signed' ? 3 : 4);
    let first: SignedRational;
    let second: SignedRational;
    if (pattern === 4) {
        const firstNumerator = randomInteger(0, maximum);
        const secondDraw = randomInteger(0, maximum - 1);
        first = makeSignedRational(firstNumerator, denominator);
        second = makeSignedRational(secondDraw >= firstNumerator ? secondDraw + 1 : secondDraw, denominator);
    } else {
        const numerator = randomInteger(1, maximum);
        const positive = makeSignedRational(numerator, denominator);
        first = negateSignedRational(positive);
        if (pattern === 1) second = positive;
        else if (pattern === 2) second = makeSignedRational(0, 1);
        else {
            const draw = randomInteger(1, maximum - 1);
            const other = makeSignedRational(draw >= numerator ? draw + 1 : draw, denominator);
            second = pattern === 0 ? negateSignedRational(other) : other;
        }
    }
    return random() < 0.5 ? buildOrderedContextPair(context, first, second) : buildOrderedContextPair(context, second, first);
}
