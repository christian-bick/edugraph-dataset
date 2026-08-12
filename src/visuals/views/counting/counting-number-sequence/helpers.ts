import {Scope} from 'edugraph-ts';
import {ViewValidationError} from '../../../helpers/validation.ts';

export const MAX_ARABIC_SEQUENCE_VALUE = 1000;
export const MAX_PHYSICAL_SEQUENCE_VALUE = 20;
export const MAX_PHYSICAL_SEQUENCE_LENGTH = 6;

export type SequenceLayout = {
    usesTiles: boolean;
    tileSizeClass: string;
    tileClass: string;
};

export function resolveSequenceLayout(representation: string | undefined, sequence: number[]): SequenceLayout {
    if (representation === Scope.PhysicalNumbers) {
        if (sequence.length > MAX_PHYSICAL_SEQUENCE_LENGTH) {
            throw new ViewValidationError(
                'counting-number-sequence',
                `Physical sequences support at most ${MAX_PHYSICAL_SEQUENCE_LENGTH} cells.`
            );
        }
        if (sequence.some(value => value > MAX_PHYSICAL_SEQUENCE_VALUE)) {
            throw new ViewValidationError(
                'counting-number-sequence',
                `Physical sequence tiles support values through ${MAX_PHYSICAL_SEQUENCE_VALUE}.`
            );
        }

        return {
            usesTiles: true,
            tileSizeClass: 'w-[84px] h-[104px]',
            tileClass: 'border-amber-300 bg-amber-50 shadow-[0_4px_0_#fbbf24]'
        };
    }

    if (representation === Scope.ArabicNumerals) {
        if (sequence.some(value => value > MAX_ARABIC_SEQUENCE_VALUE)) {
            throw new ViewValidationError(
                'counting-number-sequence',
                `Arabic-numeral sequences support values through ${MAX_ARABIC_SEQUENCE_VALUE}.`
            );
        }

        return {
            usesTiles: false,
            tileSizeClass: 'w-[56px] h-[56px]',
            tileClass: 'border-slate-300 bg-slate-50'
        };
    }

    throw new ViewValidationError('counting-number-sequence', 'Unsupported number representation.');
}
