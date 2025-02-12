import type { UserServicePort } from '../ports/user-service.port.js';

export class GetCompanyByIdUseCase {
  constructor(private readonly userService: UserServicePort) {}

  execute(id: string) {
    return this.userService.getCompanyById(id);
  }
}
