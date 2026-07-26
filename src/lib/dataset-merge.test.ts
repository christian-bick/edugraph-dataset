import { describe, expect, it } from 'vitest';
import {
    emptyFingerprintIndex,
    exerciseKey,
    groupIntoExercises,
    parseMetadataLines,
    selectUnionExercises,
    type MetadataRow,
} from './dataset-merge.ts';

function row(overrides: Partial<MetadataRow> = {}): MetadataRow {
    return {
        file_name: 'img.png',
        sample_key: 'k',
        spec: 'ccss',
        target_id: 'K.CC.B.5-how-many~aaaa',
        generator: 'counting-basic',
        view: 'counting-objects-simple',
        mode: 'question',
        instance: 0,
        content_fingerprint: 'fp-1',
        ...overrides,
    };
}

describe('exerciseKey', () => {
    it('ignores the mode so both modes share one key', () => {
        expect(exerciseKey(row({ mode: 'question' }))).toBe(exerciseKey(row({ mode: 'solution' })));
    });

    it('separates different targets, generators, views and instances', () => {
        const base = exerciseKey(row());
        expect(exerciseKey(row({ target_id: 'other' }))).not.toBe(base);
        expect(exerciseKey(row({ generator: 'other' }))).not.toBe(base);
        expect(exerciseKey(row({ view: 'other' }))).not.toBe(base);
        expect(exerciseKey(row({ instance: 1 }))).not.toBe(base);
    });
});

describe('groupIntoExercises', () => {
    it('groups both modes into one exercise', () => {
        const exercises = groupIntoExercises([
            row({ mode: 'question', content_fingerprint: 'fp-q' }),
            row({ mode: 'solution', content_fingerprint: 'fp-s' }),
        ]);
        expect(exercises).toHaveLength(1);
        expect(exercises[0].rows).toHaveLength(2);
    });

    it('takes its fingerprint from the question row, as generation does', () => {
        const exercises = groupIntoExercises([
            row({ mode: 'solution', content_fingerprint: 'fp-s' }),
            row({ mode: 'question', content_fingerprint: 'fp-q' }),
        ]);
        expect(exercises[0].fingerprint).toBe('fp-q');
    });

    it('preserves first-seen order across exercises', () => {
        const exercises = groupIntoExercises([
            row({ target_id: 'b' }),
            row({ target_id: 'a' }),
        ]);
        expect(exercises.map(e => e.rows[0].target_id)).toEqual(['b', 'a']);
    });
});

describe('selectUnionExercises', () => {
    it('keeps everything when nothing has been seen', () => {
        const exercises = groupIntoExercises([row(), row({ target_id: 'other', content_fingerprint: 'fp-2' })]);
        const { kept, dropped } = selectUnionExercises(exercises, emptyFingerprintIndex());
        expect(kept).toHaveLength(2);
        expect(dropped).toHaveLength(0);
    });

    it('drops a later standard duplicating earlier content in the same view', () => {
        const seen = emptyFingerprintIndex();
        const ccss = groupIntoExercises([row({ spec: 'ccss' })]);
        selectUnionExercises(ccss, seen);

        const nctm = groupIntoExercises([row({ spec: 'nctm', target_id: 'N.1-count~bbbb' })]);
        const { kept, dropped } = selectUnionExercises(nctm, seen);

        expect(kept).toHaveLength(0);
        expect(dropped).toHaveLength(1);
    });

    it('keeps identical content rendered by a different view', () => {
        const seen = emptyFingerprintIndex();
        selectUnionExercises(groupIntoExercises([row()]), seen);

        const otherView = groupIntoExercises([row({ view: 'counting-objects-one-to-one' })]);
        expect(selectUnionExercises(otherView, seen).kept).toHaveLength(1);
    });

    it('drops the whole exercise, never a single mode', () => {
        const seen = emptyFingerprintIndex();
        selectUnionExercises(groupIntoExercises([row()]), seen);

        const duplicate = groupIntoExercises([
            row({ spec: 'nctm', target_id: 'N.1', mode: 'question', content_fingerprint: 'fp-1' }),
            row({ spec: 'nctm', target_id: 'N.1', mode: 'solution', content_fingerprint: 'fp-s' }),
        ]);
        const { kept, dropped } = selectUnionExercises(duplicate, seen);
        expect(kept).toHaveLength(0);
        expect(dropped[0].rows).toHaveLength(2);
    });

    it('keeps validation content out of train content across standards', () => {
        const trainIndex = emptyFingerprintIndex();
        selectUnionExercises(groupIntoExercises([row({ spec: 'ccss' })]), trainIndex);

        const valIndex = emptyFingerprintIndex();
        const val = groupIntoExercises([row({ spec: 'nctm', target_id: 'N.1' })]);
        const { kept, dropped } = selectUnionExercises(val, valIndex, trainIndex);

        expect(kept).toHaveLength(0);
        expect(dropped).toHaveLength(1);
    });

    it('does not claim excluded fingerprints into the seen index', () => {
        const excluded = emptyFingerprintIndex();
        selectUnionExercises(groupIntoExercises([row()]), excluded);

        const seen = emptyFingerprintIndex();
        selectUnionExercises(groupIntoExercises([row({ target_id: 'x' })]), seen, excluded);
        expect(seen.size).toBe(0);
    });

    it('deduplicates within a single standard too', () => {
        const exercises = groupIntoExercises([
            row({ target_id: 'a' }),
            row({ target_id: 'b' }),
        ]);
        const { kept, dropped } = selectUnionExercises(exercises, emptyFingerprintIndex());
        expect(kept).toHaveLength(1);
        expect(dropped).toHaveLength(1);
    });
});

describe('parseMetadataLines', () => {
    it('parses rows and ignores blank lines', () => {
        const rows = parseMetadataLines(`${JSON.stringify(row())}\n\n${JSON.stringify(row({ target_id: 'b' }))}\n`);
        expect(rows).toHaveLength(2);
        expect(rows[1].target_id).toBe('b');
    });

    it('returns nothing for empty content', () => {
        expect(parseMetadataLines('')).toEqual([]);
    });
});
