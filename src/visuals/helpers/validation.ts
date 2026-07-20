export class ViewValidationError extends Error {
    constructor(viewId: string, message: string) {
        super(`[View: ${viewId}] Validation Error: ${message}`);
        this.name = 'ViewValidationError';
    }
}

export function validateProblemData(viewId: string, data: any, fields: string[]) {
    if (!data) {
        throw new ViewValidationError(viewId, 'Problem data payload is missing.');
    }
    for (const field of fields) {
        if (data[field] === undefined || data[field] === null) {
            throw new ViewValidationError(viewId, `Required field "${field}" is missing from problem data.`);
        }
        if (Array.isArray(data[field]) && data[field].length === 0) {
            throw new ViewValidationError(viewId, `Required field "${field}" in problem data is empty.`);
        }
    }
}
