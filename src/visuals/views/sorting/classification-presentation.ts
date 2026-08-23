export type ClassificationShape = 'circle' | 'square' | 'triangle';
export type ClassificationColor = 'red' | 'blue' | 'green';

export type ClassificationItem = {
    shape: ClassificationShape;
    color: ClassificationColor;
};

export type ShapeClassificationPresentation = {
    items: ClassificationItem[];
    mappedCategories: Record<string, ClassificationShape>;
};

const SHAPES: readonly ClassificationShape[] = ['circle', 'square', 'triangle'];
const COLORS: readonly ClassificationColor[] = ['red', 'blue', 'green'];

const randomSequence = (initialSeed: number) => {
    let seed = initialSeed;
    return () => {
        const value = Math.sin(seed++) * 10000;
        return value - Math.floor(value);
    };
};

export const buildShapeClassificationPresentation = (
    categories: Readonly<Record<string, number>>,
    seed: number
): ShapeClassificationPresentation => {
    const nextRandom = randomSequence(seed);
    const categoryIds = Object.keys(categories).sort();
    const mappedCategories = Object.fromEntries(categoryIds.map((categoryId, index) => [
        categoryId,
        SHAPES[index % SHAPES.length]!
    ]));
    const items = categoryIds.flatMap(categoryId =>
        Array.from({length: categories[categoryId]!}, (): ClassificationItem => ({
            shape: mappedCategories[categoryId]!,
            color: COLORS[Math.floor(nextRandom() * COLORS.length)]!
        }))
    );

    for (let index = items.length - 1; index > 0; index--) {
        const otherIndex = Math.floor(nextRandom() * (index + 1));
        [items[index], items[otherIndex]] = [items[otherIndex]!, items[index]!];
    }
    return {items, mappedCategories};
};
