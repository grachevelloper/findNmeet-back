export function errorResponse(code: string, message: string) {
  return {
    error: {
      code,
      message,
    },
  };
}
