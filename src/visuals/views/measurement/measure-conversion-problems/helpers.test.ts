import {describe, expect, it} from 'vitest';
import {buildMeasurementConversionStoryPresentation, isValidMeasurementConversionStory} from './helpers.ts';
import {pairs, storyFor} from './fixtures.ts';

describe('measurement conversion story contract', () => {
    it.each(pairs)('keeps exact factor and addition relationships in both directions for $id', pair => {
        for (const sourceSide of ['larger', 'smaller'] as const) {
            for (const numberKind of ['integer', 'decimal'] as const) {
                const data = storyFor(pair, sourceSide, numberKind);
                const presentation = buildMeasurementConversionStoryPresentation(data);
                expect(isValidMeasurementConversionStory(data)).toBe(true);
                expect(presentation.story).toContain(sourceSide === 'larger'
                    ? pair.largerUnit.replace('-', ' ') : pair.smallerUnit.replace('-', ' '));
                expect(presentation.story).toContain(sourceSide === 'larger'
                    ? pair.smallerUnit.replace('-', ' ') : pair.largerUnit.replace('-', ' '));
                expect(presentation.factorEquation).toContain(sourceSide === 'larger' ? ' × ' : ' ÷ ');
                expect(presentation.additionEquation).toContain(` = ${presentation.answer}`);
            }
        }
    });

    it('rejects any broken factor, total, profile, pair, or unsafe count', () => {
        const data = storyFor(pairs[0], 'smaller', 'decimal');
        expect(isValidMeasurementConversionStory({
            ...data, conversion: {...data.conversion, smallerHundredths: 125_001}
        })).toBe(false);
        expect(isValidMeasurementConversionStory({...data, totalTargetHundredths: 276})).toBe(false);
        expect(isValidMeasurementConversionStory({...data, numberKind: 'integer'})).toBe(false);
        expect(isValidMeasurementConversionStory({
            ...data, pair: {...data.pair, factor: 100}
        })).toBe(false);
        expect(isValidMeasurementConversionStory({...data, additionalTargetHundredths: 0})).toBe(false);
        expect(isValidMeasurementConversionStory({
            ...data, additionalTargetHundredths: Number.MAX_SAFE_INTEGER
        })).toBe(false);
        const integer = storyFor(pairs[3], 'larger', 'integer');
        expect(isValidMeasurementConversionStory({
            ...integer, additionalTargetHundredths: 325, totalTargetHundredths: 3525
        })).toBe(false);
    });
});
