import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuration globale
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  // Applique les decorateurs @Exclude()/@Expose() (class-transformer) sur
  // toutes les reponses, ex. pour ne jamais renvoyer User.password.
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.enableCors();

  // Utiliser le PORT attribué par Railway, ou 3000 par défaut
  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');

  console.log(`OUMI API démarrée sur le port ${port}`);
}
bootstrap();
