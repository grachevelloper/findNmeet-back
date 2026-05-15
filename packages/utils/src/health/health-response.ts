export function buildHealthResponse(service: string): { status: 'ok'; service: string } {
  return { status: 'ok', service };
}
