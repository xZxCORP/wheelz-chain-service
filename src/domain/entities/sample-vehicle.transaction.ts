import type { VehicleTransaction } from '@zcorp/shared-typing-wheelz';

import { vehicleFixture } from './vehicle.fixture.js';

export const sampleVehicleTransaction: VehicleTransaction = {
  id: 'tx-123',
  timestamp: new Date('2024-01-01T00:00:00Z'),
  dataSignature: { signature: '', signAlgorithm: 'sha256' },
  withAnomaly: false,
  userId: 'user-1',
  action: 'create',
  data: vehicleFixture,
  status: 'pending',
};
