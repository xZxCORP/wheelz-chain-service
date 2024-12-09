export interface IdGeneratorPort {
  generate(): Promise<string>;
}
