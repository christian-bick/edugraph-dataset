import { random } from "./random.ts";
export interface Problem {
    time: string;
}

export function generateProblemSet(config: { interval: number, problemCount: number }): Problem[] {
    const problems = new Set<string>();
    const dayInSeconds = 24 * 3600;

    while (problems.size < config.problemCount) {
        const randomSeconds = Math.floor(random() * dayInSeconds);
        const roundedSeconds = Math.round(randomSeconds / config.interval) * config.interval;

        const hour = Math.floor(roundedSeconds / 3600) % 24;
        const minute = Math.floor((roundedSeconds % 3600) / 60);
        const second = roundedSeconds % 60;

        const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
        problems.add(time);
    }

    return Array.from(problems).map(time => ({ time }));
}
