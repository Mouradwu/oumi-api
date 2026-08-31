import { Injectable, UnauthorizedException, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<User> {
    try {
      const { email, password, first_name, last_name, phone } = registerDto;
      // Vérifier si l'utilisateur existe déjà
      const existing = await this.usersRepository.findOne({ where: { email } });
      if (existing) {
        throw new BadRequestException('Cet email est déjà utilisé.');
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = this.usersRepository.create({
        email,
        password: hashedPassword,
        first_name,
        last_name,
        phone,
        roles: [],  // important : initialiser le tableau
      });
      const saved = await this.usersRepository.save(user);
      return saved;
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
      // Renvoyer une erreur claire au frontend
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Erreur interne lors de l\'inscription. Vérifiez les logs.');
    }
  }

  async login(loginDto: LoginDto): Promise<{ access_token: string; user: any }> {
    const { email, password } = loginDto;
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) throw new UnauthorizedException('Identifiants invalides');
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) throw new UnauthorizedException('Identifiants invalides');
    const payload = { sub: user.id, email: user.email, roles: user.roles || [] };
    const access_token = this.jwtService.sign(payload);
    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        roles: user.roles || [],
      },
    };
  }

  async getProfile(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');
    return user;
  }

  async validateUser(id: string): Promise<any> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new UnauthorizedException('Utilisateur non trouvé');
    return {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      roles: user.roles || [],
    };
  }
}
