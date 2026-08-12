import {CurrencyArithmeticProblem} from '../../../../types/problems.ts';

export function formatCurrency(cents: number, forceDollars = false): string {
    if (!forceDollars && cents < 100) return `${cents}¢`;
    return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

export function currencyStory(problem: CurrencyArithmeticProblem): string {
    const forceDollars = problem.amounts.some(amount => amount.items.some(item => item.kind === 'banknote'));
    const first = formatCurrency(problem.amounts[0].totalCents, forceDollars);
    const second = formatCurrency(problem.amounts[1].totalCents, forceDollars);
    return problem.operation === 'addition'
        ? `Maya has ${first}. She receives ${second} more. How much money does she have now?`
        : `Maya has ${first}. She spends ${second}. How much money does she have left?`;
}
