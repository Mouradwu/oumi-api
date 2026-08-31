export class CreateDonorDto {
  userId: string;
  blood_group: string;
  donation_types: string[];
  wilaya: string;
  latitude: number;
  longitude: number;
  availability: boolean;
  certified: boolean;
  has_donated_before: boolean;
  last_donation_date?: string;
}