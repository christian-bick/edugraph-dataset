export interface Tick {
    x: number;
    y2: number;
    strokeWidth: number;
    value?: number;
}

export function getRulerTicks(bandLength: number, margin = 20): Tick[] {
    const ticks: Tick[] = [];
    for (let i = 0; i <= bandLength; i++) {
        const x = i * 30 + margin;
        // Major tick
        ticks.push({ x, y2: 20, strokeWidth: 1, value: i });

        if (i < bandLength) {
            for (let j = 1; j < 10; j++) {
                const y2 = (j === 5) ? 14 : 10;
                ticks.push({ x: x + j * 3, y2, strokeWidth: 0.5 });
            }
        }
    }
    return ticks;
}

export function formatMeasureAnswer(problemLength: number, isDecimal: boolean): { answer: string; unit: string } {
    const answer = isDecimal ? problemLength.toFixed(1) : (problemLength * 10).toFixed(0);
    const unit = isDecimal ? 'cm' : 'mm';
    return { answer, unit };
}
