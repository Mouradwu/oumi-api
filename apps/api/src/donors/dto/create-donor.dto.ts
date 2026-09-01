import { IsArray, IsBoolean, IsDateString, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

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

  // Convertit "" ou toute valeur vide en undefined avant validation, pour
  // qu'un champ date optionnel non renseigne ne fasse jamais echouer
  // @IsDateString() avec "must be a valid ISO 8601 date string".
  @Transform(({ value }) => (value ? value : undefined))
  @IsDateString()
  @IsOptional()
  last_donation_date?: string;
}
