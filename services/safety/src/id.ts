export interface IdGen {
  next(): string;
}

export function counterIdGen(prefix = 'id'): IdGen {
  let n = 0;
  return {
    next: () => `${prefix}_${(++n).toString().padStart(6, '0')}`,
  };
}
