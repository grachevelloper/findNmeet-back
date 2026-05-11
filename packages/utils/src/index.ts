const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export function buildHealthResponse(service: string): { status: 'ok'; service: string } {
  return { status: 'ok', service };
}

export function getDefaultPageSize(): number {
  return DEFAULT_PAGE_SIZE;
}

export function getMaxPageSize(): number {
  return MAX_PAGE_SIZE;
}
