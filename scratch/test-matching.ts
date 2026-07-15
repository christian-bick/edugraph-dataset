import { spec as countingOneToOneSpec } from '../../../Documents/EduGraph/edugraph-content/src/visuals/views/counting-objects-one-to-one/spec.ts';
import { KindergartenSpec } from '../../../Documents/EduGraph/edugraph-content/config/spec/ccss/kindergarten.ts';
import { CountingGenerator } from '../../../Documents/EduGraph/edugraph-content/src/generators/counting/generator.ts';
import { doesViewSupportProblem } from '../../../Documents/EduGraph/edugraph-content/src/lib/ontology.ts';

const target = KindergartenSpec.find(t => t.id === 'K.CC.B.4a-linear-1-10')!;
const gen = new CountingGenerator();

const problemStub = gen.generate({
    labels: target.labels,
    constraints: target.constraints
})!;

console.log('Generated Problem Data:', problemStub.data);
console.log('View Supported Labels:', countingOneToOneSpec.supportedLabels);
console.log('Target Labels:', target.labels);
console.log('Labels Match:', doesViewSupportProblem(countingOneToOneSpec.supportedLabels || [], target.labels));

const viewSpec = countingOneToOneSpec;
if (viewSpec.constraints) {
    for (const [key, constraint] of Object.entries(viewSpec.constraints) as any) {
        const val = problemStub.data[key] !== undefined ? problemStub.data[key] : target.constraints[key];
        console.log(`Checking constraint [${key}]:`, {
            val,
            constraint,
            matchRange: constraint.type === 'range' ? (val >= constraint.min && val <= constraint.max) : undefined,
            matchOptions: constraint.type === 'options' ? constraint.values.includes(val) : undefined
        });
    }
}
