import { join } from 'path';

export function contractsProtoRoot(fromDirname: string): string {
  return join(fromDirname, '../../../../../../contracts/proto');
}
