export class errorAPI extends Error {
    status;
    errors;
    constructor(message, status, errors) {
        super(message);
        this.name = this.constructor.name;
        this.message = message;
        this.status = status;
        this.errors = errors;
        Error.captureStackTrace(this, this.constructor);
    }
}
export default errorAPI;
