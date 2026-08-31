export class CreateRequestDto {
  userId: string;
  blood_group: string;
  donation_type: string;
  wilaya: string;
  hospital?: string;
  urgency?: string;
  description?: string;
  patient_name?: string;
  patient_age?: number;
  quantity?: number;
  contact_phone?: string;
}