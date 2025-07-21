import type { DateProviderPort } from '../../src/application/ports/date-provider.port.js';

export class FakeDateProvider implements DateProviderPort {
  constructor(private readonly fixedDate: Date = new Date('2024-01-01T00:00:00Z')) {}

  now(): Date {
    return this.fixedDate;
  }
}
