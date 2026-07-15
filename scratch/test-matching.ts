import { spec as orderingSpec } from '../../../Documents/EduGraph/edugraph-content/src/generators/ordering/spec.ts';
import { KindergartenSpec } from '../../../Documents/EduGraph/edugraph-content/config/spec/ccss/kindergarten.ts';
import { doesGeneratorSupportCompetency, isSubConceptOf } from '../../../Documents/EduGraph/edugraph-content/src/lib/ontology.ts';
import { Scope } from 'edugraph-ts';

const target = KindergartenSpec.find(t => t.id === '1.NBT.A.1-ordering-with-zero')!;
console.log('Target Labels:', target.labels);
console.log('Generator supportedLabels:', orderingSpec.supportedLabels);

for (const label of target.labels) {
    const matched = orderingSpec.supportedLabels.some((genLabel: string) => isSubConceptOf(label, genLabel));
    console.log(`Checking label [${label}]:`, {
        matched,
        isSub: orderingSpec.supportedLabels.map((genLabel: string) => ({
            genLabel,
            isSub: isSubConceptOf(label, genLabel)
        }))
    });
}

console.log('Final Match:', doesGeneratorSupportCompetency(orderingSpec.supportedLabels, target.labels));
