export type ShapeDrawingFamily = 'circular' | 'linear';

export type ShapeDrawingViewId =
    | 'shape-draw-circular-shape'
    | 'shape-draw-linear-shape'
    | 'shape-draw-circular-rotation'
    | 'shape-draw-linear-rotation'
    | 'shape-draw-excluded-quadrilateral';

const FAMILY_BY_TARGET: Readonly<Record<string, ShapeDrawingFamily>> = {
    circle: 'circular',
    triangle: 'linear',
    square: 'linear',
    rectangle: 'linear',
    quadrilateral: 'linear',
    pentagon: 'linear',
    hexagon: 'linear'
};

export function getShapeDrawingFamily(target: string): ShapeDrawingFamily | undefined {
    return FAMILY_BY_TARGET[target];
}

export function getTracePath(target: string): string {
    if (target === 'circle') return 'M 50 18 A 32 32 0 1 1 50 82 A 32 32 0 1 1 50 18 Z';
    if (target === 'triangle') return 'M 50 15 L 85 85 L 15 85 Z';
    if (target === 'square') return 'M 15 15 L 85 15 L 85 85 L 15 85 Z';
    if (target === 'rectangle') return 'M 15 25 L 85 25 L 85 75 L 15 75 Z';
    if (target === 'quadrilateral') return 'M 18 20 L 88 12 L 74 86 L 10 70 Z';
    if (target === 'pentagon') return 'M 50 8 L 90 38 L 75 88 L 25 88 L 10 38 Z';
    if (target === 'hexagon') return 'M 50 10 L 85 30 L 85 70 L 50 90 L 15 70 L 15 30 Z';
    return '';
}

export function rotationDrawingPresentation(shape: string, isSolutionView: boolean) {
    const referenceRotation = shape === 'triangle'
        ? 180
        : shape === 'rectangle'
            ? 90
            : shape === 'square'
                ? 45
                : shape === 'circle'
                    ? 90
                    : 30;
    return {
        referenceRotation,
        showCompletedDrawing: isSolutionView
    };
}
