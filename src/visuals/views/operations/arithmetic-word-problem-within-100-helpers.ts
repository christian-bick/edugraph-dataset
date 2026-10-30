import {
    ArithmeticOperation,
    ArithmeticPairProblem,
    ArithmeticWordProblemRounding,
    ArithmeticWordProblemTwoStep,
    ArithmeticWordProblem
} from '../../../types/problems.ts';
import {ViewValidationError} from '../../helpers/validation.ts';

export type WordProblemPart = 'num1' | 'num2' | 'num3' | 'intermediate' | 'answer';

export type RoundingClaim = ArithmeticWordProblemRounding['proposal'] & {
    isReasonable: boolean;
};

/** Validate generator-owned mathematical evidence; only the verdict is derived by the view. */
export function resolveRoundingClaim(data: ArithmeticWordProblemRounding): RoundingClaim {
    const fail = (message: string): never => {throw new ViewValidationError('operations-word-problem-reasoning', message);};
    const domain = data.numberDomain;
    if (!domain || !Number.isSafeInteger(domain.min) || !Number.isSafeInteger(domain.max)
        || domain.min < 1 || domain.max > 1_000_000 || domain.min > domain.max) {
        return fail('Expected a bounded positive-integer rounding domain.');
    }
    const inDomain = (value: number) => Number.isSafeInteger(value) && value >= domain.min && value <= domain.max;
    if (!Array.isArray(data.operands) || data.operands.length !== 3
        || ![...data.operands, data.intermediate, data.answer, data.roundedAnswer].every(inDomain)
        || ![10, 100, 1000, 10000, 100000].includes(data.roundingPlace)
        || Math.round(data.answer / data.roundingPlace) * data.roundingPlace !== data.roundedAnswer) {
        return fail('The exact and rounded quantities must lie in their declared number domain.');
    }
    const proposal = data.proposal;
    if (!proposal || typeof proposal !== 'object' || Object.keys(proposal)
        .some(key => key !== 'proposedAnswer' && key !== 'roundedProposedAnswer')
        || !inDomain(proposal.proposedAnswer) || !inDomain(proposal.roundedProposedAnswer)
        || proposal.proposedAnswer === data.answer
        || Math.round(proposal.proposedAnswer / data.roundingPlace) * data.roundingPlace !== proposal.roundedProposedAnswer) {
        return fail('Expected a canonical bounded proposal and its consistent rounding.');
    }
    return {...proposal, isReasonable: proposal.roundedProposedAnswer === data.roundedAnswer};
}

export function isTwoStepProblem(
    data: ArithmeticWordProblem
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
        const items = unknown === 'num2'
            ? 'an unknown number of items'
            : `${second} ${noun(data.num2, 'item')}`;
        const result = unknown === 'answer'
            ? 'How many items are there altogether?'
            : `There ${data.answer === 1 ? 'is' : 'are'} ${data.answer} ${noun(data.answer, 'item')} altogether.`;
        return `There ${data.num1 === 1 ? 'is' : 'are'} ${first} equal ${noun(data.num1, 'group')} with ${items} in each group. ${result}`;
    }
    const groups = unknown === 'num2'
        ? 'an unknown number of groups'
        : `${second} ${noun(data.num2, 'group')}`;
    const result = unknown === 'answer'
        ? 'How many items are in each group?'
        : `There ${data.answer === 1 ? 'is' : 'are'} ${data.answer} ${noun(data.answer, 'item')} in each group.`;
    return `${first} ${noun(data.num1, 'item')} ${data.num1 === 1 ? 'is' : 'are'} shared equally among ${groups}. ${result}`;
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
