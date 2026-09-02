import { Injectable, UnauthorizedException, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from '../users/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const EMAIL_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const OTP_TTL_MS = 10 * 60 * 1000; // 10 min

function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

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
      const existing = await this.usersRepository.findOne({ where: { email } });
      if (existing) {
        throw new BadRequestException('Cet email est déjà utilisé.');
      }
      const hashedPassword = await bcrypt.hash(password, 10);

      const isAdmin = getAdminEmails().includes(email.toLowerCase());
      const emailToken = crypto.randomBytes(32).toString('hex');

      const user = this.usersRepository.create({
        email,
        password: hashedPassword,
        first_name,
        last_name,
        phone,
        roles: isAdmin ? ['admin'] : [],
        account_status: 'pending_verification',
        email_verified: false,
        email_verification_token: emailToken,
        email_verification_expires: new Date(Date.now() + EMAIL_TOKEN_TTL_MS),
        phone_verified: false,
      });
      const saved = await this.usersRepository.save(user);

      // Aucun fournisseur email (SMTP/SendGrid/etc.) n'est configure dans ce
      // projet : le lien de verification est simplement journalise. A
      // remplacer par un vrai envoi d'email des qu'un fournisseur est
      // disponible (voir EMAIL_VERIFICATION_BASE_URL).
      const base = process.env.EMAIL_VERIFICATION_BASE_URL || 'http://localhost:3000';
      console.log(`[EMAIL] Lien de verification pour ${email} : ${base}/auth/verify-email?token=${emailToken}`);

      return saved;
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
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

    // Bootstrap admin : si l'email figure dans ADMIN_EMAILS et que le role
    // n'est pas encore present (ex: compte cree avant l'ajout de cette
    // variable), on l'ajoute au vol.
    if (getAdminEmails().includes(email.toLowerCase()) && !(user.roles || []).includes('admin')) {
      user.roles = [...(user.roles || []), 'admin'];
      await this.usersRepository.save(user);
    }

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
        is_active: user.is_active,
        account_status: user.account_status,
        email_verified: user.email_verified,
        phone_verified: user.phone_verified,
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

  // ---- Verification email ----

  async verifyEmail(token: string) {
    if (!token) throw new BadRequestException('Jeton manquant');
    const user = await this.usersRepository.findOne({ where: { email_verification_token: token } });
    if (!user) throw new BadRequestException('Jeton de vérification invalide.');
    if (user.email_verification_expires && user.email_verification_expires.getTime() < Date.now()) {
      throw new BadRequestException('Ce lien de vérification a expiré. Demandez-en un nouveau.');
    }
    user.email_verified = true;
    user.email_verification_token = null;
    user.email_verification_expires = null;
    this.recomputeAccountStatus(user);
    await this.usersRepository.save(user);
    return { success: true, message: 'Email vérifié avec succès.' };
  }

  async resendEmailVerification(userId: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');
    if (user.email_verified) return { success: true, message: 'Email déjà vérifié.' };
    const emailToken = crypto.randomBytes(32).toString('hex');
    user.email_verification_token = emailToken;
    user.email_verification_expires = new Date(Date.now() + EMAIL_TOKEN_TTL_MS);
    await this.usersRepository.save(user);
    const base = process.env.EMAIL_VERIFICATION_BASE_URL || 'http://localhost:3000';
    console.log(`[EMAIL] Lien de verification pour ${user.email} : ${base}/auth/verify-email?token=${emailToken}`);
    return { success: true, message: 'Un nouveau lien de vérification a été envoyé.' };
  }

  // ---- Verification telephone (OTP) ----

  async sendPhoneOtp(userId: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');
    if (!user.phone) throw new BadRequestException('Aucun numéro de téléphone renseigné.');
    const code = String(Math.floor(100000 + Math.random() * 900000));
    user.phone_otp_code = code;
    user.phone_otp_expires = new Date(Date.now() + OTP_TTL_MS);
    await this.usersRepository.save(user);
    // Aucun fournisseur SMS (Twilio/etc.) n'est configure : le code est
    // journalise. A remplacer par un vrai envoi SMS en production.
    console.log(`[SMS] Code de vérification pour ${user.phone} : ${code} (valide 10 min)`);
    return { success: true, message: 'Code envoyé par SMS.' };
  }

  async verifyPhoneOtp(userId: string, code: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');
    if (!user.phone_otp_code || !user.phone_otp_expires) {
      throw new BadRequestException('Aucun code en attente. Demandez-en un nouveau.');
    }
    if (user.phone_otp_expires.getTime() < Date.now()) {
      throw new BadRequestException('Ce code a expiré. Demandez-en un nouveau.');
    }
    if (user.phone_otp_code !== code) {
      throw new BadRequestException('Code incorrect.');
    }
    user.phone_verified = true;
    user.phone_otp_code = null;
    user.phone_otp_expires = null;
    this.recomputeAccountStatus(user);
    await this.usersRepository.save(user);
    return { success: true, message: 'Téléphone vérifié avec succès.' };
  }

  // Un compte passe a "active" des que l'email est verifie (le telephone
  // est encourage mais pas bloquant : de nombreux utilisateurs n'ont pas
  // de numero fiable ou preferent ne pas le partager immediatement).
  private recomputeAccountStatus(user: User) {
    if (user.account_status === 'suspended') return;
    if (user.email_verified) {
      user.account_status = 'active';
    }
  }
}
