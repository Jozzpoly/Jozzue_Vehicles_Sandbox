export interface E1Vec3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface E1Document {
  readonly experiment: "e1-causal-spine";
  readonly revision: number;
  readonly pivot: {
    readonly origin: E1Vec3;
    readonly axis: E1Vec3;
  };
  readonly arm: {
    readonly restDirection: E1Vec3;
    readonly length: number;
    readonly angleMinRad: number;
    readonly angleMaxRad: number;
  };
  readonly damper: {
    readonly upperHardpoint: E1Vec3;
    readonly lowerConnection: "arm-end" | null;
  };
}

export type E1EditReason = "upper-hardpoint-drag";

export interface E1HistoryEntry {
  readonly reason: E1EditReason;
  readonly before: E1Document;
  readonly after: E1Document;
}

export function cloneE1Document(document: E1Document): E1Document {
  return structuredClone(document);
}

export function e1DocumentEquals(a: E1Document, b: E1Document): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
