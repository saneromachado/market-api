import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';

import { PrismaService } from '../prisma/prisma.service';
import type { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  public constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  public async login(input: LoginDto): Promise<{
    accessToken: string;
    tokenType: 'Bearer';
    expiresIn: string;
    user: { id: string; name: string; email: string; role: string };
  }> {
    const user = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (user === null || !user.active || !(await compare(input.password, user.passwordHash))) {
      throw new UnauthorizedException('E-mail ou senha inválidos');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: process.env.JWT_EXPIRES_IN ?? '1h',
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    };
  }
}
