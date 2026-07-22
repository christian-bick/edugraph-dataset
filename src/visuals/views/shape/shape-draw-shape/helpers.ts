export function getTracePath(target: string): string {
    if (target === 'circle') return 'M 50 18 A 32 32 0 1 0 50 17.9 Z';
    if (target === 'triangle') return 'M 50 15 L 85 85 L 15 85 Z';
    if (target === 'square') return 'M 15 15 L 85 15 L 85 85 L 15 85 Z';
    if (target === 'rectangle') return 'M 15 25 L 85 25 L 85 75 L 15 75 Z';
    return '';
}
