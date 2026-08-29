import { IsNotEmpty, IsString, IsOptional, IsNumber, IsIn, IsDateString } from 'class-validator';

export class CreateRequestDto {
  @IsString()
  @IsIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
  blood_type: string;

  @IsString()
  @IsIn(['Sang', 'Plasma', 'Plaquettes'])
  donation_type: string;

  @IsNumber()
  wilaya_id: number;

  @IsNumber()
  @IsOptional()
  commune_id?: number;

  @IsString()
  @IsOptional()
  hospital_name?: string;

  @IsString()
  @IsOptional()
  service?: string;

  @IsString()
  @IsIn(['normal', 'important', 'urgent', 'critical'])
  urgency_level: string;

  @IsDateString()
  @IsOptional()
  needed_date?: string;

  @IsString()
  @IsNotEmpty()
  contact_phone: string;

  @IsString()
  @IsOptional()
  additional_info?: string;
}