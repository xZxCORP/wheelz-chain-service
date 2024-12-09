export interface HasherPort {
  hash(data: string): Promise<string>;
}
