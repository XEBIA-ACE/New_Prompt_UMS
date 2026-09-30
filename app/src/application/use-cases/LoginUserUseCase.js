'use strict';

const bcrypt = require('bcryptjs');
const {
  UserNotFoundError,
  InvalidCredentialsError,
  AccountNotVerifiedError,
  AccountInactiveError,
} = require('../../domain/errors');

/**
 * LoginUserUseCase — authenticates a user and returns a JWT access token.
 */
class LoginUserUseCase {
  /**
   * @param {import('../../domain/ports/IUserRepository')} userRepository
   * @param {import('../../domain/ports/ITokenService')}   tokenService
   */
  constructor(userRepository, tokenService) {
    this.userRepository = userRepository;
    this.tokenService = tokenService;
  }

  /**
   * @param {{ email: string, password: string }} dto
   * @returns {Promise<{ accessToken: string, user: import('../../domain/entities/User') }>}
   */
  async execute(dto) {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) throw new InvalidCredentialsError();

    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatch) throw new InvalidCredentialsError();

    if (!user.isActive) throw new AccountInactiveError();
    if (!user.isVerified) throw new AccountNotVerifiedError();

    const accessToken = this.tokenService.generateAccessToken({
      sub: user.id,
      email: user.email,
    });

    return { accessToken, user };
  }
}

module.exports = LoginUserUseCase;
