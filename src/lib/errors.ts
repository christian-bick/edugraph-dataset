export class GeneratorValidationError extends Error {
    constructor(generatorId: string, message: string) {
        super(`[Generator: ${generatorId}] Validation Error: ${message}`);
        this.name = 'GeneratorValidationError';
    }
}

export function validateConfigFields(generatorId: string, config: any, fields: string[]) {
    if (!config) {
        throw new GeneratorValidationError(generatorId, 'Configuration object is missing or null.');
    }
    for (const field of fields) {
        if (config[field] === undefined || config[field] === null) {
            throw new GeneratorValidationError(generatorId, `Required field "${field}" is missing.`);
        }
        if (Array.isArray(config[field]) && config[field].length === 0) {
            throw new GeneratorValidationError(generatorId, `Required field "${field}" is empty.`);
        }
    }
}
