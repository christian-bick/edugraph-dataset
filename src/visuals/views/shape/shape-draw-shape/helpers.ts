export function getTracePath(target: string): string {
    if (target === 'circle') return 'M 50 15 A 35 35 0 1 0 50 14.9 Z';
    if (target === 'triangle') return 'M 50 10 L 90 90 L 10 90 Z';
    if (target === 'square') return 'M 10 10 L 90 10 L 90 90 L 10 90 Z';
    if (target === 'rectangle') return 'M 10 25 L 90 25 L 90 75 L 10 75 Z';
    return '';
}
