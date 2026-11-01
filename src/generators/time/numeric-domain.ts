import {canonicalRangeProfiles} from '../../lib/canonical-range-labels.ts';
import type {CanonicalNumericRange} from '../../lib/canonical-numeric-range.ts';
import type {ClockProfile} from './clock-profile.ts';

interface ClockBlock {hour: number; minute: number; firstSecond: number; count: number}
export interface CanonicalClockConfig {
    clockProfile: ClockProfile;
    range: CanonicalNumericRange;
    requireMultipleOf5: boolean;
    isAnteMeridiem: boolean;
    isPostMeridiem: boolean;
}
const domainCache = new Map<string, {blocks: ClockBlock[]; count: number}>();

/** Each minute contributes one contiguous second interval; no timestamps are materialized. */
function halfDayDomain(mode: ClockProfile['mode'], range: CanonicalNumericRange, fiveMinutes: boolean) {
    const key = JSON.stringify([mode, range, fiveMinutes]);
    const cached = domainCache.get(key);
    if (cached) return cached;
    const blocks: ClockBlock[] = [];
    const minutes = mode === 'whole-hour' || mode === 'zero-minutes' ? [0]
        : mode === 'half-hour' ? [30]
        : fiveMinutes ? [5, 15, 25, 35, 45, 55]
        : Array.from({length: mode === 'positive-minutes' ? 59 : 60}, (_, index) =>
            index + (mode === 'positive-minutes' ? 1 : 0));
    if (!fiveMinutes || mode === 'positive-minutes') {
        for (let hour = 0; hour < 12; hour++) for (const minute of minutes) {
            const displayedHour = hour || 12;
            const minimum = Math.min(displayedHour, minute), maximum = Math.max(displayedHour, minute);
            if (minimum < range.min || maximum > range.max) continue;
            if (mode !== 'legacy-seconds' && mode !== 'zero-seconds') {
                if (maximum > range.maximumAbove && minimum < range.minimumBelow) {
                    blocks.push({hour, minute, firstSecond: 0, count: 1});
                }
                continue;
            }
            const firstSecond = Math.max(0, range.min, maximum > range.maximumAbove ? 0 : range.maximumAbove + 1);
            const lastSecond = Math.min(mode === 'zero-seconds' ? 0 : 59, range.max,
                minimum < range.minimumBelow ? 59 : range.minimumBelow - 1);
            if (firstSecond <= lastSecond) blocks.push({hour, minute, firstSecond, count: lastSecond - firstSecond + 1});
        }
    }
    const domain = {blocks, count: blocks.reduce((total, block) => total + block.count, 0)};
    domainCache.set(key, domain);
    return domain;
}

const modes: ClockProfile['mode'][] = ['whole-hour', 'half-hour', 'zero-minutes',
    'positive-minutes', 'legacy-seconds', 'zero-seconds'];
// Feasibility depends on displayed components; AM/PM each has exactly the same12-hour support.
export const clockRangeProfiles = canonicalRangeProfiles.filter(({range}) => modes.some(mode =>
    halfDayDomain(mode, range, false).count > 0
));

function canonicalDomain(profile: ClockProfile, range: CanonicalNumericRange, fiveMinutes: boolean) {
    const canonical = clockRangeProfiles.find(profile => Object.entries(profile.range)
        .every(([key, value]) => range?.[key as keyof CanonicalNumericRange] === value));
    return canonical ? halfDayDomain(profile.mode, canonical.range, fiveMinutes) : undefined;
}
export function clockCaseCount(config: CanonicalClockConfig): number {
    if (config.isAnteMeridiem && config.isPostMeridiem) return 0;
    const domain = canonicalDomain(config.clockProfile, config.range, config.requireMultipleOf5);
    return (domain?.count ?? 0) * (config.isAnteMeridiem || config.isPostMeridiem ? 1 : 2);
}

/** Decode a canonical component case back to the existing seconds-since-midnight payload. */
export function clockCaseAt(config: CanonicalClockConfig, index: number): number {
    const domain = canonicalDomain(config.clockProfile, config.range, config.requireMultipleOf5);
    if (!domain || !Number.isSafeInteger(index) || index < 0 || index >= clockCaseCount(config)) {
        throw new RangeError('Unsupported canonical clock profile or case index.');
    }
    const periodOffset = config.isPostMeridiem || !config.isAnteMeridiem && index >= domain.count ? 12 : 0;
    let offset = index % domain.count;
    for (const block of domain.blocks) {
        if (offset < block.count) return (block.hour + periodOffset) * 3600 + block.minute * 60 + block.firstSecond + offset;
        offset -= block.count;
    }
    throw new RangeError('Clock case index exceeded its finite domain.');
}
