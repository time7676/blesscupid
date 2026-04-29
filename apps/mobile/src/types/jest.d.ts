declare const describe: (name: string, fn: () => void) => void;
declare const it: (name: string, fn: () => void | Promise<void>) => void;
declare const expect: (value: unknown) => {
  toBe: (expected: unknown) => void;
  toEqual: (expected: unknown) => void;
  toThrow: (expected?: string | RegExp) => void;
  toContain: (expected: string) => void;
  toMatch: (expected: RegExp) => void;
  toBeDefined: () => void;
  toBeUndefined: () => void;
  toBeNull: () => void;
  toBeTruthy: () => void;
  toBeFalsy: () => void;
  toBeGreaterThan: (n: number) => void;
  toBeGreaterThanOrEqual: (n: number) => void;
  toBeLessThan: (n: number) => void;
  toBeLessThanOrEqual: (n: number) => void;
  toHaveLength: (n: number) => void;
  not: {
    toBe: (expected: unknown) => void;
    toEqual: (expected: unknown) => void;
    toContain: (expected: string) => void;
    toMatch: (expected: RegExp) => void;
  };
  resolves: {
    toBe: (expected: unknown) => Promise<void>;
    toEqual: (expected: unknown) => Promise<void>;
  };
  rejects: {
    toThrow: (expected?: string | RegExp) => Promise<void>;
  };
};
