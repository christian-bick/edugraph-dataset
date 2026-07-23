import {random, setSeed} from '../../../../lib/random.ts';

export function getBlankPart(seed: number, requestedBlank: string): string {
    setSeed(seed);
    
    switch (requestedBlank) {
        case 'problem': {
            const parts = ['num1', 'num2'];
            return parts[Math.floor(random() * parts.length)];
        }
        case 'problem-answer': {
            const parts = ['num1', 'num2', 'solution'];
            return parts[Math.floor(random() * parts.length)];
        }
        case 'operator':
            return 'symbol';
        case 'random': {
            const allParts = ['num1', 'num2', 'solution', 'symbol'];
            return allParts[Math.floor(random() * allParts.length)];
        }
        default:
            return requestedBlank;
        }
}
