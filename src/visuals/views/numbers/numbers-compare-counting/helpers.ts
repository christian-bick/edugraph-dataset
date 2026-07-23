export function getIconIndexes(seed: number, iconsCount: number): { iconAIndex: number; iconBIndex: number } {
    const iconAIndex = seed % iconsCount;
    const iconBIndex = (iconAIndex + 3) % iconsCount;
    return { iconAIndex, iconBIndex };
}

export function getCorrectChoice(num1: number, num2: number, isFewerQuestion: boolean): 'A' | 'B' | 'equal' {
    if (num1 === num2) {
        return 'equal';
    }
    if (isFewerQuestion) {
        return num1 < num2 ? 'A' : 'B';
    } else {
        return num1 > num2 ? 'A' : 'B';
    }
}
