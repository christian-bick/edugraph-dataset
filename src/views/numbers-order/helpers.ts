export function sortNumbers(numbers: number[], isDesc: boolean): number[] {
    return [...numbers].sort((a, b) => isDesc ? b - a : a - b);
}
