export function getTracePath(target: string): string {
    if (target === 'circle') return 'M 75 75 A 40 40 0 1 0 75 74.9';
    if (target === 'triangle') return 'M 50 10 L 90 90 L 10 90 Z';
    if (target === 'square') return 'M 10 10 L 90 10 L 90 90 L 10 90 Z';
    return '';
}
