export function sortNumbers(numbers: readonly number[], isDesc?: boolean): number[] {
    return [...numbers].sort((a, b) => isDesc ? b - a : a - b);
}

export function presentNumbers(numbers: readonly number[], seed: number): number[] {
    const presented = [...numbers];
    let state = (Number.isFinite(seed) ? Math.abs(Math.trunc(seed)) : 0) >>> 0;
    for (let index = presented.length - 1; index > 0; index--) {
        state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
        const swapIndex = state % (index + 1);
        [presented[index], presented[swapIndex]] = [presented[swapIndex]!, presented[index]!];
    }
    return presented;
}
