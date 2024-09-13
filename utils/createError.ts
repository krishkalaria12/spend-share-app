import createHttpError from 'http-errors';

export function createError(message: string, statusCode: number, expose: boolean = false, error?: any) {
  const httpError = createHttpError(statusCode, message);
  httpError.expose = expose;
  
  if (error) {
    httpError.originalError = error;
  }

  return httpError;
}