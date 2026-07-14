export function formatTime(time: string, interval: number): string {
    const [h, m, s] = time.split(':').map(Number);
    const hour12 = h % 12 || 12;

    if (interval >= 60) {
        return `${hour12}:${String(m).padStart(2, '0')}`;
    }
    return `${hour12}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export interface ClockAngles {
    hourAngle: number;
    minuteAngle: number;
    secondAngle: number;
}

export function getClockAngles(time: string): ClockAngles {
    const [h, m, s] = time.split(':').map(Number);
    const hourAngle = (h % 12 + m / 60) * 30;
    const minuteAngle = (m + s / 60) * 6;
    const secondAngle = s * 6;
    return { hourAngle, minuteAngle, secondAngle };
}

export interface TickMark {
    x: number;
    y: number;
    isFive: boolean;
}

export function getTickMarks(): TickMark[] {
    const marks: TickMark[] = [];
    // Hour marks (every 30 degrees, i.e. 5 minutes)
    for (let i = 0; i < 60; i++) {
        const angle = i * 6;
        const isFive = i % 5 === 0;
        const radius = isFive ? 40 : 41;
        const x = 50 + radius * Math.sin(angle * Math.PI / 180);
        const y = 50 - radius * Math.cos(angle * Math.PI / 180);
        marks.push({ x, y, isFive });
    }
    return marks;
}
