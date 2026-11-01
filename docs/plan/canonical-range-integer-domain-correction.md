# Integer-domain source correction migration

Baseline:7b2337ca. Six evidenced alias builders; each target changes only by adding IntegerNumbers.

The user explicitly approved repairing the underspecified integer domain on the source side.
The affected competency builders are K.OA.A.5 fluency(2 raw permutations),1.OA.C.6 fluency(6),
2.OA.B.2 fluency(2),2.NBT.B.5 fluency(4),2.NBT.B.7 written addition/subtraction(8), and
3.NBT.A.2 addition/subtraction within1000(8). Their source statements establish elementary
integer arithmetic. Correcting only one builder exposes an unchanged alias after normalization;
the30 authored permutations therefore migrate together while retaining12 normalized identities
and their existing source associations/equivalences.

Counts are unchanged:1,309 authored targets,1,270 normalized targets,1,698 matching routes,3,258 selections. No route/selection loss or addition, no deduplication-lineage change, no unmatched target, and no sampler-body change.

## Normalized identity mapping

| Old target | New target | Routes before/after |
|---|---|---|
| 1.OA.C.6-fluency~5feeba88 | 1.OA.C.6-fluency~ea8845c2 | 7/7 |
| 1.OA.C.6-fluency~7ca8ac54 | 1.OA.C.6-fluency~2853da02 | 7/7 |
| 1.OA.C.6-fluency~60372a47 | 1.OA.C.6-fluency~a7fcb3d1 | 6/6 |
| 1.OA.C.6-fluency~94118c8c | 1.OA.C.6-fluency~4b33287e | 6/6 |
| 1.OA.C.6-fluency~2f14fbcc | 1.OA.C.6-fluency~ece10e8a | 6/6 |
| 1.OA.C.6-fluency~f50a9669 | 1.OA.C.6-fluency~5c804aeb | 5/5 |
| 2.NBT.B.5-fluency~f2065664 | 2.NBT.B.5-fluency~68e6ec5e | 6/6 |
| 2.NBT.B.5-fluency~27d6f708 | 2.NBT.B.5-fluency~8604a302 | 5/5 |
| 2.NBT.B.7-written-add-subtract~7945eaca | 2.NBT.B.7-written-add-subtract~846bc828 | 4/4 |
| 2.NBT.B.7-written-add-subtract~a779a274 | 2.NBT.B.7-written-add-subtract~59ae0652 | 4/4 |
| 2.NBT.B.7-written-add-subtract~7cb7e1a2 | 2.NBT.B.7-written-add-subtract~c0b35168 | 4/4 |
| 2.NBT.B.7-written-add-subtract~9bf8899c | 2.NBT.B.7-written-add-subtract~7265f18a | 4/4 |

## Full raw alias mapping

| Old authored target | New authored target | New normalized representative |
|---|---|---|
| 1.OA.C.6-fluency~5feeba88 | 1.OA.C.6-fluency~ea8845c2 | 1.OA.C.6-fluency~ea8845c2 |
| 1.OA.C.6-fluency~7ca8ac54 | 1.OA.C.6-fluency~2853da02 | 1.OA.C.6-fluency~2853da02 |
| 1.OA.C.6-fluency~60372a47 | 1.OA.C.6-fluency~a7fcb3d1 | 1.OA.C.6-fluency~a7fcb3d1 |
| 1.OA.C.6-fluency~94118c8c | 1.OA.C.6-fluency~4b33287e | 1.OA.C.6-fluency~4b33287e |
| 1.OA.C.6-fluency~2f14fbcc | 1.OA.C.6-fluency~ece10e8a | 1.OA.C.6-fluency~ece10e8a |
| 1.OA.C.6-fluency~f50a9669 | 1.OA.C.6-fluency~5c804aeb | 1.OA.C.6-fluency~5c804aeb |
| 2.OA.B.2-fluency~60372a47 | 2.OA.B.2-fluency~a7fcb3d1 | 1.OA.C.6-fluency~a7fcb3d1 |
| 2.OA.B.2-fluency~f50a9669 | 2.OA.B.2-fluency~5c804aeb | 1.OA.C.6-fluency~5c804aeb |
| 2.NBT.B.5-fluency~60372a47 | 2.NBT.B.5-fluency~a7fcb3d1 | 1.OA.C.6-fluency~a7fcb3d1 |
| 2.NBT.B.5-fluency~f2065664 | 2.NBT.B.5-fluency~68e6ec5e | 2.NBT.B.5-fluency~68e6ec5e |
| 2.NBT.B.5-fluency~f50a9669 | 2.NBT.B.5-fluency~5c804aeb | 1.OA.C.6-fluency~5c804aeb |
| 2.NBT.B.5-fluency~27d6f708 | 2.NBT.B.5-fluency~8604a302 | 2.NBT.B.5-fluency~8604a302 |
| 2.NBT.B.7-written-add-subtract~60372a47 | 2.NBT.B.7-written-add-subtract~a7fcb3d1 | 1.OA.C.6-fluency~a7fcb3d1 |
| 2.NBT.B.7-written-add-subtract~f2065664 | 2.NBT.B.7-written-add-subtract~68e6ec5e | 2.NBT.B.5-fluency~68e6ec5e |
| 2.NBT.B.7-written-add-subtract~7945eaca | 2.NBT.B.7-written-add-subtract~846bc828 | 2.NBT.B.7-written-add-subtract~846bc828 |
| 2.NBT.B.7-written-add-subtract~a779a274 | 2.NBT.B.7-written-add-subtract~59ae0652 | 2.NBT.B.7-written-add-subtract~59ae0652 |
| 2.NBT.B.7-written-add-subtract~f50a9669 | 2.NBT.B.7-written-add-subtract~5c804aeb | 1.OA.C.6-fluency~5c804aeb |
| 2.NBT.B.7-written-add-subtract~27d6f708 | 2.NBT.B.7-written-add-subtract~8604a302 | 2.NBT.B.5-fluency~8604a302 |
| 2.NBT.B.7-written-add-subtract~7cb7e1a2 | 2.NBT.B.7-written-add-subtract~c0b35168 | 2.NBT.B.7-written-add-subtract~c0b35168 |
| 2.NBT.B.7-written-add-subtract~9bf8899c | 2.NBT.B.7-written-add-subtract~7265f18a | 2.NBT.B.7-written-add-subtract~7265f18a |
| 3.NBT.A.2-add-subtract-within-1000~60372a47 | 3.NBT.A.2-add-subtract-within-1000~a7fcb3d1 | 1.OA.C.6-fluency~a7fcb3d1 |
| 3.NBT.A.2-add-subtract-within-1000~f2065664 | 3.NBT.A.2-add-subtract-within-1000~68e6ec5e | 2.NBT.B.5-fluency~68e6ec5e |
| 3.NBT.A.2-add-subtract-within-1000~7945eaca | 3.NBT.A.2-add-subtract-within-1000~846bc828 | 2.NBT.B.7-written-add-subtract~846bc828 |
| 3.NBT.A.2-add-subtract-within-1000~a779a274 | 3.NBT.A.2-add-subtract-within-1000~59ae0652 | 2.NBT.B.7-written-add-subtract~59ae0652 |
| 3.NBT.A.2-add-subtract-within-1000~f50a9669 | 3.NBT.A.2-add-subtract-within-1000~5c804aeb | 1.OA.C.6-fluency~5c804aeb |
| 3.NBT.A.2-add-subtract-within-1000~27d6f708 | 3.NBT.A.2-add-subtract-within-1000~8604a302 | 2.NBT.B.5-fluency~8604a302 |
| 3.NBT.A.2-add-subtract-within-1000~7cb7e1a2 | 3.NBT.A.2-add-subtract-within-1000~c0b35168 | 2.NBT.B.7-written-add-subtract~c0b35168 |
| 3.NBT.A.2-add-subtract-within-1000~9bf8899c | 3.NBT.A.2-add-subtract-within-1000~7265f18a | 2.NBT.B.7-written-add-subtract~7265f18a |
| K.OA.A.5-fluency~5feeba88 | K.OA.A.5-fluency~ea8845c2 | 1.OA.C.6-fluency~ea8845c2 |
| K.OA.A.5-fluency~94118c8c | K.OA.A.5-fluency~4b33287e | 1.OA.C.6-fluency~4b33287e |

All three DecimalNumbers target guards were removed. Real corrected source targets fail positive matching on IntegerNumbers; artificial omission reproduces the old decimal-column mismatch. No other active source requires retaining these guards. Range profiles, configuration semantics, rendering and mathematical samplers are unchanged.

Validation:17 focused tests across4 files; shared type check; standards-spec check. Detailed
source text, before/after snapshots, full route lineage and unchanged sampler SHA256 hashes are
in `temp/range-autonomous/batch3/fraction-decimal/source-correction/`. Sixty-four route identities
acquire the12 new normalized target IDs; selected labels, supported mathematics and source
coverage remain unchanged. Content-derived seeds/replay/cache identities consequently change
when the dataset is regenerated. The Area allowlist, range policy and matching engine do not change.
The [combined batch acceptance](canonical-range-autonomous-rollout.md#third-autonomous-batch-acceptance)
passes the full7,601-test/932-file coverage suite and every repository gate.
