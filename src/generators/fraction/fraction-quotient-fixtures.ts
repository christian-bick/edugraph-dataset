import {random} from '../../lib/random.ts';
import type {FractionPartitionQuotientProblem, FractionQuotientContent} from '../../types/problems.ts';
import {FractionQuotientModelGenerator} from './fraction-quotient-model/generator.ts';
import type {FractionQuotientModelGeneratorConfig} from './fraction-quotient-model/spec.ts';
import {buildUnitPartitionProblem, type UnitSharingProfile} from './fraction-unit-sharing-domain.ts';

type FixtureConfig = {relationProfile: FractionQuotientModelGeneratorConfig['relationProfile'] | UnitSharingProfile;
    numericProfile: FractionQuotientModelGeneratorConfig['numericProfile']; range: unknown};
/** Test fixtures retain the original unit draw law independently of canonical bands. */
export class FractionQuotientFixtureGenerator {
    generate(config: FixtureConfig): {data: FractionPartitionQuotientProblem} {
        if (config.relationProfile?.startsWith('unit-dividend-')) {
            const b = 2 + Math.floor(random() * 5), n = 2 + Math.floor(random() * 5);
            return {data: buildUnitPartitionProblem(b, n, config.relationProfile as UnitSharingProfile, random() < 0.5 ? 'ribbon' : 'rope')};
        }
        return new FractionQuotientModelGenerator().generate(config as FractionQuotientModelGeneratorConfig);
    }
}

export function sharingFixture(data: FractionPartitionQuotientProblem): FractionQuotientContent {
    if (data.kind !== 'fraction-unit-partition') return data;
    const {model, ...relations} = data;
    return {...relations, kind: 'fraction-unit-sharing', recipientCount: model.recipientCount};
}
