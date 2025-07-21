import { describe, expect, it } from 'vitest';

import { InMemoryChainStateRepository } from '../../../tests/fakes/in-memory-chain-state.repository.js';
import { vehicleFixture } from '../../domain/entities/vehicle.fixture.js';
import { ResetChainStateUseCase } from './reset-chain-state.use-case.js';

describe('ResetChainStateUseCase', () => {
  it('clears all vehicles from repository', async () => {
    // Arrange
    const vehicles = [
      { ...vehicleFixture, vin: 'VIN1', userId: 'user-1' },
      { ...vehicleFixture, vin: 'VIN2', userId: 'user-2' },
      { ...vehicleFixture, vin: 'VIN3', userId: 'user-3' },
    ];
    const repo = new InMemoryChainStateRepository(new Map(vehicles.map((v) => [v.vin, v])));
    const sut = new ResetChainStateUseCase(repo);

    // Act
    const result = await sut.execute();

    // Assert
    expect(result).toBe(true);
    const remainingVehicles = await repo.getVehicles({ page: 1, perPage: 10 });
    expect(remainingVehicles.items).toHaveLength(0);
    expect(remainingVehicles.meta.total).toBe(0);
  });

  it('succeeds when repository is already empty', async () => {
    // Arrange
    const repo = new InMemoryChainStateRepository();
    const sut = new ResetChainStateUseCase(repo);

    // Act
    const result = await sut.execute();

    // Assert
    expect(result).toBe(true);
    const vehicles = await repo.getVehicles({ page: 1, perPage: 10 });
    expect(vehicles.items).toHaveLength(0);
  });

  it('removes all vehicle data including related information', async () => {
    // Arrange
    const vehicle = {
      ...vehicleFixture,
      vin: 'VIN1',
      userId: 'user-1',
      attachedClientsIds: ['client-1'],
      history: [{ date: '2024-01-01', type: 'Test Entry' }],
      technicalControls: [
        {
          date: '2024-01-01',
          result: 'OK',
          resultRaw: 'All good',
          nature: 'Regular check',
          km: 50_000,
          fileUrl: null,
        },
      ],
    };
    const repo = new InMemoryChainStateRepository(new Map([[vehicle.vin, vehicle]]));
    const sut = new ResetChainStateUseCase(repo);

    // Act
    await sut.execute();

    // Assert
    const vehicleByVin = await repo.getVehicleByVin(vehicle.vin);
    expect(vehicleByVin).toBeNull();

    const vehicleByPlate = await repo.getVehicleByLicensePlate(vehicle.infos.licensePlate);
    expect(vehicleByPlate).toBeNull();
  });
});
