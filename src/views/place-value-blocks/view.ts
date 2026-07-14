import "./view.scss";
import { RenderPayload } from "../../types/ml-engine.ts";
import { setSeed } from "../../lib/random.ts";

function createTenFrameHTML(filledCount: number, colorClass: string) {
    return `
        <div class="ten-frame">
            ${Array.from({ length: 10 }, (_, i) => {
                const isFilled = i < filledCount;
                const boxClass = isFilled ? `ten-frame-box filled ${colorClass}` : 'ten-frame-box';
                return `<div class="${boxClass}"></div>`;
            }).join('')}
        </div>`;
}

function createProblemHTML(payload: RenderPayload) {
    const { problem, isSolutionView } = payload;
    const mode = problem.data.mode || 'compose-teen';
    
    let target = problem.data.target !== undefined ? problem.data.target : 14;
    let ones = problem.data.ones !== undefined ? problem.data.ones : 4;

    // Ensure within teen range
    if (target < 10 || target > 20) {
        target = 14;
        ones = 4;
    }

    const tenFrame1HTML = createTenFrameHTML(10, 'color-a');
    const tenFrame2HTML = createTenFrameHTML(ones, 'color-b');

    let equationHTML = '';
    const solClass = isSolutionView ? 'solution' : '';

    if (mode === 'compose-teen') {
        // 10 + ones = [target]
        const targetVal = isSolutionView ? target : '';
        equationHTML = `
            <div class="equation-row">
                <span class="eq-num">10</span>
                <span class="eq-op">+</span>
                <span class="eq-num">${ones}</span>
                <span class="eq-op">=</span>
                <div class="input-box ${solClass}">${targetVal}</div>
            </div>
        `;
    } else {
        // decompose-teen: target = 10 + [ones]
        const onesVal = isSolutionView ? ones : '';
        equationHTML = `
            <div class="equation-row">
                <span class="eq-num">${target}</span>
                <span class="eq-op">=</span>
                <span class="eq-num">10</span>
                <span class="eq-op">+</span>
                <div class="input-box ${solClass}">${onesVal}</div>
            </div>
        `;
    }

    return `
        <div class="problem-container">
            <div class="prompt-text">${mode === 'compose-teen' ? 'How many dots are there in total?' : 'Decompose the teen number.'}</div>
            
            <div class="double-ten-frame-area">
                <div class="frame-container">
                    <div class="frame-label">10 ones</div>
                    ${tenFrame1HTML}
                </div>
                <div class="frame-container">
                    <div class="frame-label">${ones} ones</div>
                    ${tenFrame2HTML}
                </div>
            </div>

            ${equationHTML}
        </div>
    `;
}

window.renderView = (payload: RenderPayload) => {
    const exerciseContainer = document.getElementById('view');
    
    if (exerciseContainer) {
        const { problem } = payload;
        
        // Seed randomness deterministically
        setSeed(problem.id);

        exerciseContainer.innerHTML = createProblemHTML(payload);

        const solutionContainer = document.getElementById('solution');
        if (solutionContainer) {
            solutionContainer.style.display = 'none';
        }
    }
};
