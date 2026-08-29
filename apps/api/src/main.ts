import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Configuration globale
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors(); 
  
  // FORCE LE PORT 3000 (Standard Railway)
  const port = 3000;
  await app.listen(port, '0.0.0.0');
  
  console.log(`✅ OUMI API est démarrée et écoute sur le port ${port}`);
}
bootstrap();