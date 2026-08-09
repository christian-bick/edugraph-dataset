export interface WeightLayout {
    leftBeamY: number;
    rightBeamY: number;
    leftPanY: number;
    rightPanY: number;
}

export function getWeightLayout(val1: number, val2: number): WeightLayout {
    const leftHeavier = val1 > val2;
    const leftBeamY = leftHeavier ? 105 : 75;
    const rightBeamY = leftHeavier ? 75 : 105;
    const leftPanY = leftHeavier ? 135 : 105;
    const rightPanY = leftHeavier ? 105 : 135;
    return {leftBeamY, rightBeamY, leftPanY, rightPanY};
}
