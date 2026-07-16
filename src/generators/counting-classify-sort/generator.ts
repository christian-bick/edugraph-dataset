import { ProblemGenerator, GeneratorInput, ProblemStub, AbstractProblem } from "../../types/ml-engine.ts";
import { CountingClassifySortProblem } from "../../types/problems.ts";
import { random } from "../../lib/random.ts";

export class CountingClassifySortGenerator implements ProblemGenerator<CountingClassifySortProblem> {
    type: AbstractProblem['type'] = 'counting';

    generate(input: GeneratorInput): ProblemStub | null {
        const { constraints } = input;

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
            id: `classify-sort-${classifyType}-${relation}-${total}`,
            data: {
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
