import {MeasureAngleProblem} from '../../../../types/problems.ts';

const MEASURES = new Set([23, 37, 52, 68, 90, 112, 127, 143, 158]);

export const isValidMeasureAngleProblem = (data: MeasureAngleProblem): boolean => {
    if (!MEASURES.has(data.angleMeasure)) return false;
    const rightBaseline = data.geometry.baselineSide === 'right';
    const expectedBaseline = rightBaseline ? 0 : 180;
    const expectedTerminal = rightBaseline
        ? data.angleMeasure
        : 180 - data.angleMeasure;
    const expectedDirection = rightBaseline ? 'counterclockwise' : 'clockwise';
    const expectedScale = rightBaseline ? 'inner' : 'outer';

    return data.task === 'measure-angle'
        && data.geometry.vertexLabel === 'O'
        && data.geometry.baselinePointLabel === 'A'
        && data.geometry.terminalPointLabel === 'B'
        && (data.geometry.baselineSide === 'right' || data.geometry.baselineSide === 'left')
        && data.geometry.baselineDegrees === expectedBaseline
        && data.geometry.terminalDegrees === expectedTerminal
        && data.geometry.sweepDegrees === data.angleMeasure
        && data.geometry.direction === expectedDirection
        && data.protractor.minimumDegrees === 0
        && data.protractor.maximumDegrees === 180
        && data.protractor.tickStepDegrees === 1
        && data.protractor.labelStepDegrees === 10
        && data.protractor.centerLabel === data.geometry.vertexLabel
        && data.protractor.baselinePointLabel === data.geometry.baselinePointLabel
        && data.protractor.zeroSide === data.geometry.baselineSide
        && data.protractor.readingScale === expectedScale
        && data.prompt === 'Use the protractor to measure angle AOB.'
        && data.questionRelation === 'm∠AOB = ?°'
        && data.solutionRelation === `m∠AOB = ${data.angleMeasure}°`
        && data.answer === `${data.angleMeasure}°`
        && data.answerStatement === `Angle AOB measures ${data.angleMeasure}°.`
        && data.explanation === `Ray OA starts at the ${data.geometry.baselineSide} 0° mark. Following the ${data.protractor.readingScale} scale to ray OB gives ${data.angleMeasure}°.`;
};
