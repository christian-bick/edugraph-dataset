import {random, setSeed} from '../../../../lib/random.ts';
import {ArithmeticProblem} from '../../../../types/problems.ts';

export type UnknownPart = 'num1' | 'num2' | 'num3' | 'answer';

export function selectUnknownPart(seed: number, hasThirdAddend: boolean): UnknownPart {
    setSeed(seed);
    const parts: UnknownPart[] = hasThirdAddend
        ? ['num1', 'num2', 'num3', 'answer']
        : ['num1', 'num2', 'answer'];
    return parts[Math.floor(random() * parts.length)];
}

export function getWordProblemText(data: ArithmeticProblem, unknownPart: UnknownPart): string {
    const {num1, num2, num3, answer, operation} = data;

    if (operation === 'addition' && num3 !== undefined) {
        if (unknownPart === 'num1') {
            return `There are some red apples, ${num2} green apples, and ${num3} yellow apples. There are ${answer} apples altogether. How many are red?`;
        }
        if (unknownPart === 'num2') {
            return `There are ${num1} red apples, some green apples, and ${num3} yellow apples. There are ${answer} apples altogether. How many are green?`;
        }
        if (unknownPart === 'num3') {
            return `There are ${num1} red apples, ${num2} green apples, and some yellow apples. There are ${answer} apples altogether. How many are yellow?`;
        }
        return `There are ${num1} red apples, ${num2} green apples, and ${num3} yellow apples. How many apples are there altogether?`;
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
