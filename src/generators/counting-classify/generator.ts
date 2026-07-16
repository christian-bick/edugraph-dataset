import { ProblemGenerator, GeneratorInput, ProblemStub, AbstractProblem } from "../../types/ml-engine.ts";
import { CountingClassifyProblem } from "../../types/problems.ts";
import { random } from "../../lib/random.ts";
import { Area, Ability } from "edugraph-ts";
import { isSubConceptOf } from "../../lib/ontology.ts";

export class CountingClassifyGenerator implements ProblemGenerator<CountingClassifyProblem> {
    type: AbstractProblem['type'] = 'counting';

    generate(input: GeneratorInput): ProblemStub | null {
        const { labels, constraints } = input;

        let mode = constraints.mode;
        if (!mode && labels) {
            if (labels.some(l => isSubConceptOf(l, Area.ObjectSorting))) {
                if (labels.some(l => isSubConceptOf(l, Ability.ConceptClassification))) {
                    mode = 'classify-count';
                } else {
                    mode = 'classify-sort';
                }
            }
        }

        // Guard
        if (mode !== 'classify-count' && mode !== 'classify-sort') {
            return null;
        }

        const minTotal = constraints.minTotal || 5;
        const maxTotal = constraints.maxTotal || 10;
        const total = Math.floor(random() * (maxTotal - minTotal + 1)) + minTotal;

        const shapes = ['circle', 'square', 'triangle'];
        const colors = ['red', 'blue', 'green'];
        const classifyType = constraints.classifyType || (random() > 0.5 ? 'shape' : 'color');

        const items: { shape: string; color: string }[] = [];
        const counts: Record<string, number> = {};

        for (let i = 0; i < total; i++) {
            const shape = shapes[Math.floor(random() * shapes.length)];
            const color = colors[Math.floor(random() * colors.length)];
            items.push({ shape, color });

            const key = classifyType === 'shape' ? shape : color;
            counts[key] = (counts[key] || 0) + 1;
        }

        const possibleCategories = classifyType === 'shape' ? shapes : colors;
        possibleCategories.forEach(cat => {
            if (counts[cat] === undefined) counts[cat] = 0;
        });

        if (mode === 'classify-count') {
            return {
                id: `classify-count-${classifyType}-${total}-${Math.floor(random() * 1000)}`,
                data: {
                    mode: 'classify-count',
                    classifyType,
                    items,
                    categories: counts,
                    numObjects: total
                }
            };
        } else {
            const relation = constraints.relation || (random() > 0.5 ? 'most' : 'least');
            let targetCategory = '';
            let targetCount = relation === 'most' ? -1 : 999;
            
            possibleCategories.forEach(cat => {
                const c = counts[cat];
                if (relation === 'most') {
                    if (c > targetCount) {
                        targetCount = c;
                        targetCategory = cat;
                    }
                } else {
                    if (c < targetCount) {
                        targetCount = c;
                        targetCategory = cat;
                    }
                }
            });

            const hasTie = possibleCategories.some(cat => cat !== targetCategory && counts[cat] === targetCount);
            if (hasTie) {
                return null;
            }

            return {
                id: `classify-sort-${classifyType}-${relation}-${total}-${Math.floor(random() * 1000)}`,
                data: {
                    mode: 'classify-sort',
                    classifyType,
                    items,
                    categories: counts,
                    relation,
                    answer: targetCategory,
                    numObjects: total
                }
            };
        }
    }
}
