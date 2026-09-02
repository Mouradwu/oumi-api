import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

// A utiliser TOUJOURS apres JwtAuthGuard (ex: @UseGuards(JwtAuthGuard, AdminGuard))
// - depend de req.user deja peuple par la strategie JWT. La verification
// est faite cote serveur a partir du contenu du token signe, jamais a
// partir d'une donnee envoyee librement par le client.
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const roles: string[] = req.user?.roles || [];
    if (!roles.includes('admin')) {
      throw new ForbiddenException('Accès réservé aux administrateurs.');
    }
    return true;
  }
}
