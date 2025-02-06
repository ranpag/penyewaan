export class errorAPI extends Error {
    status: number;
    errors: unknown;

    constructor(message: string, status: number, errors?: unknown) {
        super(message);
        this.name = this.constructor.name;
        this.message = message;
        this.status = status;
        this.errors = errors;
        Error.captureStackTrace(this, this.constructor);
    }
}

export default errorAPI;
