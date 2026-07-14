import "./view.scss";
import { RenderPayload } from "../../types/ml-engine.ts";
import { setSeed } from "../../lib/random.ts";

function renderShapeSVG(shape: string, size = 100): string {
    if (shape === 'circle') {
        return `<svg width="${size}" height="${size}" viewBox="0 0 100 100" style="overflow: visible;">
            <circle cx="50" cy="50" r="40" fill="#3b82f6" stroke="#1d4ed8" stroke-width="3"/>
        </svg>`;
    } else if (shape === 'square') {
        return `<svg width="${size}" height="${size}" viewBox="0 0 100 100" style="overflow: visible;">
            <rect x="10" y="10" width="80" height="80" rx="4" fill="#3b82f6" stroke="#1d4ed8" stroke-width="3"/>
        </svg>`;
    } else if (shape === 'rectangle') {
        return `<svg width="${size}" height="${size}" viewBox="0 0 100 100" style="overflow: visible;">
            <rect x="10" y="25" width="80" height="50" rx="4" fill="#3b82f6" stroke="#1d4ed8" stroke-width="3"/>
        </svg>`;
    } else if (shape === 'triangle') {
        return `<svg width="${size}" height="${size}" viewBox="0 0 100 100" style="overflow: visible;">
            <polygon points="50,10 90,90 10,90" fill="#3b82f6" stroke="#1d4ed8" stroke-width="3"/>
        </svg>`;
    } else if (shape === 'hexagon') {
        return `<svg width="${size}" height="${size}" viewBox="0 0 100 100" style="overflow: visible;">
            <polygon points="50,10 85,30 85,70 50,90 15,70 15,30" fill="#3b82f6" stroke="#1d4ed8" stroke-width="3"/>
        </svg>`;
    } else if (shape === 'cube') {
        return `<svg width="${size}" height="${size}" viewBox="0 0 100 100" style="overflow: visible;">
            <path d="M 20 40 L 60 40 L 60 80 L 20 80 Z" fill="#3b82f6" stroke="#1d4ed8" stroke-width="2" />
            <path d="M 20 40 L 40 20 L 80 20 L 60 40 Z" fill="#60a5fa" stroke="#1d4ed8" stroke-width="2" />
            <path d="M 60 40 L 80 20 L 80 60 L 60 80 Z" fill="#2563eb" stroke="#1d4ed8" stroke-width="2" />
        </svg>`;
    } else if (shape === 'cone') {
        return `<svg width="${size}" height="${size}" viewBox="0 0 100 100" style="overflow: visible;">
            <ellipse cx="50" cy="75" rx="30" ry="10" fill="#2563eb" stroke="#1d4ed8" stroke-width="2" />
            <polygon points="50,15 20,75 80,75" fill="#3b82f6" stroke="#1d4ed8" stroke-width="2" />
            <path d="M 50 15 L 80 75 A 30 10 0 0 1 50 85 Z" fill="#1e40af" opacity="0.2"/>
        </svg>`;
    } else if (shape === 'cylinder') {
        return `<svg width="${size}" height="${size}" viewBox="0 0 100 100" style="overflow: visible;">
            <path d="M 25 25 L 25 75 A 25 8 0 0 0 75 75 L 75 25 Z" fill="#3b82f6" stroke="#1d4ed8" stroke-width="2" />
            <ellipse cx="50" cy="25" rx="25" ry="8" fill="#60a5fa" stroke="#1d4ed8" stroke-width="2" />
            <ellipse cx="50" cy="75" rx="25" ry="8" fill="#2563eb" stroke="#1d4ed8" stroke-dasharray="3 3" />
        </svg>`;
    } else if (shape === 'sphere') {
        return `<svg width="${size}" height="${size}" viewBox="0 0 100 100" style="overflow: visible;">
            <circle cx="50" cy="50" r="35" fill="url(#sphere-grad-viewer)" stroke="#1d4ed8" stroke-width="2" />
            <defs>
                <radialGradient id="sphere-grad-viewer" cx="30%" cy="30%" r="70%">
                    <stop offset="0%" stop-color="#93c5fd" />
                    <stop offset="50%" stop-color="#3b82f6" />
                    <stop offset="100%" stop-color="#1d4ed8" />
                </radialGradient>
            </defs>
        </svg>`;
    }
    return '';
}

function createProblemHTML(payload: RenderPayload) {
    const { problem, isSolutionView } = payload;
    const mode = problem.data.mode || 'name-2d';
    const answer = problem.data.answer;

    let promptText = '';
    let workspaceHTML = '';
    let choicesHTML = '';

    if (mode === 'position') {
        promptText = "Where is the ball relative to the box?";
        const relation = problem.data.relation; // above, below, beside, nextTo
        
        let ballY = 80;
        let ballX = 130;
        if (relation === 'above') ballY = 30;
        else if (relation === 'below') ballY = 130;
        else if (relation === 'beside' || relation === 'nextTo') { ballY = 80; ballX = 200; }

        workspaceHTML = `
            <svg width="300" height="180" style="overflow: visible;">
                <!-- Box -->
                <rect x="100" y="80" width="60" height="60" fill="#e2e8f0" stroke="#475569" stroke-width="2" rx="4"/>
                <text x="130" y="115" fill="#475569" font-weight="bold" font-size="14" text-anchor="middle">Box</text>
                <!-- Ball -->
                <circle cx="${ballX}" cy="${ballY}" r="20" fill="#f43f5e" stroke="#be123c" stroke-width="2" />
                <text x="${ballX}" y="${ballY + 4}" fill="#ffffff" font-weight="bold" font-size="12" text-anchor="middle">Ball</text>
            </svg>
        `;

        const options = ['above', 'below', 'nextTo'];
        choicesHTML = options.map(opt => {
            const isCorrect = opt === answer;
            const btnClass = (isCorrect && isSolutionView) ? 'choice-btn correct' : 'choice-btn';
            const labelText = opt === 'nextTo' ? 'Next to the box' : (opt.charAt(0).toUpperCase() + opt.slice(1) + ' the box');
            return `<div class="${btnClass}">${labelText}</div>`;
        }).join('');
    }

    else if (mode === 'env-shapes') {
        const target = problem.data.target; // clock, window, table
        promptText = `What shape is the ${target}?`;
        
        workspaceHTML = `
            <div class="env-scene" style="position: relative; width: 320px; height: 180px; background: #e0f2fe; border: 2.5px solid #0284c7; border-radius: 8px; overflow: hidden;">
                <!-- Table -->
                <rect style="position: absolute; bottom: 0; left: 60px; width: 200px; height: 50px; background: #8b5a2b; border: 2px solid #5c3a21; border-radius: 4px;"></rect>
                <div style="position: absolute; bottom: 0; left: 75px; width: 12px; height: 35px; background: #5c3a21;"></div>
                <div style="position: absolute; bottom: 0; right: 75px; width: 12px; height: 35px; background: #5c3a21;"></div>
                <!-- Window -->
                <div style="position: absolute; top: 15px; left: 30px; width: 50px; height: 50px; background: #ffffff; border: 3px solid #64748b; display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 2px;">
                    <div style="background: #bae6fd;"></div><div style="background: #bae6fd;"></div>
                    <div style="background: #bae6fd;"></div><div style="background: #bae6fd;"></div>
                </div>
                <!-- Clock -->
                <div style="position: absolute; top: 20px; right: 40px; width: 45px; height: 45px; border-radius: 50%; background: #ffffff; border: 3.5px solid #ef4444; display: flex; justify-content: center; align-items: center; font-weight: bold; font-size: 8px; color: #334155;">12</div>
            </div>
        `;

        const options = ['circle', 'square', 'rectangle'];
        choicesHTML = options.map(opt => {
            const isCorrect = opt === answer;
            const btnClass = (isCorrect && isSolutionView) ? 'choice-btn correct' : 'choice-btn';
            const labelText = opt.charAt(0).toUpperCase() + opt.slice(1);
            return `<div class="${btnClass}">${labelText}</div>`;
        }).join('');
    }

    else if (mode === 'name-2d' || mode === 'name-3d') {
        const shape = problem.data.shape;
        const rotation = problem.data.rotation || 0;
        const scale = problem.data.scale || 1.0;
        promptText = "What shape is this?";

        workspaceHTML = `
            <div style="transform: rotate(${rotation}deg) scale(${scale}); transform-origin: center; display: flex; justify-content: center; align-items: center; width: 120px; height: 120px;">
                ${renderShapeSVG(shape, 100)}
            </div>
        `;

        const options = mode === 'name-2d' 
            ? ['square', 'circle', 'triangle', 'rectangle', 'hexagon']
            : ['cube', 'cone', 'cylinder', 'sphere'];

        choicesHTML = options.map(opt => {
            const isCorrect = opt === answer;
            const btnClass = (isCorrect && isSolutionView) ? 'choice-btn correct' : 'choice-btn';
            const labelText = opt.charAt(0).toUpperCase() + opt.slice(1);
            return `<div class="${btnClass}">${labelText}</div>`;
        }).join('');
    }

    else if (mode === 'classify-dim') {
        const shape = problem.data.shape;
        promptText = "Is this shape flat (two-dimensional) or solid (three-dimensional)?";

        workspaceHTML = `
            <div style="display: flex; justify-content: center; align-items: center; width: 120px; height: 120px;">
                ${renderShapeSVG(shape, 100)}
            </div>
        `;

        const options = ['Flat (2D)', 'Solid (3D)'];
        choicesHTML = options.map(opt => {
            const isCorrect = opt === answer;
            const btnClass = (isCorrect && isSolutionView) ? 'choice-btn correct' : 'choice-btn';
            return `<div class="${btnClass}">${opt}</div>`;
        }).join('');
    }

    else if (mode === 'compare-attributes') {
        const attribute = problem.data.attribute; // sides, corners
        const shape1 = problem.data.shape1;
        const shape2 = problem.data.shape2;
        promptText = `Which shape has more ${attribute}?`;

        // Render side-by-side
        workspaceHTML = `
            <div style="display: flex; gap: 40px; align-items: center; justify-content: center; width: 100%;">
                <div style="display: flex; flex-direction: column; align-items: center; gap: 10px;">
                    ${renderShapeSVG(shape1, 80)}
                    <span style="font-weight: 700; color: #475569;">${shape1.toUpperCase()}</span>
                </div>
                <div style="display: flex; flex-direction: column; align-items: center; gap: 10px;">
                    ${renderShapeSVG(shape2, 80)}
                    <span style="font-weight: 700; color: #475569;">${shape2.toUpperCase()}</span>
                </div>
            </div>
        `;

        const options = [shape1, shape2];
        choicesHTML = options.map(opt => {
            const isCorrect = opt === answer;
            const btnClass = (isCorrect && isSolutionView) ? 'choice-btn correct' : 'choice-btn';
            const labelText = opt.charAt(0).toUpperCase() + opt.slice(1);
            return `<div class="${btnClass}">${labelText}</div>`;
        }).join('');
    }

    else if (mode === 'same-attribute') {
        const attribute = problem.data.attribute;
        const promptMap: Record<string, string> = {
            'can-roll': 'Which of these shapes rolls easily?',
            'can-stack': 'Which of these shapes is best for stacking?',
            'flat-faces': 'Which of these shapes has NO flat faces?'
        };
        promptText = promptMap[attribute] || 'Choose the correct shape.';

        workspaceHTML = `
            <div style="display: flex; gap: 30px; justify-content: center; align-items: center; width: 100%;">
                <div style="display: flex; flex-direction: column; align-items: center; gap: 6px;">
                    ${renderShapeSVG('sphere', 70)}
                    <span style="font-weight: bold; color: #64748b;">Sphere</span>
                </div>
                <div style="display: flex; flex-direction: column; align-items: center; gap: 6px;">
                    ${renderShapeSVG('cube', 70)}
                    <span style="font-weight: bold; color: #64748b;">Cube</span>
                </div>
                <div style="display: flex; flex-direction: column; align-items: center; gap: 6px;">
                    ${renderShapeSVG('cone', 70)}
                    <span style="font-weight: bold; color: #64748b;">Cone</span>
                </div>
            </div>
        `;

        const options = ['sphere', 'cube', 'cone'];
        choicesHTML = options.map(opt => {
            const isCorrect = opt === answer;
            const btnClass = (isCorrect && isSolutionView) ? 'choice-btn correct' : 'choice-btn';
            const labelText = opt.charAt(0).toUpperCase() + opt.slice(1);
            return `<div class="${btnClass}">${labelText}</div>`;
        }).join('');
    }

    else if (mode === 'build-shape') {
        const target = problem.data.target; // triangle, square, rectangle
        promptText = `To build a ${target}, how many sticks (sides) and clay balls (corners) do you need?`;

        workspaceHTML = `
            <div style="display: flex; gap: 20px; align-items: center; justify-content: center; width: 100%;">
                <div style="padding: 10px; background: #ffffff; border: 1.5px dashed #cbd5e1; border-radius: 8px; display: flex; flex-direction: column; gap: 8px;">
                    <div style="display: flex; gap: 6px; align-items: center; font-weight: bold; color: #475569;">
                        <span style="display: inline-block; width: 30px; height: 4px; background: #64748b;"></span> Stick (Side)
                    </div>
                    <div style="display: flex; gap: 6px; align-items: center; font-weight: bold; color: #475569;">
                        <span style="display: inline-block; width: 14px; height: 14px; border-radius: 50%; background: #be123c;"></span> Clay Ball (Corner)
                    </div>
                </div>
                ${renderShapeSVG(target, 80)}
            </div>
        `;

        const options = [
            '3 sticks, 3 balls',
            '4 sticks, 4 balls'
        ];
        choicesHTML = options.map(opt => {
            const isCorrect = opt === answer;
            const btnClass = (isCorrect && isSolutionView) ? 'choice-btn correct' : 'choice-btn';
            return `<div class="${btnClass}">${opt}</div>`;
        }).join('');
    }

    else if (mode === 'draw-shape') {
        const target = problem.data.target; // circle, triangle, square
        promptText = `Trace the ${target}.`;

        let pathD = '';
        if (target === 'circle') pathD = 'M 75 75 A 40 40 0 1 0 75 74.9';
        else if (target === 'triangle') pathD = 'M 50 10 L 90 90 L 10 90 Z';
        else if (target === 'square') pathD = 'M 10 10 L 90 10 L 90 90 L 10 90 Z';

        workspaceHTML = `
            <svg width="150" height="150" viewBox="0 0 100 100" style="overflow: visible;">
                <!-- Dotted outline path -->
                <path d="${pathD}" fill="none" stroke="#cbd5e1" stroke-width="3" stroke-dasharray="4 4" />
                <!-- Solid trace path shown in solution view -->
                ${isSolutionView ? `<path d="${pathD}" fill="none" stroke="#ef4444" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />` : ''}
            </svg>
        `;
        choicesHTML = ''; // No buttons for tracing
    }

    else if (mode === 'compose-shapes') {
        const target = problem.data.target; // rectangle, square
        promptText = `Which two shapes can you join to make a ${target}?`;

        workspaceHTML = `
            <div style="display: flex; gap: 30px; align-items: center; justify-content: center; width: 100%;">
                <div style="position: relative; width: 100px; height: 70px; border: 2.5px dashed #64748b; border-radius: 4px; display: flex; justify-content: center; align-items: center; font-weight: bold; color: #64748b;">
                    Target: ${target.toUpperCase()}
                    ${isSolutionView && target === 'rectangle' ? `<line x1="0" y1="0" x2="100" y2="70" stroke="#ef4444" stroke-width="2.5" stroke-dasharray="3 3"/>` : ''}
                </div>
            </div>
        `;

        const options = ['Two triangles', 'Two circles'];
        choicesHTML = options.map(opt => {
            const isCorrect = opt === answer;
            const btnClass = (isCorrect && isSolutionView) ? 'choice-btn correct' : 'choice-btn';
            return `<div class="${btnClass}">${opt}</div>`;
        }).join('');
    }

    return `
        <div class="problem-container">
            <div class="prompt-text">${promptText}</div>
            
            <div class="workspace-area">
                ${workspaceHTML}
            </div>

            ${choicesHTML ? `<div class="choices-container">${choicesHTML}</div>` : ''}
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
