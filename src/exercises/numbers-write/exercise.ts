import "./exercise.scss";
import { getParams } from "../../lib/params.ts";

function getConfig() {
    const params = getParams(['number', 'outline']);
    return {
        number: parseInt(params.number || '5', 10),
        outline: params.outline === 'true',
    };
}

function createProblemHTML(number: number, isAnswer: boolean, outline: boolean) {
    const boxesHTML = Array.from({ length: 3 }, (_, i) => {
        let boxClass = 'writing-box';
        let content: number | string = '';

        if (isAnswer) {
            boxClass += ' answer';
            content = number;
        } else {
            if (outline) {
                boxClass += ' outline';
                content = number;
            } else {
                content = '';
            }
        }
        return `<div class="${boxClass}">${content}</div>`;
    }).join('');

    const tenFrameHTML = `
        <div class="ten-frame">
            ${Array.from({ length: 10 }, (_, i) => {
                const isFilled = isAnswer && i < number;
                const boxClass = isFilled ? 'ten-frame-box filled' : 'ten-frame-box';
                return `<div class="${boxClass}"></div>`;
            }).join('')}
        </div>`;

    return `
        <div class="problem-row">
            <div class="number-label">${number}</div>
            <div class="writing-boxes">${boxesHTML}</div>
            ${tenFrameHTML}
        </div>`;
}

const config = getConfig();
const exerciseContainer = document.getElementById('exercise');
const answerContainer = document.getElementById('answer');

if (exerciseContainer && answerContainer) {
    exerciseContainer.innerHTML = createProblemHTML(config.number, false, config.outline);
    answerContainer.innerHTML = createProblemHTML(config.number, true, config.outline);
}
