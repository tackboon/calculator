export class CustomError extends Error {
  public readonly statusCode: number;
  public readonly msg: string;

  constructor(msg: string, statusCode: number) {
    super(msg);
    this.statusCode = statusCode;
    this.msg = msg;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CustomError);
    }
  }
}
