export interface ApiErrorEnvelope {
  error: { code: string; message: string; request_id?: string };
}

export class ApiError extends Error {
  code: string;
  status: number;
  requestId?: string;

  constructor(opts: { code: string; message: string; status: number; requestId?: string }) {
    super(opts.message);
    this.name = "ApiError";
    this.code = opts.code;
    this.status = opts.status;
    this.requestId = opts.requestId;
  }
}
