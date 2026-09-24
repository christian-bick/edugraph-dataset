/** Shared by browser-safe spec declarations and the server compatibility planner. */
export class CompatibilityContractError extends Error {
    constructor(message: string, options?: ErrorOptions) {
        super(message, options);
        this.name = 'CompatibilityContractError';
    }
}
