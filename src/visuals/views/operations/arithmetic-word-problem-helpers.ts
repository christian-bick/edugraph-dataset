import {random, setSeed} from '../../../lib/random.ts';
import {ArithmeticProblem} from '../../../types/problems.ts';

export type UnknownPart = 'num1' | 'num2' | 'num3' | 'answer';

export type AppleGroupData = {
    label: 'A' | 'B' | 'C';
    part: Exclude<UnknownPart, 'answer'>;
    value: number;
};

export function getAppleGroups(data: ArithmeticProblem): AppleGroupData[] {
    const groups: AppleGroupData[] = [
        {label: 'A', part: 'num1', value: data.num1},
        {label: 'B', part: 'num2', value: data.num2}
    ];

    if (data.num3 !== undefined) {
        groups.push({label: 'C', part: 'num3', value: data.num3});
    }
    return groups;
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
            : selectUnknownPart(seed, true);
    }
    return invertProcedure ? 'num2' : 'answer';
}

export function getWordProblemText(data: ArithmeticProblem, unknownPart: UnknownPart): string {
    const {num1, num2, num3, answer, operation} = data;

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
            return `${num1} equal groups contain ${answer} apples altogether. How many apples are in each group?`;
        }
        return `There are ${num1} groups with ${num2} apples in each group. How many apples are there altogether?`;
    }

    if (unknownPart === 'num1') {
        return `Some apples are shared equally among ${num2} friends, giving each friend ${answer}. How many apples were shared?`;
    }
    if (unknownPart === 'num2') {
        return `${num1} apples are shared equally among some friends, giving each friend ${answer}. How many friends are there?`;
    }
    return `${num1} apples are shared equally among ${num2} friends. How many apples does each friend get?`;
}
