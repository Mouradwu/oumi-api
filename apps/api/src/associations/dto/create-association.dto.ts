import { IsNotEmpty, IsString, IsOptional, IsNumber, IsEmail } from 'class-validator';

export class CreateAssociationDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  name_ar?: string;

  @IsNumber()
  @IsOptional()
  wilaya_id?: number;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  description?: string;
}