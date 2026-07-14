export interface WeightLayout {
    beamRotate: number;
    leftPanY: number;
    rightPanY: number;
}

export function getWeightLayout(val1: number, val2: number): WeightLayout {
    const leftHeavier = val1 > val2;
    const beamRotate = leftHeavier ? 15 : -15;
    const leftPanY = leftHeavier ? 115 : 65;
    const rightPanY = leftHeavier ? 65 : 115;
    return { beamRotate, leftPanY, rightPanY };
}
