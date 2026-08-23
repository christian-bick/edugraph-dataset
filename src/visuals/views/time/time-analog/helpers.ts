const partsFromTime = (time: number | string) => {
    if (typeof time === 'string') {
        const [hour, minute, second] = time.split(':').map(Number);
        return {hour, minute, second};
    }
    return {
        hour: Math.floor(time / 3600),
        minute: Math.floor(time % 3600 / 60),
        second: time % 60
    };
};

export function formatTime(secondsSinceMidnight: number, intervalSeconds: number): string {
    const {hour, minute, second} = partsFromTime(secondsSinceMidnight);
    const hour12 = hour % 12 || 12;

    if (intervalSeconds >= 60) {
        return `${hour12}:${String(minute).padStart(2, '0')}`;
    }
    return `${hour12}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
}

export interface ClockAngles {
    hourAngle: number;
    minuteAngle: number;
    secondAngle: number;
}

export function getClockAngles(time: number | string): ClockAngles {
    const {hour, minute, second} = partsFromTime(time);
    const hourAngle = (hour % 12 + minute / 60) * 30;
    const minuteAngle = (minute + second / 60) * 6;
    const secondAngle = second * 6;
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
