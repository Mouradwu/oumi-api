import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Wilaya } from './geography/wilaya.entity';
import { User } from './users/user.entity';
import { Donor } from './donors/donor.entity';
import { DonationRequest } from './requests/donation-request.entity';
import { Hospital } from './hospitals/hospital.entity';
import { TransfusionCenter } from './health-facilities/transfusion-center.entity';
import { Notification } from './notifications/notification.entity';
import { Conversation } from './messages/conversation.entity';
import { Message } from './messages/message.entity';
import { Campaign } from './campaigns/campaign.entity';
import { Association } from './associations/association.entity';
import { GeographyModule } from './geography/geography.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DonorsModule } from './donors/donors.module';
import { RequestsModule } from './requests/requests.module';
import { MatchingModule } from './matching/matching.module';
import { HealthFacilitiesModule } from './health-facilities/health-facilities.module';
import { NotificationsModule } from './notifications/notifications.module';
import { MessagesModule } from './messages/messages.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { AssociationsModule } from './associations/associations.module';

@Module({
  imports: [
    DonorsModule,
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [Wilaya, User, Donor, DonationRequest, Hospital, TransfusionCenter, Notification, Conversation, Message, Campaign, Association],
      synchronize: false,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    }),
    GeographyModule,
    AuthModule,
    UsersModule,
    DonorsModule,
    RequestsModule,
    MatchingModule,
    HealthFacilitiesModule,
    NotificationsModule,
    MessagesModule,
    CampaignsModule,
    AssociationsModule,
  ],
})
export class AppModule {}