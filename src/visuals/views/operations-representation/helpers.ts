export interface LayoutConfig {
    startX: number;
    spacing: number;
}

export function getAdditionLayout(num1: number, num2: number, spacing = 45): LayoutConfig {
    const total = num1 + num2;
    const startX = 225 - ((total - 1) * spacing) / 2;
    return { startX, spacing };
}

export function getSubtractionLayout(num1: number, spacing = 45): LayoutConfig {
    const startX = 225 - ((num1 - 1) * spacing) / 2;
    return { startX, spacing };
}
