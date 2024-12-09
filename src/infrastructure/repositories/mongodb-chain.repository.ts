import type { Block } from '@zcorp/shared-typing-wheelz';
import { Collection, Db, MongoClient, type WithId } from 'mongodb';

import type { LoggerPort } from '../../application/ports/logger.port.js';
import type { ChainRepository } from '../../domain/repositories/chain.repository.js';
import type { ManagedResource } from '../managed.resource.js';

export class MongoDBChainRepository implements ChainRepository, ManagedResource {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private collection: Collection<Block> | null = null;

  constructor(
    private readonly uri: string,
    private readonly databaseName: string,
    private readonly collectionName: string,
    private readonly logger: LoggerPort
  ) {}

  private mapToBlock(mongodbBlock: WithId<Block>): Block {
    return {
      hash: mongodbBlock.hash,
      id: mongodbBlock.id,
      previousHash: mongodbBlock.previousHash,
      timestamp: mongodbBlock.timestamp,
      transactions: mongodbBlock.transactions,
    };
  }

  async getLatestBlock(): Promise<Block | null> {
    const latestBlock = await this.collection!.findOne({}, { sort: { timestamp: -1 } });
    if (!latestBlock) {
      return null;
    }
    return this.mapToBlock(latestBlock);
  }
  async addBlock(block: Block): Promise<void> {
    await this.collection!.insertOne(block);
  }
  async getBlocks(): Promise<Block[]> {
    const objects = await this.collection!.find().sort({ timestamp: 1 }).toArray();
    return objects.map((object) => this.mapToBlock(object));
  }
  async deleteBlocks(): Promise<void> {
    await this.collection!.deleteMany({});
  }
  async isRunning(): Promise<boolean> {
    if (!this.client || !this.db || !this.collection) {
      return false;
    }
    try {
      await this.client.db('admin').command({ ping: 1 });
      return true;
    } catch {
      return false;
    }
  }

  async initialize(): Promise<void> {
    this.client = await MongoClient.connect(this.uri, {
      connectTimeoutMS: 2000,
      socketTimeoutMS: 2000,
      serverSelectionTimeoutMS: 2000,
    });
    this.db = this.client.db(this.databaseName);
    this.collection = this.db.collection<Block>(this.collectionName);
    await this.collection.createIndex({ hash: 1 }, { unique: true });
  }
  async dispose(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client.removeAllListeners();
    }
    this.db = null;
    this.collection = null;
    this.client = null;
  }
}
