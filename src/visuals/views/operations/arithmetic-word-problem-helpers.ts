import {random, setSeed} from '../../../lib/random.ts';
import {ArithmeticProblem} from '../../../types/problems.ts';

export type UnknownPart = 'num1' | 'num2' | 'num3' | 'answer';

export type WordProblemQuantity = {
    title: string;
    unit: 'apple' | 'group' | 'friend';
    part: UnknownPart;
    value: number;
};

type QuantityRole = readonly [title: string, unit: WordProblemQuantity['unit']];

/** Preserve each story quantity's unit; a friend or a group is not another apple amount. */
export function getWordProblemQuantities(data: ArithmeticProblem): WordProblemQuantity[] {
    const roles: Record<ArithmeticProblem['operation'], readonly QuantityRole[]> = data.num3 === undefined ? {
        addition: [['Starting apples', 'apple'], ['Added apples', 'apple'], ['Total apples', 'apple']],
        subtraction: [['Starting apples', 'apple'], ['Given away', 'apple'], ['Apples left', 'apple']],
        multiplication: [['Groups', 'group'], ['Apples per group', 'apple'], ['Total apples', 'apple']],
        division: [['Apples to share', 'apple'], ['Friends', 'friend'], ['Apples per friend', 'apple']]
    } : {
        addition: [['Red apples', 'apple'], ['Green apples', 'apple'], ['Yellow apples', 'apple'], ['Total apples', 'apple']],
        subtraction: [['Starting apples', 'apple'], ['First given away', 'apple'], ['Then given away', 'apple'], ['Apples left', 'apple']],
        multiplication: [['Crates', 'group'], ['Rows per crate', 'group'], ['Apples per row', 'apple'], ['Total apples', 'apple']],
        division: [['Apples to share', 'apple'], ['Teams', 'group'], ['Friends per team', 'friend'], ['Apples per friend', 'apple']]
    };
    const quantities: Array<readonly [UnknownPart, number]> = [['num1', data.num1], ['num2', data.num2]];
    if (data.num3 !== undefined) quantities.push(['num3', data.num3]);
    quantities.push(['answer', data.answer]);
    return quantities.map(([part, value], index) => {
        const [title, unit] = roles[data.operation][index]!;
        return {part, value, title, unit};
    });
}

export function selectUnknownPart(seed: number, hasThirdOperand: boolean): UnknownPart {
    setSeed(seed);
    const parts: UnknownPart[] = hasThirdOperand
        ? ['num1', 'num2', 'num3', 'answer']
        : ['num1', 'num2', 'answer'];
    return parts[Math.floor(random() * parts.length)];
}

export function selectUnknownOperandPart(
    seed: number,
    hasThirdOperand: boolean
): Exclude<UnknownPart, 'answer'> {
    setSeed(seed);
    const parts: Array<Exclude<UnknownPart, 'answer'>> = hasThirdOperand
        ? ['num1', 'num2', 'num3']
        : ['num1', 'num2'];
    return parts[Math.floor(random() * parts.length)];
}

export function getUnknownPart(
    data: ArithmeticProblem,
    seed: number,
    invertProcedure: boolean
): UnknownPart {
    if (data.num3 !== undefined) {
        return invertProcedure
            ? selectUnknownOperandPart(seed, true)
            : 'answer';
    }
    return invertProcedure ? 'num2' : 'answer';
}

export function getWordProblemText(data: ArithmeticProblem, unknownPart: UnknownPart): string {
    const {num1, num2, num3, answer, operation} = data;
    const apples = (count: number) => `${count} apple${count === 1 ? '' : 's'}`;
    const friends = (count: number) => `${count} friend${count === 1 ? '' : 's'}`;

    if (num3 !== undefined) {
        const values: Record<UnknownPart, number | string> = {
            num1: unknownPart === 'num1' ? 'some' : num1,
            num2: unknownPart === 'num2' ? 'some' : num2,
            num3: unknownPart === 'num3' ? 'some' : num3,
            answer: unknownPart === 'answer' ? 'how many' : answer
        };

        if (operation === 'addition') {
            return `There are ${values.num1} red apples, ${values.num2} green apples, and ${values.num3} yellow apples. There are ${values.answer} apples altogether. Find the unknown amount.`;
        }
        if (operation === 'subtraction') {
            return `Start with ${values.num1} apples, give away ${values.num2}, then give away ${values.num3}. There are ${values.answer} apples left. Find the unknown amount.`;
        }
        if (operation === 'multiplication') {
            return `There are ${values.num1} crates, with ${values.num2} rows in each crate and ${values.num3} apples in each row. There are ${values.answer} apples altogether. Find the unknown amount.`;
        }
        return `${values.num1} apples are shared among ${values.num2} teams, then each team's share is split among ${values.num3} friends. Each friend gets ${values.answer} apples. Find the unknown amount.`;
    }

    if (operation === 'addition') {
        if (unknownPart === 'num1') {
            return `You had some apples. After getting ${num2} more, you have ${answer}. How many apples did you start with?`;
        }
        if (unknownPart === 'num2') {
            return `You had ${num1} apples. After getting some more, you have ${answer}. How many apples did you get?`;
        }
        return `You have ${num1} apples and get ${num2} more. How many apples do you have altogether?`;
    }

    if (operation === 'subtraction') {
        if (unknownPart === 'num1') {
            return `You had some apples. After giving away ${num2}, you have ${answer} left. How many apples did you start with?`;
        }
        if (unknownPart === 'num2') {
            return `You had ${num1} apples. After giving some away, you have ${answer} left. How many apples did you give away?`;
        }
        return `You have ${num1} apples and give away ${num2}. How many apples are left?`;
    }

    if (operation === 'multiplication') {
        if (unknownPart === 'num1') {
            return `Some groups of ${num2} apples contain ${answer} apples altogether. How many groups are there?`;
        }
        if (unknownPart === 'num2') {
            return `${num1} equal group${num1 === 1 ? '' : 's'} contain${num1 === 1 ? 's' : ''} ${apples(answer)} altogether. How many apples are in each group?`;
        }
        return `There ${num1 === 1 ? 'is' : 'are'} ${num1} group${num1 === 1 ? '' : 's'} with ${apples(num2)} in each group. How many apples are there altogether?`;
    }

    if (unknownPart === 'num1') {
        return `Some apples are shared equally among ${friends(num2)}, giving each friend ${answer}. How many apples were shared?`;
    }
    if (unknownPart === 'num2') {
        return `${apples(num1)} ${num1 === 1 ? 'is' : 'are'} shared equally among some friends, giving each friend ${answer}. How many friends are there?`;
    }
    return `${apples(num1)} ${num1 === 1 ? 'is' : 'are'} shared equally among ${friends(num2)}. How many apples does each friend get?`;
}
