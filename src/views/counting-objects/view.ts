import "./view.scss";
import { RenderPayload } from "../../types/ml-engine.ts";
import { setSeed, random } from "../../lib/random.ts";

const ICONS = ['circle.svg', 'square.svg', 'triangle.svg', 'star.svg', 'pentagon.svg', 'hexagon.svg', 'heart.svg', 'diamond.svg'];

interface Position {
    x: number;
    y: number;
}

function generatePositions(numObjects: number, arrangement: string, layout: string): Position[] {
    const positions: Position[] = [];
    const width = 450;
    const height = 300;

    const actualArrangement = arrangement || layout || 'line';

    if (actualArrangement === 'circle') {
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 2 - 40;
        for (let i = 0; i < numObjects; i++) {
            const theta = i * (2 * Math.PI / numObjects) - Math.PI / 2;
            positions.push({
                x: centerX + radius * Math.cos(theta) - 20,
                y: centerY + radius * Math.sin(theta) - 20
            });
        }
    } else if (actualArrangement === 'array') {
        const cols = Math.ceil(Math.sqrt(numObjects));
        const rows = Math.ceil(numObjects / cols);
        const colSpacing = Math.min(60, (width - 60) / cols);
        const rowSpacing = Math.min(60, (height - 60) / rows);
        const startX = width / 2 - ((cols - 1) * colSpacing) / 2;
        const startY = height / 2 - ((rows - 1) * rowSpacing) / 2;
        for (let i = 0; i < numObjects; i++) {
            const r = Math.floor(i / cols);
            const c = i % cols;
            positions.push({
                x: startX + c * colSpacing - 20,
                y: startY + r * rowSpacing - 20
            });
        }
    } else if (actualArrangement === 'scattered') {
        const minDistance = 55;
        for (let i = 0; i < numObjects; i++) {
            let attempts = 0;
            let found = false;
            let x = 0, y = 0;
            while (attempts < 300 && !found) {
                attempts++;
                x = Math.floor(random() * (width - 100)) + 50;
                y = Math.floor(random() * (height - 100)) + 50;
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
                    x: 50 + (i % 5) * 80,
                    y: 50 + Math.floor(i / 5) * 80
                });
            }
        }
    } else {
        // line
        const spacing = Math.min(55, (width - 60) / numObjects);
        const startX = width / 2 - ((numObjects - 1) * spacing) / 2;
        const y = height / 2 - 20;
        for (let i = 0; i < numObjects; i++) {
            positions.push({
                x: startX + i * spacing,
                y
            });
        }
    }

    return positions;
}

function createProblemHTML(payload: RenderPayload, icon: string) {
    const { problem, isSolutionView } = payload;
    const mode = problem.data.mode || 'simple';
    const numObjects = problem.data.numObjects;
    const totalCount = problem.data.totalCount || numObjects;
    const arrangement = problem.data.arrangement || problem.data.layout || 'line';

    // Set prompt text
    let promptText = 'How many objects are there?';
    if (mode === 'count-out') {
        promptText = `Color exactly ${numObjects} objects.`;
    } else if (mode === 'one-to-one') {
        promptText = 'Count the objects and write the numbers in order.';
    } else if (mode === 'cardinality') {
        promptText = 'Count the objects. What is the total number?';
    }

    const renderCount = mode === 'count-out' ? totalCount : numObjects;
    const positions = generatePositions(renderCount, arrangement, arrangement);

    let objectsHTML = '';
    for (let i = 0; i < renderCount; i++) {
        const pos = positions[i];
        let extraHTML = '';
        let imgClass = '';

        if (mode === 'one-to-one') {
            const badgeClass = isSolutionView ? 'one-to-one-badge solution' : 'one-to-one-badge';
            const badgeText = isSolutionView ? `${i + 1}` : '';
            extraHTML = `<div class="${badgeClass}">${badgeText}</div>`;
        } else if (mode === 'cardinality') {
            const labelClass = (isSolutionView && i === renderCount - 1) ? 'cardinality-label final' : 'cardinality-label';
            extraHTML = `<div class="${labelClass}">${i + 1}</div>`;
        } else if (mode === 'count-out') {
            const isColored = i < numObjects;
            if (isColored && isSolutionView) {
                imgClass = 'colored';
            } else {
                imgClass = 'greyed';
            }
        }

        objectsHTML += `
            <div class="positioned-object" style="left: ${pos.x}px; top: ${pos.y}px;">
                <img class="${imgClass}" src="/icons/counting/${icon}" alt="counting object">
                ${extraHTML}
            </div>
        `;
    }

    // Answer Box
    const showAnswer = isSolutionView;
    const answerContent = mode === 'count-out' ? `Colored: ${numObjects}` : numObjects;
    
    return `
        <div class="problem-container">
            <div class="prompt-text">${promptText}</div>
            <div class="workspace-area">
                ${objectsHTML}
            </div>
            <div class="solution-box-row">
                <div class="solution-box ${showAnswer ? 'solution' : ''}">
                    ${showAnswer ? answerContent : ''}
                </div>
            </div>
        </div>`;
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
