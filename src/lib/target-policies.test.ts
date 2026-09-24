import {describe, expect, it, vi} from 'vitest';
import {resolve} from 'node:path';
import {getTargetPolicyLabels, requireTargetLabels, rejectTargetLabels} from './target-policies.ts';
import {CompatibilityContractError} from './compatibility-errors.ts';
import {ModelSourceIndex} from './model-source-index.ts';

describe('browser-safe target policies', () => {
    it('uses canonical conjunctions and ontology queries only against original target labels', () => {
        const require = requireTargetLabels('needs-both', ['b', 'a', 'a']);
        const reject = rejectTargetLabels('forbids-any', ['b', 'a', 'a']);
        expect(require.targetPolicy).toEqual({kind: 'require', labels: ['a', 'b']});
        expect(reject.targetPolicy).toEqual({kind: 'reject', labels: ['a', 'b']});
        expect(require.dependencies).toEqual([{scope: 'target', label: 'a'}, {scope: 'target', label: 'b'}]);
        const has = vi.fn((scope: string, label: string) => scope === 'target' && label === 'a');
        const exact = vi.fn(() => { throw new Error('Policy must use capability queries'); });
        expect(require.predicate({has, exact})).toBe(false);
        expect(reject.predicate({has, exact})).toBe(false);
        has.mockImplementation(() => true);
        expect(require.predicate({has, exact})).toBe(true);
        has.mockImplementation(() => false);
        expect(reject.predicate({has, exact})).toBe(true);
        expect(exact).not.toHaveBeenCalled();
    });

    it('validates labels before exporting malformed authored metadata', () => {
        for (const labels of [null, 'label', [''], [1]]) {
            expect(() => requireTargetLabels('required', labels as never)).toThrow(CompatibilityContractError);
            expect(() => rejectTargetLabels('rejected', labels as never)).toThrow(CompatibilityContractError);
        }
        expect(getTargetPolicyLabels(undefined, 'require')).toEqual([]);
        expect(getTargetPolicyLabels([requireTargetLabels('one', ['b', 'a']),
            requireTargetLabels('two', ['b']), rejectTargetLabels('three', ['c'])], 'require')).toEqual(['a', 'b']);
    });

    it('keeps the transitive authored dependency closure free of server planning and hashing', () => {
        const projectRoot = resolve(__dirname, '../..');
        const entry = resolve(projectRoot, 'src/lib/target-policies.ts');
        const paths = new ModelSourceIndex(projectRoot, {includeAssets: false}).dependencies([entry]);
        expect(new Set(paths)).toEqual(new Set([
            entry, resolve(projectRoot, 'src/lib/compatibility-errors.ts'), resolve(projectRoot, 'src/types/compatibility.ts')
        ]));
    });
});
