/**
 * Thin abstraction around a Uint32Array which allows to push tokens
 * whithout caring for the offset. It is used as a way to avoid multiple
 * allocations while calling tokenization (mostly beneficitial for
 * `NetworkFilter.getTokens()`).
 */
export default class TokensBuffer {
  public readonly size: number;
  public pos: number;
  private readonly buffer: Uint32Array;

  constructor(size: number) {
    this.size = size;
    this.pos = 0;
    this.buffer = new Uint32Array(size);
  }

  public seekZero(): void {
    this.pos = 0;
  }

  public slice(): Uint32Array {
    if (this.pos !== 0 && this.pos > this.buffer.length) {
      throw new Error(`StaticDataView too small: ${this.buffer.length}, but required ${this.pos}`);
    }
    return this.buffer.slice(0, this.pos);
  }

  public push(token: number): void {
    this.buffer[this.pos++] = token;
  }
}
