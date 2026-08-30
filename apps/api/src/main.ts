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
  await app.listen(process.env.PORT ? parseInt(process.env.PORT, 10) : 3000, '0.0.0.0');
  
  console.log(`âœ… OUMI API est dÃ©marrÃ©e et Ã©coute sur le port ${port}`);
}
bootstrap();