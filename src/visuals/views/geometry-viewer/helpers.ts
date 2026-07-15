export interface BallPosition {
    x: number;
    y: number;
}

export function getBallPosition(relation: string): BallPosition {
    let ballY = 90;
    let ballX = 130;
    if (relation === 'above') {
        ballY = 25;
    } else if (relation === 'below') {
        ballY = 150;
    } else if (relation === 'beside' || relation === 'nextTo') {
        ballY = 90;
        ballX = 200;
    }
    return { x: ballX, y: ballY };
}

export function getTracePath(target: string): string {
    if (target === 'circle') return 'M 75 75 A 40 40 0 1 0 75 74.9';
    if (target === 'triangle') return 'M 50 10 L 90 90 L 10 90 Z';
    if (target === 'square') return 'M 10 10 L 90 10 L 90 90 L 10 90 Z';
    return '';
}
