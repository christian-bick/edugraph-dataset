import "./view.scss";
import { RenderPayload } from "../../types/ml-engine.ts";
import { setSeed, random } from "../../lib/random.ts";

interface Item {
    shape: string; // circle, square, triangle
    color: string; // red, blue, green
}

const COLOR_MAP: Record<string, string> = {
    red: '#ef4444',
    blue: '#3b82f6',
    green: '#10b981'
};

function renderItemSVG(item: Item): string {
    const fill = COLOR_MAP[item.color] || '#334155';
    if (item.shape === 'square') {
        return `<svg width="40" height="40" viewBox="0 0 40 40"><rect x="4" y="4" width="32" height="32" rx="4" fill="${fill}" stroke="#1e293b" stroke-width="2"/></svg>`;
    } else if (item.shape === 'triangle') {
        return `<svg width="40" height="40" viewBox="0 0 40 40"><polygon points="20,4 36,36 4,36" fill="${fill}" stroke="#1e293b" stroke-width="2"/></svg>`;
    } else {
        // circle
        return `<svg width="40" height="40" viewBox="0 0 40 40"><circle cx="20" cy="20" r="16" fill="${fill}" stroke="#1e293b" stroke-width="2"/></svg>`;
    }
}

function createProblemHTML(payload: RenderPayload) {
    const { problem, isSolutionView } = payload;
    const mode = problem.data.mode || 'classify-count';
    const classifyType = problem.data.classifyType || 'shape';
    const relation = problem.data.relation || 'most';

    let items: Item[] = problem.data.items || [];
    let categories: Record<string, number> = problem.data.categories || {};

    // Fallback item generation if not pre-populated
    if (items.length === 0) {
        const numObjects = problem.data.numObjects || 8;
        const shapes = ['circle', 'square', 'triangle'];
        const colors = ['red', 'blue', 'green'];
        for (let i = 0; i < numObjects; i++) {
            const shape = shapes[Math.floor(random() * shapes.length)];
            const color = colors[Math.floor(random() * colors.length)];
            items.push({ shape, color });
            const key = classifyType === 'shape' ? shape : color;
            categories[key] = (categories[key] || 0) + 1;
        }
        // Ensure all possible values are initialized
        const possible = classifyType === 'shape' ? shapes : colors;
        possible.forEach(cat => {
            if (categories[cat] === undefined) categories[cat] = 0;
        });
    }

    // Positions
    const width = 450;
    const height = 160;
    const positions: { x: number; y: number }[] = [];
    const minDistance = 45;

    for (let i = 0; i < items.length; i++) {
        let attempts = 0;
        let found = false;
        let x = 0, y = 0;
        while (attempts < 300 && !found) {
            attempts++;
            x = Math.floor(random() * (width - 60)) + 30;
            y = Math.floor(random() * (height - 60)) + 30;
            const tooClose = positions.some(p => {
                const dx = p.x - x;
                const dy = p.y - y;
                return Math.sqrt(dx * dx + dy * dy) < minDistance;
            });
            if (!tooClose) {
                positions.push({ x, y });
                found = true;
            }
        }
        if (!found) {
            positions.push({
                x: 30 + (i % 6) * 60,
                y: 30 + Math.floor(i / 6) * 60
            });
        }
    }

    let scatteredHTML = '';
    for (let i = 0; i < items.length; i++) {
        const pos = positions[i];
        scatteredHTML += `
            <div class="scattered-item" style="left: ${pos.x}px; top: ${pos.y}px;">
                ${renderItemSVG(items[i])}
            </div>
        `;
    }

    // Questionnaire
    let promptText = '';
    let questionContentHTML = '';

    if (mode === 'classify-count') {
        promptText = `Classify and count the objects by ${classifyType}.`;
        const possible = classifyType === 'shape' ? ['circle', 'square', 'triangle'] : ['red', 'blue', 'green'];
        
        questionContentHTML = possible.map(cat => {
            const count = categories[cat] || 0;
            const labelText = cat.charAt(0).toUpperCase() + cat.slice(1);
            
            // Icon to show in the table row
            let catIcon = '';
            if (classifyType === 'shape') {
                catIcon = renderItemSVG({ shape: cat, color: 'blue' });
            } else {
                catIcon = renderItemSVG({ shape: 'circle', color: cat });
            }

            return `
                <div class="classify-row">
                    <div class="row-label">${catIcon} <span>${labelText}</span></div>
                    <div class="input-box ${isSolutionView ? 'solution' : ''}">
                        ${isSolutionView ? count : ''}
                    </div>
                </div>
            `;
        }).join('');
    } else {
        // classify-sort
        promptText = `Which ${classifyType} has the ${relation} number of items?`;
        const possible = classifyType === 'shape' ? ['circle', 'square', 'triangle'] : ['red', 'blue', 'green'];
        
        let answer = problem.data.answer;
        if (!answer) {
            // Calculate answer on the fly for fallback
            let targetCount = relation === 'most' ? -1 : 999;
            possible.forEach(cat => {
                const c = categories[cat] || 0;
                if (relation === 'most') {
                    if (c > targetCount) {
                        targetCount = c;
                        answer = cat;
                    }
                } else {
                    if (c < targetCount) {
                        targetCount = c;
                        answer = cat;
                    }
                }
            });
        }

        questionContentHTML = `
            <div class="choices-row">
                ${possible.map(cat => {
                    const labelText = cat.charAt(0).toUpperCase() + cat.slice(1);
                    const isCorrect = cat === answer;
                    const btnClass = (isCorrect && isSolutionView) ? 'choice-btn correct' : 'choice-btn';
                    
                    let catIcon = '';
                    if (classifyType === 'shape') {
                        catIcon = renderItemSVG({ shape: cat, color: 'blue' });
                    } else {
                        catIcon = renderItemSVG({ shape: 'circle', color: cat });
                    }

                    return `
                        <div class="${btnClass}">
                            ${catIcon}
                            <span>${labelText}</span>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    return `
        <div class="problem-container">
            <div class="prompt-text">${promptText}</div>
            
            <div class="workspace-area">
                ${scatteredHTML}
            </div>

            <div class="question-area">
                ${questionContentHTML}
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

        exerciseContainer.innerHTML = createProblemHTML(payload);

        const solutionContainer = document.getElementById('solution');
        if (solutionContainer) {
            solutionContainer.style.display = 'none';
        }
    }
};
