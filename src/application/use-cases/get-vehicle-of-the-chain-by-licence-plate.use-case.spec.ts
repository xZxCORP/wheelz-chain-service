import { describe, expect, it } from 'vitest';

import { InMemoryChainStateRepository } from '../../../tests/fakes/in-memory-chain-state.repository.js';
import { vehicleFixture } from '../../domain/entities/vehicle.fixture.js';
import { GetVehicleOfTheChainByLicensePlateUseCase } from './get-vehicle-of-the-chain-by-licence-plate.js';

describe('GetVehicleOfTheChainByLicensePlateUseCase', () => {
  it('returns vehicle when found by license plate', async () => {
    // Arrange
    const vehicle = { ...vehicleFixture, userId: 'user-1' };
    const repo = new InMemoryChainStateRepository(new Map([[vehicle.vin, vehicle]]));
    const sut = new GetVehicleOfTheChainByLicensePlateUseCase(repo);

    // Act
    const result = await sut.execute(vehicle.infos.licensePlate);

    // Assert
    expect(result).toEqual(vehicle);
  });

  it('returns null when vehicle not found', async () => {
    // Arrange
    const repo = new InMemoryChainStateRepository();
    const sut = new GetVehicleOfTheChainByLicensePlateUseCase(repo);

    // Act
    const result = await sut.execute('NONEXISTENT');

    // Assert
    expect(result).toBeNull();
  });

  it('returns correct vehicle when multiple vehicles exist', async () => {
    // Arrange
    const vehicle1 = {
      ...vehicleFixture,
      vin: 'VIN1',
      userId: 'user-1',
      infos: { ...vehicleFixture.infos, licensePlate: 'ABC123' },
    };
    const vehicle2 = {
      ...vehicleFixture,
      vin: 'VIN2',
      userId: 'user-2',
      infos: { ...vehicleFixture.infos, licensePlate: 'XYZ789' },
    };
    const repo = new InMemoryChainStateRepository(
      new Map([
        [vehicle1.vin, vehicle1],
        [vehicle2.vin, vehicle2],
      ])
    );
    const sut = new GetVehicleOfTheChainByLicensePlateUseCase(repo);

    // Act
    const result = await sut.execute('XYZ789');

    // Assert
    expect(result).toEqual(vehicle2);
  });
});
