export function getComparisonSymbol(answer: string): string {
    if (answer === 'A') return '>';
    if (answer === 'B') return '<';
    if (answer === 'equal') return '=';
    return answer; // fallback if already a symbol
}
