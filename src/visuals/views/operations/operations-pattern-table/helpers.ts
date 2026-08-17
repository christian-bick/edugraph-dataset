import {ArithmeticPatternRuleOperation} from '../../../../types/problems.ts';

export type PatternTableTask = 'generate' | 'identify-feature' | undefined;

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

export function hasConsistentRuleTerms(
    startValue: number,
    ruleOperation: ArithmeticPatternRuleOperation,
    ruleValue: number,
    terms: readonly number[]
): boolean {
    if (!Number.isSafeInteger(startValue)
        || !Number.isSafeInteger(ruleValue)
        || ruleValue < 1
        || !Array.isArray(terms)
        || terms.length < 4
        || terms.length > 8
        || terms.some(term => !Number.isSafeInteger(term))
        || terms[0] !== startValue) {
        return false;
    }

    if (ruleOperation === 'multiply-position') {
        return terms.every((term, index) => term === index * ruleValue);
    }

    return terms.slice(1).every((term, index) => {
        const previous = terms[index];
        if (ruleOperation === 'add') return term === previous + ruleValue;
        return term === previous * ruleValue;
    });
}
