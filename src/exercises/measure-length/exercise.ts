import "./exercise.scss";
import { getParams } from "../../lib/params.ts";
import { generateProblemSet, Problem } from "../../lib/measure-problems.ts";

function getConfig() {
    const params = getParams(['bandLength', 'decimal', 'reverse']);
    return {
        bandLength: parseInt(params.bandLength || '20', 10),
        decimal: params.decimal === 'true',
        reverse: params.reverse === 'true',
    };
}

function createMeasureBand(bandLength: number): string {
    let markers = '';
    for (let i = 0; i <= bandLength; i++) {
        markers += `<line x1="${i * 30}" y1="0" x2="${i * 30}" y2="20" stroke="black" stroke-width="1"/>`;
        markers += `<text x="${i * 30}" y="40" text-anchor="middle" font-size="12">${i}</text>`;

        if (i < bandLength) {
            for (let j = 1; j < 10; j++) {
                const y2 = (j === 5) ? 14 : 10;
                markers += `<line x1="${i * 30 + j * 3}" y1="0" x2="${i * 30 + j * 3}" y2="${y2}" stroke="black" stroke-width="0.5"/>`;
            }
        }
    }

    return `
        <svg class="measure-band" viewBox="0 0 ${bandLength * 30} 50" width="${bandLength * 30}" height="50">
            <rect x="0" y="0" width="${bandLength * 30}" height="20" fill="#f0f0f0" stroke="black" stroke-width="1"/>
            ${markers}
        </svg>
    `;
}

function createRectangle(length: number, color: string): string {
    const rectHeight = 20;
    const displayLength = length * 30;

    return `
        <svg class="measured-rectangle" viewBox="0 0 ${displayLength} ${rectHeight}" width="${displayLength}" height="${rectHeight}">
            <rect x="0" y="0" width="${displayLength}" height="${rectHeight}" fill="${color}"/>
        </svg>
    `;
}

function createProblemHTML(problem: Problem, config: { decimal: boolean, reverse: boolean }, color: string, isAnswer: boolean) {
    const measureBandHTML = createMeasureBand(problem.bandLength);
    
    // In reverse mode, if it's NOT the answer, we hide the rectangle.
    // In normal mode, if it's NOT the answer, we hide the text in the box.
    const showRectangle = !config.reverse || isAnswer;
    const showAnswerInBox = config.reverse || isAnswer;

    const rectColor = config.reverse ? 'forestgreen' : color;
    const rectangleHTML = showRectangle ? createRectangle(problem.problemLength, rectColor) : `<div style="height: 22px; width: ${problem.problemLength * 30}px"></div>`;

    const answer = config.decimal ? (problem.problemLength).toFixed(1) : (problem.problemLength * 10).toFixed(0);
    const unit = config.decimal ? 'cm' : 'mm';

    return `
        <div class="problem">
            <div class="measurement-container">
                ${rectangleHTML}
                ${measureBandHTML}
            </div>
            <div class="answer-box ${config.reverse ? 'reverse' : ''}" data-unit="${unit}">${showAnswerInBox ? answer : ''}</div>
        </div>`;
}

const config = getConfig();
const [problem] = generateProblemSet({ problemCount: 1, bandLength: config.bandLength });

const exerciseContainer = document.getElementById('exercise');
const answerContainer = document.getElementById('answer');

if (exerciseContainer && answerContainer) {
    const color = '#4682B4'; // SteelBlue
    exerciseContainer.innerHTML = createProblemHTML(problem, config, color, false);
    answerContainer.innerHTML = createProblemHTML(problem, config, color, true);
}
