import {
  cloneE1Document,
  e1DocumentEquals,
  type E1Document,
  type E1EditReason,
  type E1HistoryEntry,
} from "./model.js";

interface E1Preview {
  readonly reason: E1EditReason;
  readonly before: E1Document;
  current: E1Document;
}

export class E1EditSession {
  #document: E1Document;
  #history: E1HistoryEntry[] = [];
  #preview: E1Preview | null = null;

  constructor(initialDocument: E1Document) {
    this.#document = cloneE1Document(initialDocument);
  }

  get document(): E1Document {
    return cloneE1Document(this.#preview?.current ?? this.#document);
  }

  get committedDocument(): E1Document {
    return cloneE1Document(this.#document);
  }

  get historyLength(): number {
    return this.#history.length;
  }

  get hasPreview(): boolean {
    return this.#preview !== null;
  }

  beginPreview(reason: E1EditReason): void {
    if (this.#preview) {
      throw new Error("An E1 edit preview is already active.");
    }
    const before = cloneE1Document(this.#document);
    this.#preview = { reason, before, current: cloneE1Document(before) };
  }

  updatePreview(mutator: (draft: E1Document) => E1Document): void {
    if (!this.#preview) {
      throw new Error("Cannot update an E1 edit without an active preview.");
    }
    const candidate = mutator(cloneE1Document(this.#preview.before));
    this.#preview.current = cloneE1Document(candidate);
  }

  commitPreview(): boolean {
    if (!this.#preview) {
      return false;
    }
    const preview = this.#preview;
    this.#preview = null;
    if (e1DocumentEquals(preview.before, preview.current)) {
      return false;
    }
    const after = {
      ...cloneE1Document(preview.current),
      revision: preview.before.revision + 1,
    } satisfies E1Document;
    this.#history.push({
      reason: preview.reason,
      before: cloneE1Document(preview.before),
      after: cloneE1Document(after),
    });
    this.#document = after;
    return true;
  }

  cancelPreview(): boolean {
    if (!this.#preview) {
      return false;
    }
    this.#preview = null;
    return true;
  }

  undo(): boolean {
    this.cancelPreview();
    const entry = this.#history.pop();
    if (!entry) {
      return false;
    }
    this.#document = cloneE1Document(entry.before);
    return true;
  }
}
