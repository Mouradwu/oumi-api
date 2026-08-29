import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Configuration globale
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors(); // Autorise les requêtes depuis le frontend
  
  // IMPORTANT : Écouter sur 0.0.0.0 pour que Railway puisse router le trafic
  // et utiliser le port fourni par l'environnement (ou 3000 par défaut)
  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  
  console.log(`✅ OUMI API est démarrée et écoute sur le port ${port}`);
}
bootstrap();