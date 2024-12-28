import type { ChainStats } from '@zcorp/shared-typing-wheelz';

export class GetChainStatsUseCase {
  async execute(): Promise<ChainStats> {
    return {
      evolution: [
        { date: '2024-05-01', value: 100 },
        { date: '2024-06-01', value: 200 },
        { date: '2024-07-01', value: 300 },
        { date: '2024-08-01', value: 400 },
        { date: '2024-09-01', value: 500 },
        { date: '2024-10-01', value: 600 },
        { date: '2024-11-01', value: 700 },
        { date: '2024-12-01', value: 800 },
      ],
      lastExecution: {
        date: '2024-12-01',
        newTransactions: 100,
      },
    };
  }
}
