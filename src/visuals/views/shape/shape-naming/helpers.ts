import {ViewValidationError} from '../../../helpers/validation.ts';

export type ShapeNamingAppearance = {
    size: number;
    rotation: number;
};

export function deriveShapeNamingAppearances(seed: number, isThreeDimensional: boolean): readonly [ShapeNamingAppearance, ShapeNamingAppearance] {
    if (!Number.isSafeInteger(seed)) {
        throw new ViewValidationError('shape-naming', 'Render seed must be a safe integer.');
    }
    const normalizedSeed = Math.abs(seed);
    const smallSizes = [72, 78, 84] as const;
    const largeSizes = [112, 118, 124] as const;
    const leftRotations = isThreeDimensional ? [-12, -6, 0] as const : [-32, -21, -12] as const;
    const rightRotations = isThreeDimensional ? [8, 14, 20] as const : [19, 33, 47] as const;

    const small: ShapeNamingAppearance = {
        size: smallSizes[normalizedSeed % smallSizes.length],
        rotation: leftRotations[Math.floor(normalizedSeed / 3) % leftRotations.length]
    };
    const large: ShapeNamingAppearance = {
        size: largeSizes[Math.floor(normalizedSeed / 9) % largeSizes.length],
        rotation: rightRotations[Math.floor(normalizedSeed / 27) % rightRotations.length]
    };
    return Math.floor(normalizedSeed / 81) % 2 === 0 ? [small, large] : [large, small];
}
