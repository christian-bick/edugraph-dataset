import "./exercise.scss";
import { RenderPayload } from "../../types/ml-engine.ts";

function createMeasureBand(bandLength: number): string {
    const margin = 20;
    const width = bandLength * 30 + margin * 2;
    let markers = '';
    for (let i = 0; i <= bandLength; i++) {
        const x = i * 30 + margin;
        markers += `<line x1="${x}" y1="0" x2="${x}" y2="20" stroke="black" stroke-width="1"/>`;
        markers += `<text x="${x}" y="40" text-anchor="middle" font-size="12" fill="black">${i}</text>`;

        if (i < bandLength) {
            for (let j = 1; j < 10; j++) {
                const y2 = (j === 5) ? 14 : 10;
                markers += `<line x1="${x + j * 3}" y1="0" x2="${x + j * 3}" y2="${y2}" stroke="black" stroke-width="0.5"/>`;
            }
        }
    }

    return `
        <svg class="measure-band" viewBox="0 0 ${width} 50" width="${width}" height="50" style="overflow: visible;">
            <rect x="${margin}" y="0" width="${bandLength * 30}" height="20" fill="#f0f0f0" stroke="black" stroke-width="1"/>
            ${markers}
        </svg>
    `;
}

function createRectangle(length: number, color: string): string {
    const rectHeight = 20;
    const margin = 20; // Match the band margin
    const displayLength = length * 30;
    const width = displayLength + margin; // Only need left margin for alignment

    return `
        <svg class="measured-rectangle" viewBox="0 0 ${width} ${rectHeight}" width="${width}" height="${rectHeight}" style="overflow: visible;">
            <rect x="${margin}" y="0" width="${displayLength}" height="${rectHeight}" fill="${color}"/>
        </svg>
    `;
}

function createProblemHTML(data: any, visualParams: any, color: string, isAnswerView: boolean) {
    const isReverse = visualParams.reverse === true || visualParams.reverse === 'true';
    const isDecimal = visualParams.decimal === true || visualParams.decimal === 'true';

    const measureBandHTML = createMeasureBand(data.bandLength);
    
    const showRectangle = !isReverse || isAnswerView;
    const showAnswerInBox = isReverse || isAnswerView;
    const isTextSolution = !isReverse && isAnswerView;

    const rectColor = isReverse ? 'forestgreen' : color;
    const rectangleHTML = showRectangle ? createRectangle(data.problemLength, rectColor) : `<div style="height: 22px; width: ${data.problemLength * 30}px"></div>`;

    const answer = isDecimal ? (data.problemLength).toFixed(1) : (data.problemLength * 10).toFixed(0);
    const unit = isDecimal ? 'cm' : 'mm';

    let answerBoxClasses = 'answer-box';
    if (isReverse) answerBoxClasses += ' reverse';
    if (isTextSolution) answerBoxClasses += ' solution';

    return `
        <div class="problem">
            <div class="measurement-container">
                ${rectangleHTML}
                ${measureBandHTML}
            </div>
            <div class="${answerBoxClasses}" data-unit="${unit}">${showAnswerInBox ? answer : ''}</div>
        </div>`;
}

window.renderExercise = (payload: RenderPayload) => {
    const exerciseContainer = document.getElementById('exercise');
    
    if (exerciseContainer) {
        const { problem, config, isAnswerView } = payload;
        const color = '#4682B4'; // SteelBlue
        
        exerciseContainer.innerHTML = createProblemHTML(problem.data, config.visualParams, color, isAnswerView);

        const answerContainer = document.getElementById('answer');
        if (answerContainer) {
            answerContainer.style.display = 'none';
        }
    }
};
