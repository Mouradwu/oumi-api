import { IsArray, IsBoolean, IsDateString, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateDonorDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  blood_type: string;

  @IsArray()
  @IsOptional()
  donation_types?: string[];

  @IsNumber()
  @IsOptional()
  wilaya_id?: number;

  @IsNumber()
  @IsOptional()
  daira_id?: number;

  @IsNumber()
  @IsOptional()
  commune_id?: number;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;

  @IsIn(['green', 'orange', 'red'])
  @IsOptional()
  availability_status?: string;

  @IsBoolean()
  @IsOptional()
  certified?: boolean;

  @IsBoolean()
  @IsOptional()
  has_donated_before?: boolean;

  @IsDateString()
  @IsOptional()
  last_donation_date?: string;
}
