import {random} from '../../../lib/random.ts';
import {
    ArithmeticOperationTablePatternProblem,
    ArithmeticPatternLawWitness,
    ArithmeticPatternOperation,
    ArithmeticRecurrencePatternProblem
} from '../../../types/problems.ts';

export type PatternTableTask = 'generate' | 'identify-feature' | undefined;

export type PatternLawPresentation = {
    name: 'Commutative property' | 'Associative property' | 'Distributive property';
    leftExpression: string;
    rightExpression: string;
    result: number;
};

export function selectMissingTermIndex(): number {
    return 2 + Math.floor(random() * 3);
}

export function selectTableFocusOperand(): number {
    return 2 + Math.floor(random() * 4);
}

export function getPatternTaskIdentity(task: PatternTableTask) {
    if (task === 'generate') {
        return {
            eyebrow: 'Number pattern',
            instruction: 'Follow the stated rule to generate the missing term.'
        };
    }
    if (task === 'identify-feature') {
        return {
            eyebrow: 'Classify the number pattern',
            instruction: 'Choose the pattern-feature category supported by the generated terms.'
        };
    }
    return {
        eyebrow: 'Classify the table pattern',
        instruction: 'Choose the pattern-rule category that classifies the highlighted row.'
    };
}

export function recurrenceOperation(
    data: ArithmeticRecurrencePatternProblem
): ArithmeticPatternOperation {
    return data.recurrence.kind === 'add-constant' ? 'addition' : 'multiplication';
}

export function recurrenceStart(data: ArithmeticRecurrencePatternProblem): number {
    return data.recurrence.kind === 'position-multiple' ? 0 : data.recurrence.start;
}

export function recurrenceRule(data: ArithmeticRecurrencePatternProblem): string {
    if (data.recurrence.kind === 'add-constant') {
        return `Add ${data.recurrence.operand} to get each next term.`;
    }
    if (data.recurrence.kind === 'multiply-constant') {
        return `Multiply by ${data.recurrence.operand} to get each next term.`;
    }
    return `Multiply each successive whole-number position by ${data.recurrence.factor}.`;
}

function parityDescription(value: number): 'odd' | 'even' {
    return value % 2 === 0 ? 'even' : 'odd';
}

export function lawPresentation(
    data: ArithmeticRecurrencePatternProblem
): PatternLawPresentation | undefined {
    const witness = data.lawWitness;
    if (!witness) return undefined;

    if (witness.law === 'commutative') {
        const operation = recurrenceOperation(data);
        const symbol = operation === 'addition' ? '+' : '×';
        const [left, right] = witness.operands;
        return {
            name: 'Commutative property',
            leftExpression: `${left} ${symbol} ${right}`,
            rightExpression: `${right} ${symbol} ${left}`,
            result: witness.result
        };
    }

    if (witness.law === 'associative') {
        const operation = recurrenceOperation(data);
        const symbol = operation === 'addition' ? '+' : '×';
        const [first, second, third] = witness.operands;
        return {
            name: 'Associative property',
            leftExpression: `(${first} ${symbol} ${second}) ${symbol} ${third}`,
            rightExpression: `${first} ${symbol} (${second} ${symbol} ${third})`,
            result: witness.result
        };
    }

    const [firstAddend, secondAddend] = witness.addends;
    return {
        name: 'Distributive property',
        leftExpression: `${witness.multiplier} × (${firstAddend} + ${secondAddend})`,
        rightExpression: `${witness.multiplier} × ${firstAddend} + ${witness.multiplier} × ${secondAddend}`,
        result: witness.result
    };
}

export function featureStatement(data: ArithmeticRecurrencePatternProblem): string {
    switch (data.emergentFeature.kind) {
        case 'alternating-parity':
            return 'The terms alternate between odd and even.';
        case 'even-after-start':
            return 'After the starting term, every term is even.';
        case 'operand-order-invariance': {
            const recurrence = data.recurrence;
            if (recurrence.kind === 'position-multiple') return 'Reversing the operands preserves each product.';
            return `At every step, reversing the current term and ${recurrence.operand} gives the same next term.`;
        }
        case 'two-step-recurrence': {
            const relation = data.recurrence.kind === 'add-constant'
                ? `${data.emergentFeature.combinedOperand} greater than`
                : `${data.emergentFeature.combinedOperand} times`;
            return `Every second term is ${relation} the term two positions before it.`;
        }
        case 'constant-difference':
            return `Each term is ${data.emergentFeature.difference} greater than the preceding term.`;
    }
}

export function featureEvidence(data: ArithmeticRecurrencePatternProblem): string {
    const {terms} = data;
    switch (data.emergentFeature.kind) {
        case 'alternating-parity':
            return terms.map(term => `${term} is ${parityDescription(term)}`).join('; ');
        case 'even-after-start':
            return `${terms.slice(1).join(', ')} are all even.`;
        case 'operand-order-invariance': {
            const presentation = lawPresentation(data)!;
            return `${presentation.leftExpression} = ${presentation.result} and ${presentation.rightExpression} = ${presentation.result}.`;
        }
        case 'two-step-recurrence':
            return `${terms[0]}, ${terms[2]}, and ${terms[4]} show the same two-step change of ${data.emergentFeature.combinedOperand}.`;
        case 'constant-difference': {
            const witness = data.lawWitness as Extract<ArithmeticPatternLawWitness, {law: 'distributive'}>;
            const column = witness.addends[0];
            return `${witness.multiplier} × ${column} = ${terms[column]} and ${witness.multiplier} × ${column + witness.addends[1]} = ${witness.result}.`;
        }
    }
}

export function featureExplanation(data: ArithmeticRecurrencePatternProblem): string {
    const evidence = featureEvidence(data);
    switch (data.emergentFeature.kind) {
        case 'alternating-parity': {
            const recurrence = data.recurrence as Extract<typeof data.recurrence, {kind: 'add-constant'}>;
            return `${evidence} Adding the odd number ${recurrence.operand} changes odd to even and even to odd at every step.`;
        }
        case 'even-after-start': {
            const recurrence = data.recurrence as Extract<typeof data.recurrence, {kind: 'multiply-constant'}>;
            return `${evidence} Multiplying any whole number by the even number ${recurrence.operand} produces an even number.`;
        }
        case 'operand-order-invariance': {
            const operation = recurrenceOperation(data);
            return `${evidence} The commutative property says the operands may be reversed without changing the ${operation === 'addition' ? 'sum' : 'product'}, so the same feature holds at every step.`;
        }
        case 'two-step-recurrence': {
            const presentation = lawPresentation(data)!;
            return `${evidence} The associative property rewrites ${presentation.leftExpression} as ${presentation.rightExpression}, combining every two consecutive steps into one equivalent change.`;
        }
        case 'constant-difference': {
            const presentation = lawPresentation(data)!;
            return `${evidence} The distributive property rewrites ${presentation.leftExpression} as ${presentation.rightExpression}. The extra product is always ${data.emergentFeature.difference}, so every next term is ${data.emergentFeature.difference} greater.`;
        }
    }
}

export function featureOptions(data: ArithmeticRecurrencePatternProblem): string[] {
    const answer = featureStatement(data);
    if (data.emergentFeature.kind === 'alternating-parity') {
        return [answer, 'Every term is odd.', 'Every term is even.'];
    }
    if (data.emergentFeature.kind === 'even-after-start') {
        return [answer, 'Every term is odd.', 'The terms alternate between odd and even.'];
    }
    return [answer, 'The terms stay the same.', 'There is no consistent relationship.'];
}

export function operationTableRule(
    data: ArithmeticOperationTablePatternProblem,
    focusOperand: number
): string {
    return `Increase by ${data.operation === 'addition' ? 1 : focusOperand}`;
}

export function isValidOperationTable(data: ArithmeticOperationTablePatternProblem): boolean {
    return (data.operation === 'addition' || data.operation === 'multiplication')
        && Array.isArray(data.operands)
        && data.operands.length === 7
        && data.operands.every((operand, index) => operand === index)
        && Array.isArray(data.values)
        && data.values.length === data.operands.length
        && data.values.every((row, rowIndex) => Array.isArray(row)
            && row.length === data.operands.length
            && row.every((value, columnIndex) => value === (data.operation === 'addition'
                ? data.operands[rowIndex]! + data.operands[columnIndex]!
                : data.operands[rowIndex]! * data.operands[columnIndex]!)));
}

const isSafeInteger = (value: unknown): value is number =>
    typeof value === 'number' && Number.isSafeInteger(value);

function validLawWitness(data: ArithmeticRecurrencePatternProblem): boolean {
    const witness: unknown = data.lawWitness;
    if (witness === undefined) return data.emergentFeature.kind === 'alternating-parity'
        || data.emergentFeature.kind === 'even-after-start';
    if (witness === null || typeof witness !== 'object' || !('law' in witness)) return false;

    const operation = recurrenceOperation(data);
    if (witness.law === 'commutative') {
        if (!('operands' in witness)
            || !Array.isArray(witness.operands)
            || witness.operands.length !== 2
            || witness.operands.some(value => !isSafeInteger(value))
            || !('result' in witness)
            || !isSafeInteger(witness.result)) return false;
        if (data.recurrence.kind === 'position-multiple') return false;
        const [left, right] = witness.operands;
        const result = operation === 'addition' ? left + right : left * right;
        return data.emergentFeature.kind === 'operand-order-invariance'
            && left === data.recurrence.start
            && right === data.recurrence.operand
            && witness.result === result
            && data.terms[1] === result;
    }
    if (witness.law === 'associative') {
        if (!('operands' in witness)
            || !Array.isArray(witness.operands)
            || witness.operands.length !== 3
            || witness.operands.some(value => !isSafeInteger(value))
            || !('result' in witness)
            || !isSafeInteger(witness.result)) return false;
        if (data.recurrence.kind === 'position-multiple') return false;
        const [first, second, third] = witness.operands;
        const result = operation === 'addition'
            ? first + second + third
            : first * second * third;
        return data.emergentFeature.kind === 'two-step-recurrence'
            && first === data.recurrence.start
            && second === data.recurrence.operand
            && third === data.recurrence.operand
            && witness.result === result
            && data.terms[2] === result;
    }
    if (witness.law !== 'distributive'
        || !('addends' in witness)
        || !Array.isArray(witness.addends)
        || witness.addends.length !== 2
        || witness.addends.some(value => !isSafeInteger(value))
        || !('multiplier' in witness)
        || !isSafeInteger(witness.multiplier)
        || !('result' in witness)
        || !isSafeInteger(witness.result)) return false;
    const [firstAddend, secondAddend] = witness.addends;
    return data.recurrence.kind === 'position-multiple'
        && data.emergentFeature.kind === 'constant-difference'
        && witness.multiplier === data.recurrence.factor
        && Number.isInteger(firstAddend)
        && firstAddend >= 1
        && secondAddend === 1
        && witness.result === witness.multiplier * (firstAddend + secondAddend)
        && data.terms[firstAddend + secondAddend] === witness.result;
}

export function isValidRecurrence(data: ArithmeticRecurrencePatternProblem): boolean {
    if (!data.recurrence
        || typeof data.recurrence !== 'object'
        || !data.emergentFeature
        || typeof data.emergentFeature !== 'object'
        || !Array.isArray(data.terms)
        || data.terms.length < 5
        || data.terms.length > 8
        || data.terms.some(term => !Number.isSafeInteger(term))) {
        return false;
    }

    const recurrence = data.recurrence;
    const followsRecurrence = recurrence.kind === 'position-multiple'
        ? Number.isSafeInteger(recurrence.factor)
            && recurrence.factor > 0
            && data.terms.every((term, index) => term === index * recurrence.factor)
        : Number.isSafeInteger(recurrence.start)
            && Number.isSafeInteger(recurrence.operand)
            && recurrence.operand > 0
            && data.terms[0] === recurrence.start
            && data.terms.slice(1).every((term, index) => term === (
                recurrence.kind === 'add-constant'
                    ? data.terms[index]! + recurrence.operand
                    : data.terms[index]! * recurrence.operand
            ));
    if (!followsRecurrence || !validLawWitness(data)) return false;

    switch (data.emergentFeature.kind) {
        case 'alternating-parity':
            return recurrence.kind === 'add-constant'
                && recurrence.operand % 2 === 1
                && data.terms.slice(1).every((term, index) => term % 2 !== data.terms[index]! % 2);
        case 'even-after-start':
            return recurrence.kind === 'multiply-constant'
                && recurrence.operand % 2 === 0
                && data.terms.slice(1).every(term => term % 2 === 0);
        case 'operand-order-invariance':
            return recurrence.kind !== 'position-multiple'
                && data.lawWitness?.law === 'commutative';
        case 'two-step-recurrence': {
            if (recurrence.kind === 'position-multiple') return false;
            const combined = recurrence.kind === 'add-constant'
                ? recurrence.operand * 2
                : recurrence.operand ** 2;
            return data.emergentFeature.combinedOperand === combined
                && data.lawWitness?.law === 'associative';
        }
        case 'constant-difference':
            return recurrence.kind === 'position-multiple'
                && data.emergentFeature.difference === recurrence.factor
                && data.lawWitness?.law === 'distributive';
        default:
            return false;
    }
}
