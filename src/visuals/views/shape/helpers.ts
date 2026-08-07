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
