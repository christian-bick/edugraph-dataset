import {
    ShapeAttributeCountSpecificationProblem,
    ShapeCountClassificationProblem
} from '../../../types/problems.ts';

export type ShapeAppearance = {
    color: string;
    rotation: number;
    scale: number;
};

const COLORS = ['#2563eb', '#db2777', '#d97706', '#059669'] as const;
const ROTATIONS = [-24, -10, 12, 27] as const;
const SCALES = [0.78, 0.9, 1.04, 1.16] as const;

export function getShapeAppearance(seed: number, index = 0): ShapeAppearance {
    const normalizedSeed = Math.abs(seed) + index * 7919;
    return {
        color: COLORS[normalizedSeed % COLORS.length],
        rotation: ROTATIONS[Math.floor(normalizedSeed / COLORS.length) % ROTATIONS.length],
        scale: SCALES[Math.floor(normalizedSeed / (COLORS.length * ROTATIONS.length)) % SCALES.length]
    };
}

export function countClassificationMatchesRenderedPolygons(
    data: ShapeCountClassificationProblem,
    renderedCountForShape: (shape: ShapeCountClassificationProblem['options'][number]['shape']) => number | null
): boolean {
    if (data.attribute !== 'vertices' && data.attribute !== 'angles') return true;
    return data.options.every(option => {
        const renderedCount = renderedCountForShape(option.shape);
        return renderedCount !== null
            && option.count === renderedCount
            && option.satisfies === (renderedCount === data.requiredCount);
    });
}

export function angleConstructionMatchesRenderedPolygon(
    data: ShapeAttributeCountSpecificationProblem,
    renderedAngleCount: number
): boolean {
    if (data.attribute !== 'angles') return true;
    return data.requiredCount === renderedAngleCount
        && data.sides === renderedAngleCount
        && data.corners === renderedAngleCount;
}
