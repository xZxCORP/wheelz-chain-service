export interface ManagedResource {
  initialize(): Promise<void>;
  dispose(): Promise<void>;
}
