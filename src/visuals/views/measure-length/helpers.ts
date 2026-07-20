export interface Tick {
    x: number;
    y2: number;
    strokeWidth: number;
    value?: number;
}

export function getRulerTicks(bandLength: number, margin = 20, pxPerUnit = 30): Tick[] {
    const ticks: Tick[] = [];
    
    let labelInterval = 1;
    let minorTickCount = 9; 
    
    if (bandLength > 50) {
        labelInterval = 10;
        minorTickCount = 0;
    } else if (bandLength > 20) {
        labelInterval = 5;
        minorTickCount = 0;
    } else if (bandLength > 12) {
        labelInterval = 1;
        minorTickCount = 1; 
    }

    for (let i = 0; i <= bandLength; i++) {
        const x = i * pxPerUnit + margin;
        const showLabel = (i % labelInterval === 0);
        
        ticks.push({
            x,
            y2: showLabel ? 20 : 14,
            strokeWidth: 1,
            value: showLabel ? i : undefined
        });

        if (i < bandLength && minorTickCount > 0) {
            if (minorTickCount === 9) {
                for (let j = 1; j < 10; j++) {
                    const y2 = (j === 5) ? 14 : 10;
                    ticks.push({
                        x: x + (j * pxPerUnit) / 10,
                        y2,
                        strokeWidth: 0.5
                    });
                }
            } else if (minorTickCount === 1) {
                ticks.push({
                    x: x + pxPerUnit / 2,
                    y2: 12,
                    strokeWidth: 0.5
                });
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
