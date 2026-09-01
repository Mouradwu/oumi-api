import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuration globale
  app.useGlobalPipes(new ValidationPipe({ whitelist: false, transform: true }));
  app.enableCors();

  // Utiliser le PORT attribuÃ© par Railway, ou 3000 par dÃ©faut
  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');

  console.log(`ðŸš€ OUMI API dÃ©marrÃ©e sur le port ${port}`);
}
bootstrap();