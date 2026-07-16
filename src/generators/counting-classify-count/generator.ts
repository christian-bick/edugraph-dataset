import { ProblemGenerator, GeneratorInput, ProblemStub, AbstractProblem } from "../../types/ml-engine.ts";
import { CountingClassifyCountProblem } from "../../types/problems.ts";
import { random } from "../../lib/random.ts";

export class CountingClassifyCountGenerator implements ProblemGenerator<CountingClassifyCountProblem> {
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

        return {
            id: `classify-count-${classifyType}-${total}`,
            data: {
                classifyType,
                items,
                categories: counts,
                numObjects: total
            }
        };
    }
}
