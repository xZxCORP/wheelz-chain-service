import { generateOpenApi } from '@ts-rest/open-api';
import { chainContract } from '@zcorp/wheelz-contracts';

export const openApiDocument = generateOpenApi(
  chainContract,
  {
    info: {
      title: 'Wheelz Chain Service',
      version: '1.0.0',
    },
  },
  {
    setOperationId: true,
  }
);
