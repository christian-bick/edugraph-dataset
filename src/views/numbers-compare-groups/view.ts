import "./view.scss";
import { RenderPayload } from "../../types/ml-engine.ts";
import { setSeed } from "../../lib/random.ts";

const ICONS = ['circle.svg', 'square.svg', 'triangle.svg', 'star.svg', 'pentagon.svg', 'hexagon.svg', 'heart.svg', 'diamond.svg'];

function createProblemHTML(payload: RenderPayload, iconA: string, iconB: string) {
    const { problem, isSolutionView } = payload;
    const mode = problem.data.mode || 'count-compare';
    const num1 = problem.data.num1;
    const num2 = problem.data.num2;
    const comparisonType = problem.data.comparisonType || 'greater'; // 'greater' | 'less' | 'equal'

    const isFewerQuestion = comparisonType === 'less';
    const promptText = isFewerQuestion ? "Which group has fewer items?" : "Which group has more items?";

    // Render items in two columns for side-by-side comparison
    const maxCount = Math.max(num1, num2);
    const itemHeight = 35;
    const spacing = 42;
    const startY = 20;

    let itemsAHTML = '';
    for (let i = 0; i < num1; i++) {
        const y = startY + i * spacing;
        const isUnmatched = i >= num2 && num1 > num2;
        const highlightClass = (isUnmatched && isSolutionView && mode === 'matching') ? 'unmatched-highlight' : '';
        itemsAHTML += `
            <div class="positioned-item ${highlightClass}" style="top: ${y}px; left: 60px;">
                <img src="/icons/counting/${iconA}" alt="Group A object">
            </div>
        `;
    }

    let itemsBHTML = '';
    for (let i = 0; i < num2; i++) {
        const y = startY + i * spacing;
        const isUnmatched = i >= num1 && num2 > num1;
        const highlightClass = (isUnmatched && isSolutionView && mode === 'matching') ? 'unmatched-highlight' : '';
        itemsBHTML += `
            <div class="positioned-item ${highlightClass}" style="top: ${y}px; left: 240px;">
                <img src="/icons/counting/${iconB}" alt="Group B object">
            </div>
        `;
    }

    // Matching lines SVG
    let matchingLinesSVG = '';
    if (mode === 'matching') {
        const minCount = Math.min(num1, num2);
        let linesHTML = '';
        for (let i = 0; i < minCount; i++) {
            const y = startY + i * spacing + 18; // Center of 35px height
            linesHTML += `<line x1="100" y1="${y}" x2="240" y2="${y}" stroke="#94a3b8" stroke-width="2" stroke-dasharray="4 4" />`;
        }
        matchingLinesSVG = `
            <svg class="matching-lines-svg" style="height: ${(maxCount * spacing) + startY}px;">
                ${linesHTML}
            </svg>
        `;
    }

    // Determine correct choice
    let correctChoice = 'equal';
    if (num1 !== num2) {
        if (isFewerQuestion) {
            correctChoice = num1 < num2 ? 'A' : 'B';
        } else {
            correctChoice = num1 > num2 ? 'A' : 'B';
        }
    }

    const btnAClass = (correctChoice === 'A' && isSolutionView) ? 'choice-btn correct' : 'choice-btn';
    const btnBClass = (correctChoice === 'B' && isSolutionView) ? 'choice-btn correct' : 'choice-btn';
    const btnEqualClass = (correctChoice === 'equal' && isSolutionView) ? 'choice-btn correct' : 'choice-btn';

    return `
        <div class="problem-container">
            <div class="prompt-text">${promptText}</div>
            
            <div class="workspace-area" style="height: ${Math.max(220, (maxCount * spacing) + 40)}px;">
                <div class="column-title" style="left: 45px;">Group A</div>
                <div class="column-title" style="left: 225px;">Group B</div>
                
                <div class="items-area">
                    ${itemsAHTML}
                    ${itemsBHTML}
                    ${matchingLinesSVG}
                </div>
            </div>

            <div class="choices-container">
                <div class="${btnAClass}">Group A</div>
                <div class="${btnBClass}">Group B</div>
                <div class="${btnEqualClass}">They are equal</div>
            </div>
        </div>
    `;
}

window.renderView = (payload: RenderPayload) => {
    const exerciseContainer = document.getElementById('view');
    
    if (exerciseContainer) {
        const { problem, isSolutionView } = payload;
        
        // Seed randomness deterministically
        setSeed(problem.id);

        const iconAIndex = Array.from(problem.id).reduce((acc, char) => acc + char.charCodeAt(0), 0) % ICONS.length;
        const iconBIndex = (iconAIndex + 3) % ICONS.length; // Ensure different icons
        const iconA = ICONS[iconAIndex];
        const iconB = ICONS[iconBIndex];
        
        exerciseContainer.innerHTML = createProblemHTML(payload, iconA, iconB);

        const solutionContainer = document.getElementById('solution');
        if (solutionContainer) {
            solutionContainer.style.display = 'none';
        }
    }
};
