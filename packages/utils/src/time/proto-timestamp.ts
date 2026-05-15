export function protoTimestampToDate(timestamp?: { seconds: bigint; nanos: number }): Date {
  if (!timestamp) {
    return new Date();
  }

  return new Date(Number(timestamp.seconds) * 1000 + Math.floor(timestamp.nanos / 1_000_000));
}

export function protoTimestampToIsoString(timestamp?: { seconds: bigint; nanos: number }): string | undefined {
  if (!timestamp) {
    return undefined;
  }

  return protoTimestampToDate(timestamp).toISOString();
}
