import "./view.scss";
import { RenderPayload } from "../../types/ml-engine.ts";
import { setSeed } from "../../lib/random.ts";

const ICONS = ['circle.svg', 'square.svg', 'triangle.svg', 'star.svg', 'pentagon.svg', 'hexagon.svg', 'heart.svg', 'diamond.svg'];

function createProblemHTML(payload: RenderPayload, icon: string) {
    const { problem, isSolutionView } = payload;
    const mode = problem.data.mode || 'representation';
    let operation = problem.data.operation || 'addition';
    if (!problem.data.operation && problem.data.operator) {
        operation = problem.data.operator === 'subtract' ? 'subtraction' : 'addition';
    }

    const num1 = problem.data.num1 !== undefined ? problem.data.num1 : 5;
    const num2 = problem.data.num2 !== undefined ? problem.data.num2 : 3;
    const answer = problem.data.answer !== undefined ? problem.data.answer : (operation === 'addition' ? num1 + num2 : num1 - num2);
    const textScenario = problem.data.textScenario || '';

    let objectsHTML = '';
    const spacing = 45;

    if (operation === 'addition') {
        const total = num1 + num2;
        const startX = 225 - ((total - 1) * spacing) / 2;
        
        // Render num1 objects in rose/color A
        for (let i = 0; i < num1; i++) {
            const x = startX + i * spacing - 17.5;
            objectsHTML += `
                <div class="positioned-object color-a" style="left: ${x}px; top: 35px;">
                    <img src="/icons/counting/${icon}" alt="addend 1">
                </div>`;
        }
        // Render num2 objects in amber/color B
        for (let i = 0; i < num2; i++) {
            const x = startX + (num1 + i) * spacing - 17.5;
            objectsHTML += `
                <div class="positioned-object color-b" style="left: ${x}px; top: 35px;">
                    <img src="/icons/counting/${icon}" alt="addend 2">
                </div>`;
        }
    } else {
        // subtraction
        const startX = 225 - ((num1 - 1) * spacing) / 2;
        
        for (let i = 0; i < num1; i++) {
            const x = startX + i * spacing - 17.5;
            const isSubtracted = i >= (num1 - num2);
            
            let xOverlayHTML = '';
            if (isSubtracted) {
                xOverlayHTML = `
                    <svg class="subtraction-x" viewBox="0 0 40 40">
                        <line x1="6" y1="6" x2="34" y2="34" stroke="#ef4444" stroke-width="4" stroke-linecap="round"/>
                        <line x1="34" y1="6" x2="6" y2="34" stroke="#ef4444" stroke-width="4" stroke-linecap="round"/>
                    </svg>
                `;
            }

            objectsHTML += `
                <div class="positioned-object color-a ${isSubtracted ? 'subtracted' : ''}" style="left: ${x}px; top: 35px;">
                    <img src="/icons/counting/${icon}" alt="minuend item">
                    ${xOverlayHTML}
                </div>`;
        }
    }

    // Equation Blanks
    const sign = operation === 'addition' ? '+' : '-';
    
    const box1 = isSolutionView ? num1 : '';
    const box2 = isSolutionView ? num2 : '';
    const boxAnswer = isSolutionView ? answer : '';
    const solClass = isSolutionView ? 'solution' : '';

    return `
        <div class="problem-container">
            ${mode === 'word-problem' ? `<div class="scenario-text">${textScenario}</div>` : ''}
            
            <div class="workspace-area">
                ${objectsHTML}
            </div>

            <div class="equation-row">
                <div class="input-box ${solClass}">${box1}</div>
                <div class="operator">${sign}</div>
                <div class="input-box ${solClass}">${box2}</div>
                <div class="operator">=</div>
                <div class="input-box ${solClass} final-answer">${boxAnswer}</div>
            </div>
        </div>
    `;
}

window.renderView = (payload: RenderPayload) => {
    const exerciseContainer = document.getElementById('view');
    
    if (exerciseContainer) {
        const { problem } = payload;
        
        // Seed randomness deterministically
        setSeed(problem.id);

        const iconIndex = Array.from(problem.id).reduce((acc, char) => acc + char.charCodeAt(0), 0) % ICONS.length;
        const icon = ICONS[iconIndex];
        
        exerciseContainer.innerHTML = createProblemHTML(payload, icon);

        const solutionContainer = document.getElementById('solution');
        if (solutionContainer) {
            solutionContainer.style.display = 'none';
        }
    }
};
