export interface BaseTenParts {
    hundreds: number;
    tens: number;
    ones: number;
}

export function decomposeBaseTen(number: number): BaseTenParts {
    return {
        hundreds: Math.floor(number / 100),
        tens: Math.floor((number % 100) / 10),
        ones: number % 10
    };
}
