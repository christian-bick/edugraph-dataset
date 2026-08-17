import type {WholeNumberPlaceValue} from '../../../../types/problems.ts';

export function legacyNumeralDigits(number: number): string[] {
    return String(number).split('');
}

export function placeValueResponseDigits(
    placeValues: readonly WholeNumberPlaceValue[]
): string[] {
    return placeValues.map(place => String(place.digit));
}

export type LegacyWritingCue = {
    instruction: string;
    sourceText: string | null;
};

export function legacyWritingCue(number: number, isSolutionView: boolean): LegacyWritingCue {
    if (number === 0) {
        return {
            instruction: 'Write the numeral.',
            sourceText: 'No objects'
        };
    }

    return {
        instruction: number <= 20
            ? 'Write the numeral represented by the ten-frames.'
            : 'Write the numeral represented by the base-ten blocks.',
        sourceText: isSolutionView ? String(number) : null
    };
}
