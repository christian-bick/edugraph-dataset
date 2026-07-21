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
