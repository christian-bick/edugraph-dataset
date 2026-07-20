export function getComparisonSymbol(relation: string): string {
    if (relation === 'greater' || relation === 'A') return '>';
    if (relation === 'less' || relation === 'B') return '<';
    if (relation === 'equal') return '=';
    return relation;
}
