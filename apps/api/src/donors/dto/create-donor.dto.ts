import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateDonorDto {
  @IsString()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsNotEmpty()
  blood_group: string;

  @IsArray()
  @IsOptional()
  donation_types?: string[];

  @IsString()
  @IsNotEmpty()
  wilaya: string;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;

  @IsBoolean()
  @IsOptional()
  availability?: boolean;

  @IsBoolean()
  @IsOptional()
  certified?: boolean;

  @IsBoolean()
  @IsOptional()
  has_donated_before?: boolean;

  @IsString()
  @IsOptional()
  last_donation_date?: string;
}