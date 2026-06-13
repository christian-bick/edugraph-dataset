import { random } from "../../lib/random.ts";
import "./worksheet.scss";
import { getParams } from "../../lib/params.ts";

// --- CONFIGURATION ---
function getConfig() {
    const params = getParams(['order', 'outline']);
    return {
        order: params.order || 'default',
        boxesPerRow: 5,
        outline: params.outline === 'true',
    };
}

// --- HTML GENERATION ---
function createProblemRowHTML(number: number, numBoxes: number, isFirstRow: boolean, isAnswerKey: boolean, outline: boolean) {
    const boxesHTML = Array.from({ length: numBoxes }, (_, i) => {
        let boxClass = 'writing-box';
        let content: number | string = '';

        if (isAnswerKey) {
            boxClass += ' answer';
            content = number;
        } else {
            if (isFirstRow) {
                boxClass += ' example';
                content = number;
            } else {
                if (outline) {
                    boxClass += ' outline'; // Add outline class
                    content = number; // Show number in light grey
                } else {
                    content = ''; // Hide number
                }
            }
        }
        return `<div class="${boxClass}">${content}</div>`;
    }).join('');

    const tenFrameHTML = `
        <div class="ten-frame">
            ${Array.from({ length: 10 }, (_, i) => {
                const isFilled = isAnswerKey ? (i < number) : (isFirstRow && i < number);
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

// --- MAIN LOGIC ---
const config = getConfig();
const problemsContainer = document.getElementById('problems-container');
const answersContainer = document.getElementById('answers-container'); // Get answers container

if (problemsContainer && answersContainer) { // Check both containers
    let numbers = Array.from({ length: 9 }, (_, i) => i + 1);
    if (config.order === 'random') {
        numbers = numbers.sort(() => random() - 0.5);
    }

    numbers.forEach((number, index) => {
        const isFirstRow = index === 0;
        
        // For Worksheet
        const problemRowHTML = createProblemRowHTML(number, config.boxesPerRow, isFirstRow, false, config.outline); // isAnswerKey = false, pass outline
        problemsContainer.innerHTML += problemRowHTML;

        // For Answer Key
        const answerRowHTML = createProblemRowHTML(number, config.boxesPerRow, isFirstRow, true, config.outline); // isAnswerKey = true, pass outline
        answersContainer.innerHTML += answerRowHTML;
    });
}
