import { describe, expect, it } from 'vitest';

import { InMemoryChainStateRepository } from '../../../tests/fakes/in-memory-chain-state.repository.js';
import { vehicleFixture } from '../../domain/entities/vehicle.fixture.js';
import { GetVehicleOfTheChainByVinUseCase } from './get-vehicle-of-the-chain-by-vin.js';

describe('GetVehicleOfTheChainByVinUseCase', () => {
  it('returns vehicle when found by VIN', async () => {
    // Arrange
    const vehicle = { ...vehicleFixture, userId: 'user-1' };
    const repo = new InMemoryChainStateRepository(new Map([[vehicle.vin, vehicle]]));
    const sut = new GetVehicleOfTheChainByVinUseCase(repo);

    // Act
    const result = await sut.execute(vehicle.vin);

    // Assert
    expect(result).toEqual(vehicle);
  });

  it('returns null when vehicle not found', async () => {
    // Arrange
    const repo = new InMemoryChainStateRepository();
    const sut = new GetVehicleOfTheChainByVinUseCase(repo);

    // Act
    const result = await sut.execute('nonexistent-vin');

    // Assert
    expect(result).toBeNull();
  });
});
