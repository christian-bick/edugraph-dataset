import "./exercise.scss";
import { getParams } from "../../lib/params.ts";
import { generateProblemSet, Problem } from "../../lib/time-problems.ts";

function getConfig() {
    const params = getParams(['interval', 'reverse']);
    return {
        interval: parseFloat(params.interval || '3600'),
        reverse: params.reverse === 'true',
    };
}

function formatTime(time: string, interval: number): string {
    const [h, m, s] = time.split(':').map(Number);
    const hour12 = h % 12 || 12;

    if (interval >= 60) {
        return `${hour12}:${String(m).padStart(2, '0')}`;
    }
    return `${hour12}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function createClock(time: string, interval: number, isEmpty: boolean, isSolution: boolean): string {
    const [h, m, s] = time.split(':').map(Number);
    const hourAngle = (h % 12 + m / 60) * 30;
    const minuteAngle = (m + s / 60) * 6;
    const secondAngle = s * 6;

    let hourMarks = '';
    for (let i = 0; i < 12; i++) {
        const angle = i * 30;
        const x = 50 + 40 * Math.sin(angle * Math.PI / 180);
        const y = 50 - 40 * Math.cos(angle * Math.PI / 180);
        hourMarks += `<circle cx="${x}" cy="${y}" r="2" fill="#333"/>`;
    }

    let minuteMarks = '';
    for (let i = 0; i < 60; i++) {
        if (i % 5 !== 0) {
            const angle = i * 6;
            const x = 50 + 41 * Math.sin(angle * Math.PI / 180);
            const y = 50 - 41 * Math.cos(angle * Math.PI / 180);
            minuteMarks += `<circle cx="${x}" cy="${y}" r="1" fill="#666"/>`;
        }
    }

    const handColorClass = isSolution ? 'solution' : '';
    const hourHand = isEmpty ? '' : `<line class="hand hour-hand ${handColorClass}" x1="50" y1="50" x2="50" y2="25" transform="rotate(${hourAngle} 50 50)"/>`;
    const minuteHand = isEmpty ? '' : `<line class="hand minute-hand ${handColorClass}" x1="50" y1="50" x2="50" y2="15" transform="rotate(${minuteAngle} 50 50)"/>`;
    const secondHand = (isEmpty || interval > 60) ? '' : `<line class="hand second-hand ${handColorClass}" x1="50" y1="50" x2="50" y2="10" transform="rotate(${secondAngle} 50 50)"/>`;

    return `
        <svg class="clock" viewBox="0 0 100 100" width="200" height="200">
            <circle class="face" cx="50" cy="50" r="45"/>
            ${hourMarks}
            ${minuteMarks}
            ${hourHand}
            ${minuteHand}
            ${secondHand}
        </svg>
    `;
}

function createProblemHTML(problem: Problem, isAnswer: boolean, interval: number, isReverse: boolean) {
    // In reverse mode, if it's NOT the answer, the clock is empty.
    // In normal mode, if it's NOT the answer, the time in the box is hidden.
    const showHands = !isReverse || isAnswer;
    const showTime = isReverse || isAnswer;

    // The solution is the clock hands if it's reverse mode and an answer.
    const isClockSolution = isReverse && isAnswer;
    
    // The solution is the text in the box if it's normal mode and an answer.
    const isTextSolution = !isReverse && isAnswer;

    const clockHTML = createClock(problem.time, interval, !showHands, isClockSolution);
    const formattedTime = formatTime(problem.time, interval);

    let answerBoxClasses = 'answer-box';
    if (isReverse) answerBoxClasses += ' reverse';
    if (isTextSolution) answerBoxClasses += ' solution';

    return `
        <div class="problem">
            ${clockHTML}
            <div class="${answerBoxClasses}">${showTime ? formattedTime : ''}</div>
        </div>`;
}

const config = getConfig();
const [problem] = generateProblemSet({ interval: config.interval, problemCount: 1 });

const exerciseContainer = document.getElementById('exercise');
const answerContainer = document.getElementById('answer');

if (exerciseContainer && answerContainer) {
    exerciseContainer.innerHTML = createProblemHTML(problem, false, config.interval, config.reverse);
    answerContainer.innerHTML = createProblemHTML(problem, true, config.interval, config.reverse);
}
