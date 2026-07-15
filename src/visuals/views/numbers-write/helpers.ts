export function getTracingPaths(digit: string, xPos: number, yPos: number): string[] {
    if (digit === '1') {
        return [`M ${xPos} ${yPos - 25} L ${xPos} ${yPos - 5} M ${xPos - 4} ${yPos - 12} L ${xPos} ${yPos - 5} L ${xPos + 4} ${yPos - 12}`];
    } else if (digit === '0') {
        return [
            `M ${xPos + 8} ${yPos - 15} A 8 10 0 1 0 ${xPos + 8} ${yPos - 14}`,
            `M ${xPos + 8} ${yPos - 18} L ${xPos + 8} ${yPos - 15} L ${xPos + 5} ${yPos - 15}`
        ];
    } else if (digit === '2') {
        return [
            `M ${xPos - 8} ${yPos - 20} Q ${xPos} ${yPos - 28} ${xPos + 8} ${yPos - 20}`,
            `M ${xPos + 5} ${yPos - 23} L ${xPos + 8} ${yPos - 20} L ${xPos + 5} ${yPos - 17}`
        ];
    } else if (digit === '3') {
        return [
            `M ${xPos - 8} ${yPos - 22} Q ${xPos} ${yPos - 26} ${xPos + 6} ${yPos - 20}`,
            `M ${xPos + 3} ${yPos - 23} L ${xPos + 6} ${yPos - 20} L ${xPos + 3} ${yPos - 17}`
        ];
    } else if (digit === '4') {
        return [
            `M ${xPos - 6} ${yPos - 22} L ${xPos - 6} ${yPos - 12}`,
            `M ${xPos - 9} ${yPos - 16} L ${xPos - 6} ${yPos - 12} L ${xPos - 3} ${yPos - 16}`
        ];
    } else if (digit === '5') {
        return [
            `M ${xPos - 6} ${yPos - 22} L ${xPos - 6} ${yPos - 16}`,
            `M ${xPos - 9} ${yPos - 18} L ${xPos - 6} ${yPos - 16} L ${xPos - 3} ${yPos - 16}`
        ];
    } else if (digit === '6') {
        return [
            `M ${xPos + 6} ${yPos - 22} Q ${xPos - 6} ${yPos - 15} ${xPos - 6} ${yPos - 8}`,
            `M ${xPos - 9} ${yPos - 12} L ${xPos - 6} ${yPos - 8} L ${xPos - 3} ${yPos - 10}`
        ];
    } else if (digit === '7') {
        return [
            `M ${xPos - 8} ${yPos - 25} L ${xPos + 8} ${yPos - 25}`,
            `M ${xPos + 5} ${yPos - 28} L ${xPos + 8} ${yPos - 25} L ${xPos + 5} ${yPos - 22}`
        ];
    } else if (digit === '8') {
        return [
            `M ${xPos} ${yPos - 18} C ${xPos - 8} ${yPos - 25} ${xPos + 8} ${yPos - 25} ${xPos} ${yPos - 18}`,
            `M ${xPos - 3} ${yPos - 22} L ${xPos} ${yPos - 18} L ${xPos + 3} ${yPos - 21}`
        ];
    } else if (digit === '9') {
        return [
            `M ${xPos + 6} ${yPos - 18} A 6 6 0 1 0 ${xPos + 6} ${yPos - 17}`,
            `M ${xPos + 6} ${yPos - 20} L ${xPos + 6} ${yPos - 17} L ${xPos + 3} ${yPos - 17}`
        ];
    }
    return [];
}
