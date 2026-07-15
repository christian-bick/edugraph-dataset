export function getClosePositions(number: number, closeSpacing = 30): number[] {
    const closeStartX = 200 - ((number - 1) * closeSpacing) / 2;
    return Array.from({ length: number }, (_, i) => closeStartX + i * closeSpacing);
}

export function getFarPositions(number: number, farSpacing = 50): number[] {
    const farStartX = 200 - ((number - 1) * farSpacing) / 2;
    return Array.from({ length: number }, (_, i) => farStartX + i * farSpacing);
}
