import { IsNotEmpty, IsString, IsOptional, IsNumber, IsArray, IsIn, IsDateString } from 'class-validator';

export class CreateDonorDto {
  @IsString()
  @IsIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
  blood_type: string;

  @IsArray()
  @IsOptional()
  donation_types?: string[];

  @IsNumber()
  @IsOptional()
  wilaya_id?: number;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;

  @IsString()
  @IsIn(['green', 'orange', 'red'])
  @IsOptional()
  availability_status?: string;

  @IsDateString()
  @IsOptional()
  last_donation_date?: string;
}