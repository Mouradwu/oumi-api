import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  // 1. Vérification CRUCIALE de la variable d'environnement
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('❌ CRITIQUE : DATABASE_URL n\'est PAS définie dans les variables d\'environnement !');
  } else {
    // Masque le mot de passe pour l'affichage sécurisé
    const safeUrl = dbUrl.replace(/:[^:]*@/, ':****@');
    console.log('✅ DATABASE_URL est bien présente :', safeUrl);
  }

  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors();
  
  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`✅ OUMI API démarre et écoute sur le port ${port}`);
}
bootstrap();