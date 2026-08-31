import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { GeographyModule } from './geography/geography.module';
import { HealthFacilitiesModule } from './health-facilities/health-facilities.module';
import { DonorsModule } from './donors/donors.module';
import { RequestsModule } from './requests/requests.module';
import { MatchingModule } from './matching/matching.module';
import { NotificationsModule } from './notifications/notifications.module';
import { MessagesModule } from './messages/messages.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { AssociationsModule } from './associations/associations.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    AuthModule,
    GeographyModule,
    HealthFacilitiesModule,
    DonorsModule,
    RequestsModule,
    MatchingModule,
    NotificationsModule,
    MessagesModule,
    CampaignsModule,
    AssociationsModule,
  ],
})
export class AppModule {}