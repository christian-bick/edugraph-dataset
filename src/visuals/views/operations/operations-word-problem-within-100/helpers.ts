import {
    ArithmeticPairProblem,
    ArithmeticWordProblemTwoStep,
    ArithmeticWordProblemWithin100
} from '../../../../types/problems.ts';

export type WordProblemPart = 'num1' | 'num2' | 'num3' | 'intermediate' | 'answer';

export function isTwoStepProblem(
    data: ArithmeticWordProblemWithin100
): data is ArithmeticWordProblemTwoStep {
    return 'kind' in data && data.kind === 'two-step';
}

export function getPairUnknown(data: ArithmeticPairProblem): WordProblemPart {
    return data.blankPart === 'solution' ? 'answer' : data.blankPart;
}

function quantity(value: number, useLengthContext: boolean): string {
    return useLengthContext ? `${value} cm` : `${value}`;
}

export function getWordProblemStory(
    data: ArithmeticWordProblemWithin100,
    useLengthContext: boolean
): string {
    if (isTwoStepProblem(data)) {
        const first = quantity(data.num1, useLengthContext);
        const second = quantity(data.num2, useLengthContext);
        const third = quantity(data.num3, useLengthContext);

        if (data.operations[0] === 'addition' && data.operations[1] === 'addition') {
            return `A class collected ${first} on Monday, ${second} on Tuesday, and ${third} on Wednesday. How many did they collect altogether?`;
        }
        if (data.operations[0] === 'subtraction' && data.operations[1] === 'subtraction') {
            return `A collection began with ${first}. Then ${second} were used, and later ${third} more were used. How many remain?`;
        }
        return `A collection began with ${first}. Then ${second} were added, and later ${third} were used. How many remain?`;
    }

    const unknown = getPairUnknown(data);
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

export function operationSymbol(operation: string): string {
    const symbols: Record<string, string> = {
        addition: '+',
        subtraction: '−',
        multiplication: '×',
        division: '÷'
    };
    return symbols[operation] ?? '';
}
