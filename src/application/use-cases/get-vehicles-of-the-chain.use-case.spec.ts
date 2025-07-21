import { describe, expect, it } from 'vitest';

import { InMemoryChainStateRepository } from '../../../tests/fakes/in-memory-chain-state.repository.js';
import { vehicleFixture } from '../../domain/entities/vehicle.fixture.js';
import { GetVehiclesOfTheChainUseCase } from './get-vehicles-of-the-chain.use-case.js';

describe('GetVehiclesOfTheChainUseCase', () => {
  it('returns paginated vehicles with no filters', async () => {
    // Arrange
    const vehicles = [
      { ...vehicleFixture, vin: 'VIN1', userId: 'user-1' },
      { ...vehicleFixture, vin: 'VIN2', userId: 'user-2' },
      { ...vehicleFixture, vin: 'VIN3', userId: 'user-3' },
    ];
    const repo = new InMemoryChainStateRepository(new Map(vehicles.map((v) => [v.vin, v])));
    const sut = new GetVehiclesOfTheChainUseCase(repo);

    // Act
    const result = await sut.execute({ page: 1, perPage: 2 });

    // Assert
    expect(result.items).toHaveLength(2);
    expect(result.items).toEqual([vehicles[0], vehicles[1]]);
    expect(result.meta).toEqual({
      page: 1,
      perPage: 2,
      total: 3,
    });
  });

  it('filters vehicles by allowed user IDs', async () => {
    // Arrange
    const vehicles = [
      { ...vehicleFixture, vin: 'VIN1', userId: 'user-1' },
      { ...vehicleFixture, vin: 'VIN2', userId: 'user-2' },
      { ...vehicleFixture, vin: 'VIN3', userId: 'user-1' },
    ];
    const repo = new InMemoryChainStateRepository(new Map(vehicles.map((v) => [v.vin, v])));
    const sut = new GetVehiclesOfTheChainUseCase(repo);

    // Act
    const result = await sut.execute({ page: 1, perPage: 10 }, ['user-1']);

    // Assert
    expect(result.items).toHaveLength(2);
    expect(result.items.every((v) => v.userId === 'user-1')).toBe(true);
    expect(result.meta.total).toBe(2);
  });

  it('filters vehicles by allowed client IDs', async () => {
    // Arrange
    const vehicles = [
      { ...vehicleFixture, vin: 'VIN1', userId: 'user-1', attachedClientsIds: ['client-1'] },
      { ...vehicleFixture, vin: 'VIN2', userId: 'user-2', attachedClientsIds: ['client-2'] },
      {
        ...vehicleFixture,
        vin: 'VIN3',
        userId: 'user-3',
        attachedClientsIds: ['client-1', 'client-3'],
      },
    ];
    const repo = new InMemoryChainStateRepository(new Map(vehicles.map((v) => [v.vin, v])));
    const sut = new GetVehiclesOfTheChainUseCase(repo);

    // Act
    const result = await sut.execute({ page: 1, perPage: 10 }, undefined, ['client-1']);

    // Assert
    expect(result.items).toHaveLength(2);
    expect(result.items.every((v) => v.attachedClientsIds.includes('client-1'))).toBe(true);
    expect(result.meta.total).toBe(2);
  });

  it('handles pagination correctly', async () => {
    // Arrange
    const vehicles = Array.from({ length: 5 }, (_, index) => ({
      ...vehicleFixture,
      vin: `VIN${index + 1}`,
      userId: `user-${index + 1}`,
    }));
    const repo = new InMemoryChainStateRepository(new Map(vehicles.map((v) => [v.vin, v])));
    const sut = new GetVehiclesOfTheChainUseCase(repo);

    // Act
    const page1 = await sut.execute({ page: 1, perPage: 2 });
    const page2 = await sut.execute({ page: 2, perPage: 2 });
    const page3 = await sut.execute({ page: 3, perPage: 2 });

    // Assert
    expect(page1.items).toHaveLength(2);
    expect(page2.items).toHaveLength(2);
    expect(page3.items).toHaveLength(1);
    expect(page1.meta.total).toBe(5);
    expect(page2.meta.total).toBe(5);
    expect(page3.meta.total).toBe(5);
  });

  it('returns empty result when no vehicles match filters', async () => {
    // Arrange
    const vehicles = [
      { ...vehicleFixture, vin: 'VIN1', userId: 'user-1' },
      { ...vehicleFixture, vin: 'VIN2', userId: 'user-2' },
    ];
    const repo = new InMemoryChainStateRepository(new Map(vehicles.map((v) => [v.vin, v])));
    const sut = new GetVehiclesOfTheChainUseCase(repo);

    // Act
    const result = await sut.execute({ page: 1, perPage: 10 }, ['nonexistent-user']);

    // Assert
    expect(result.items).toHaveLength(0);
    expect(result.meta).toEqual({
      page: 1,
      perPage: 10,
      total: 0,
    });
  });
});
