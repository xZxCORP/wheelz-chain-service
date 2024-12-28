import type { ChainStats } from '@zcorp/shared-typing-wheelz';
import dayjs from 'dayjs';

import type { ChainRepository } from '../../domain/repositories/chain.repository.js';
export class GetChainStatsUseCase {
  constructor(private readonly chainRepository: ChainRepository) {}
  async execute(): Promise<ChainStats> {
    const blocks = await this.chainRepository.getBlocks();
    if (blocks.length === 0) {
      return {
        evolutionOfTransactions: [],
        evolutionOfVehicles: [],
        lastExecution: null,
      };
    }
    const sortedBlocks = blocks.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    const lastBlock = sortedBlocks.at(-1);
    const dateMap = new Map<
      string,
      { totalTransactions: number; newTransactions: number; totalVehicles: number }
    >();
    const evolutionOfTransactions: ChainStats['evolutionOfTransactions'] = [];
    const evolutionOfVehicles: ChainStats['evolutionOfVehicles'] = [];
    let totalTransactions = 0;
    let totalVehicles = 0;
    for (const block of sortedBlocks) {
      const formattedDate = dayjs(block.timestamp).format('YYYY-MM-DD');
      const data = dateMap.get(formattedDate) ?? {
        totalTransactions: totalTransactions,
        totalVehicles: totalVehicles,
        newTransactions: 0,
      };
      totalTransactions += block.transactions.length;
      for (const transaction of block.transactions) {
        if (transaction.action === 'create') {
          totalVehicles++;
        } else if (transaction.action === 'delete') {
          totalVehicles--;
        }
      }
      data.totalTransactions = totalTransactions;
      data.totalVehicles = totalVehicles;
      data.newTransactions += block.transactions.length;

      dateMap.set(formattedDate, data);
    }
    for (const [date, data] of dateMap.entries()) {
      evolutionOfTransactions.push({
        date,
        value: data.totalTransactions,
      });
      evolutionOfVehicles.push({
        date,
        value: data.totalVehicles,
      });
    }
    const lastExecutionDate = dayjs(lastBlock!.timestamp).format('YYYY-MM-DD');
    return {
      evolutionOfTransactions,
      evolutionOfVehicles,
      lastExecution: {
        date: lastExecutionDate,
        newTransactions: dateMap.get(lastExecutionDate)!.newTransactions ?? 0,
      },
    };
  }
}
