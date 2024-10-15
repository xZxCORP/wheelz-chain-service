import type { DateProviderPort } from '../../../application/ports/date-provider.port.js';

export class RealDateProvider implements DateProviderPort {
  now(): Date {
    return new Date();
  }
}
