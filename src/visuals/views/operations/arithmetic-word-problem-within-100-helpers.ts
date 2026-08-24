import {
    ArithmeticOperation,
    ArithmeticPairProblem,
    ArithmeticWordProblemRounding,
    ArithmeticWordProblemTwoStep,
    ArithmeticWordProblemWithin100
} from '../../../types/problems.ts';

export type WordProblemPart = 'num1' | 'num2' | 'num3' | 'intermediate' | 'answer';

export type RoundingClaim = {
    proposedAnswer: number;
    roundedProposedAnswer: number;
    isReasonable: boolean;
};

/** Derives a bounded learner-facing claim from the canonical result-rounding relation. */
export function resolveRoundingClaim(
    data: ArithmeticWordProblemRounding,
    seed: number
): RoundingClaim {
    const normalizedSeed = Number.isFinite(seed) ? Math.abs(Math.trunc(seed)) : 0;
    const shouldBeReasonable = normalizedSeed % 2 === 0;
    const preferredDirection = Math.floor(normalizedSeed / 2) % 2 === 0 ? 1 : -1;
    const fineStep = Math.max(1, data.roundingPlace / 10);
    const baseDistances = shouldBeReasonable
        ? [1, fineStep, 2 * fineStep]
        : [data.roundingPlace, 2 * data.roundingPlace];
    const distances = [...new Set(baseDistances)];
    const rotation = Math.floor(normalizedSeed / 4) % distances.length;
    const rotatedDistances = [...distances.slice(rotation), ...distances.slice(0, rotation)];
    const maximumProposal = 10 * data.roundingPlace - 1;
    const candidates = rotatedDistances.flatMap(distance => [
        data.answer + preferredDirection * distance,
        data.answer - preferredDirection * distance
    ]);
    const proposedAnswer = candidates.find(candidate => {
        if (!Number.isInteger(candidate) || candidate < 1 || candidate > maximumProposal) {
            return false;
        }
        const roundedCandidate = Math.round(candidate / data.roundingPlace) * data.roundingPlace;
        return (roundedCandidate === data.roundedAnswer) === shouldBeReasonable;
    });

    if (proposedAnswer === undefined) {
        throw new Error('The rounded answer has no bounded reasonableness proposal.');
    }

    const roundedProposedAnswer = Math.round(proposedAnswer / data.roundingPlace)
        * data.roundingPlace;
    return {
        proposedAnswer,
        roundedProposedAnswer,
        isReasonable: roundedProposedAnswer === data.roundedAnswer
    };
}

export function isTwoStepProblem(
    data: ArithmeticWordProblemWithin100
): data is ArithmeticWordProblemTwoStep {
    return 'kind' in data && data.kind === 'two-step';
}

export function getPairUnknown(
    _data: ArithmeticPairProblem,
    invertProcedure: boolean
): WordProblemPart {
    return invertProcedure ? 'num2' : 'answer';
}

function quantity(value: number, useLengthContext: boolean): string {
    return useLengthContext ? `${value} cm` : `${value}`;
}

function noun(count: number, singular: string): string {
    return count === 1 ? singular : `${singular}s`;
}

export function getWordProblemStory(
    data: ArithmeticPairProblem | ArithmeticWordProblemTwoStep,
    useLengthContext: boolean,
    invertProcedure: boolean
): string {
    if (isTwoStepProblem(data)) {
        const first = quantity(data.num1, useLengthContext);
        const second = quantity(data.num2, useLengthContext);
        const third = quantity(data.num3, useLengthContext);

        const firstStep = data.operations[0] === 'addition'
            ? `A collection began with ${first} ${noun(data.num1, 'item')} and received ${second} more.`
            : data.operations[0] === 'subtraction'
                ? `A collection began with ${first} ${noun(data.num1, 'item')} and ${second} ${data.num2 === 1 ? 'was' : 'were'} removed.`
                : data.operations[0] === 'multiplication'
                    ? `A display has ${first} equal ${noun(data.num1, 'group')} with ${second} ${noun(data.num2, 'item')} in each group.`
                    : `${first} ${noun(data.num1, 'item')} ${data.num1 === 1 ? 'is' : 'are'} shared equally among ${second} ${noun(data.num2, 'group')}.`;
        const secondStep = data.operations[1] === 'addition'
            ? `Then ${third} more ${noun(data.num3, 'item')} ${data.num3 === 1 ? 'is' : 'are'} added.`
            : data.operations[1] === 'subtraction'
                ? `Then ${third} ${noun(data.num3, 'item')} ${data.num3 === 1 ? 'is' : 'are'} removed.`
                : data.operations[1] === 'multiplication'
                    ? `Then each item is replaced by a pack of ${third} ${noun(data.num3, 'item')}.`
                    : `Then the result is shared equally among ${third} ${noun(data.num3, 'team')}.`;
        return `${firstStep} ${secondStep} How many items does the story end with?`;
    }

    const unknown = getPairUnknown(data, invertProcedure);
    const first = unknown === 'num1' ? 'an unknown amount' : quantity(data.num1, useLengthContext);
    const second = unknown === 'num2' ? 'an unknown amount' : quantity(data.num2, useLengthContext);
    if (useLengthContext) {
        if (data.operation === 'addition') {
            const result = unknown === 'answer'
                ? 'How long are they altogether?'
                : `Together they are ${quantity(data.answer, true)} long.`;
            return `One ribbon is ${first} long and another is ${second} long. ${result}`;
        }
        if (data.operation === 'subtraction') {
            const result = unknown === 'answer'
                ? 'How long is the ribbon now?'
                : `The ribbon is ${quantity(data.answer, true)} long now.`;
            return `A ribbon is ${first} long. After ${second} is cut off, ${result}`;
        }
    }

    const answer = unknown === 'answer'
        ? 'How many are there now?'
        : `There are ${quantity(data.answer, false)} now.`;

    if (data.operation === 'addition') {
        return `A shelf has ${first} books. ${second} more books are added. ${answer}`;
    }
    if (data.operation === 'subtraction') {
        return `A shelf has ${first} books. ${second} books are removed. ${answer}`;
    }
    if (data.operation === 'multiplication') {
        return `There are ${first} equal groups with ${second} items in each group. ${answer}`;
    }
    return `${first} items are shared equally among ${second} groups. ${answer}`;
}

export function operationSymbol(operation: ArithmeticOperation): string {
    const symbols: Record<ArithmeticOperation, string> = {
        addition: '+',
        subtraction: '−',
        multiplication: '×',
        division: '÷'
    };
    return symbols[operation];
}
