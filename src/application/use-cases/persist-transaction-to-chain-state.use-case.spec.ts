import type { VehicleTransaction } from '@zcorp/shared-typing-wheelz';
import { describe, expect, it } from 'vitest';

import { InMemoryChainStateRepository } from '../../../tests/fakes/in-memory-chain-state.repository.js';
import { sampleVehicleTransaction } from '../../domain/entities/sample-vehicle.transaction.js';
import { vehicleFixture } from '../../domain/entities/vehicle.fixture.js';
import { PersistTransactionToChainStateUseCase } from './persist-transaction-to-chain-state.use-case.js';

describe('PersistTransactionToChainStateUseCase', () => {
  it('persists create transaction correctly', async () => {
    // Arrange
    const repo = new InMemoryChainStateRepository();
    const sut = new PersistTransactionToChainStateUseCase(repo);
    const transaction: VehicleTransaction = {
      ...sampleVehicleTransaction,
      action: 'create',
      data: vehicleFixture,
    };

    // Act
    await sut.execute(transaction);

    // Assert
    const savedVehicle = await repo.getVehicleByVin(vehicleFixture.vin);
    expect(savedVehicle).toEqual({
      ...vehicleFixture,
      userId: transaction.userId,
    });
  });

  it('persists update transaction correctly', async () => {
    // Arrange
    const existingVehicle = { ...vehicleFixture, userId: 'old-user' };
    const repo = new InMemoryChainStateRepository(
      new Map([[existingVehicle.vin, existingVehicle]])
    );
    const sut = new PersistTransactionToChainStateUseCase(repo);

    const updatedFeatures = {
      ...vehicleFixture.features,
      brand: 'Updated Brand',
      model: 'Updated Model',
    };
    const transaction: VehicleTransaction = {
      ...sampleVehicleTransaction,
      action: 'update',
      data: {
        vin: existingVehicle.vin,
        changes: {
          features: updatedFeatures,
        },
      },
    };

    // Act
    await sut.execute(transaction);

    // Assert
    const updatedVehicle = await repo.getVehicleByVin(existingVehicle.vin);
    expect(updatedVehicle).toEqual({
      ...existingVehicle,
      features: updatedFeatures,
      userId: transaction.userId,
    });
  });

  it('persists delete transaction correctly', async () => {
    // Arrange
    const existingVehicle = { ...vehicleFixture, userId: 'old-user' };
    const repo = new InMemoryChainStateRepository(
      new Map([[existingVehicle.vin, existingVehicle]])
    );
    const sut = new PersistTransactionToChainStateUseCase(repo);

    const transaction: VehicleTransaction = {
      ...sampleVehicleTransaction,
      action: 'delete',
      data: { vin: existingVehicle.vin },
    };

    // Act
    await sut.execute(transaction);

    // Assert
    const deletedVehicle = await repo.getVehicleByVin(existingVehicle.vin);
    expect(deletedVehicle).toBeNull();
  });

  it('handles update transaction with multiple changes', async () => {
    // Arrange
    const existingVehicle = { ...vehicleFixture, userId: 'old-user' };
    const repo = new InMemoryChainStateRepository(
      new Map([[existingVehicle.vin, existingVehicle]])
    );
    const sut = new PersistTransactionToChainStateUseCase(repo);

    const updatedFeatures = { ...vehicleFixture.features, brand: 'Updated Brand' };
    const updatedInfos = { ...vehicleFixture.infos, licensePlate: 'NEW123' };
    const updatedHistory = [{ date: '2024-01-01', type: 'New History Entry' }];
    const transaction: VehicleTransaction = {
      ...sampleVehicleTransaction,
      action: 'update',
      data: {
        vin: existingVehicle.vin,
        changes: {
          features: updatedFeatures,
          infos: updatedInfos,
          history: updatedHistory,
        },
      },
    };

    // Act
    await sut.execute(transaction);

    // Assert
    const updatedVehicle = await repo.getVehicleByVin(existingVehicle.vin);
    expect(updatedVehicle).toEqual({
      ...existingVehicle,
      features: updatedFeatures,
      infos: updatedInfos,
      history: updatedHistory,
      userId: transaction.userId,
    });
  });
});
