import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateRequestDto {
  @IsString()
  @IsNotEmpty()
  blood_type: string;

  @IsString()
  @IsNotEmpty()
  donation_type: string;

  @IsNumber()
  @IsNotEmpty()
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
  @IsOptional()
  urgency_level?: string;

  @IsString()
  @IsOptional()
  needed_date?: string;

  @IsString()
  @IsNotEmpty()
  contact_phone: string;

  @IsString()
  @IsOptional()
  additional_info?: string;
}