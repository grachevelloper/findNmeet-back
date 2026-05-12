import { HttpException } from '@nestjs/common';

export function extractHttpErrorMessage(error: HttpException): string {
  const response = error.getResponse();

  if (typeof response === 'object' && response !== null && 'error' in response) {
    const errorBody = response.error;

    if (typeof errorBody === 'object' && errorBody !== null && 'message' in errorBody) {
      return String(errorBody.message);
    }
  }

  return error.message;
}
