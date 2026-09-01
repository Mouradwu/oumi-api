import { DataSource } from 'typeorm';
import { Wilaya } from '../geography/entities/wilaya.entity';
import { Daira } from '../geography/entities/daira.entity';
import { Commune } from '../geography/entities/commune.entity';

const wilayasData = [
  { code: '01', name_fr: 'Adrar', name_ar: 'أدرار', latitude: 27.9, longitude: -0.28 },
  { code: '02', name_fr: 'Chlef', name_ar: 'الشلف', latitude: 36.17, longitude: 1.33 },
  { code: '03', name_fr: 'Laghouat', name_ar: 'الأغواط', latitude: 33.8, longitude: 2.88 },
  { code: '04', name_fr: 'Oum El Bouaghi', name_ar: 'أم البواقي', latitude: 35.87, longitude: 7.12 },
  { code: '05', name_fr: 'Batna', name_ar: 'باتنة', latitude: 35.56, longitude: 6.17 },
  { code: '06', name_fr: 'Béjaïa', name_ar: 'بجاية', latitude: 36.75, longitude: 5.08 },
  { code: '07', name_fr: 'Biskra', name_ar: 'بسكرة', latitude: 34.85, longitude: 5.73 },
  { code: '08', name_fr: 'Béchar', name_ar: 'بشار', latitude: 31.62, longitude: -2.22 },
  { code: '09', name_fr: 'Blida', name_ar: 'البليدة', latitude: 36.47, longitude: 2.83 },
  { code: '10', name_fr: 'Bouira', name_ar: 'البويرة', latitude: 36.38, longitude: 3.9 },
  { code: '11', name_fr: 'Tamanrasset', name_ar: 'تمنراست', latitude: 22.79, longitude: 5.52 },
  { code: '12', name_fr: 'Tébessa', name_ar: 'تبسة', latitude: 35.4, longitude: 8.12 },
  { code: '13', name_fr: 'Tlemcen', name_ar: 'تلمسان', latitude: 34.88, longitude: -1.32 },
  { code: '14', name_fr: 'Tiaret', name_ar: 'تيارت', latitude: 35.37, longitude: 1.32 },
  { code: '15', name_fr: 'Tizi Ouzou', name_ar: 'تيزي وزو', latitude: 36.7, longitude: 4.05 },
  { code: '16', name_fr: 'Alger', name_ar: 'الجزائر', latitude: 36.75, longitude: 3.05 },
  { code: '17', name_fr: 'Djelfa', name_ar: 'الجلفة', latitude: 34.67, longitude: 3.25 },
  { code: '18', name_fr: 'Jijel', name_ar: 'جيجل', latitude: 36.82, longitude: 5.77 },
  { code: '19', name_fr: 'Sétif', name_ar: 'سطيف', latitude: 36.19, longitude: 5.41 },
  { code: '20', name_fr: 'Saïda', name_ar: 'سعيدة', latitude: 34.83, longitude: 0.15 },
  { code: '21', name_fr: 'Skikda', name_ar: 'سكيكدة', latitude: 36.87, longitude: 6.9 },
  { code: '22', name_fr: 'Sidi Bel Abbès', name_ar: 'سيدي بلعباس', latitude: 35.19, longitude: -0.64 },
  { code: '23', name_fr: 'Annaba', name_ar: 'عنابة', latitude: 36.9, longitude: 7.77 },
  { code: '24', name_fr: 'Guelma', name_ar: 'قالمة', latitude: 36.46, longitude: 7.43 },
  { code: '25', name_fr: 'Constantine', name_ar: 'قسنطينة', latitude: 36.36, longitude: 6.61 },
  { code: '26', name_fr: 'Médéa', name_ar: 'المدية', latitude: 36.27, longitude: 2.75 },
  { code: '27', name_fr: 'Mostaganem', name_ar: 'مستغانم', latitude: 35.93, longitude: 0.09 },
  { code: '28', name_fr: "M'Sila", name_ar: 'المسيلة', latitude: 35.7, longitude: 4.53 },
  { code: '29', name_fr: 'Mascara', name_ar: 'معسكر', latitude: 35.4, longitude: 0.14 },
  { code: '30', name_fr: 'Ouargla', name_ar: 'ورقلة', latitude: 31.95, longitude: 5.33 },
  { code: '31', name_fr: 'Oran', name_ar: 'وهران', latitude: 35.7, longitude: -0.64 },
  { code: '32', name_fr: 'El Bayadh', name_ar: 'البيض', latitude: 33.68, longitude: 1.02 },
  { code: '33', name_fr: 'Illizi', name_ar: 'إليزي', latitude: 26.5, longitude: 8.48 },
  { code: '34', name_fr: 'Bordj Bou Arreridj', name_ar: 'برج بوعريريج', latitude: 36.07, longitude: 4.77 },
  { code: '35', name_fr: 'Boumerdès', name_ar: 'بومرداس', latitude: 36.77, longitude: 3.48 },
  { code: '36', name_fr: 'El Tarf', name_ar: 'الطارف', latitude: 36.77, longitude: 8.31 },
  { code: '37', name_fr: 'Tindouf', name_ar: 'تندوف', latitude: 27.67, longitude: -8.72 },
  { code: '38', name_fr: 'Tissemsilt', name_ar: 'تيسمسيلت', latitude: 35.6, longitude: 1.81 },
  { code: '39', name_fr: 'El Oued', name_ar: 'الوادي', latitude: 33.36, longitude: 6.86 },
  { code: '40', name_fr: 'Khenchela', name_ar: 'خنشلة', latitude: 35.42, longitude: 7.14 },
  { code: '41', name_fr: 'Souk Ahras', name_ar: 'سوق أهراس', latitude: 36.28, longitude: 7.95 },
  { code: '42', name_fr: 'Tipaza', name_ar: 'تيبازة', latitude: 36.59, longitude: 2.45 },
  { code: '43', name_fr: 'Mila', name_ar: 'ميلة', latitude: 36.45, longitude: 6.26 },
  { code: '44', name_fr: 'Aïn Defla', name_ar: 'عين الدفلى', latitude: 36.25, longitude: 1.97 },
  { code: '45', name_fr: 'Naâma', name_ar: 'النعامة', latitude: 33.27, longitude: -0.31 },
  { code: '46', name_fr: 'Aïn Témouchent', name_ar: 'عين تموشنت', latitude: 35.3, longitude: -1.14 },
  { code: '47', name_fr: 'Ghardaïa', name_ar: 'غرداية', latitude: 32.49, longitude: 3.67 },
  { code: '48', name_fr: 'Relizane', name_ar: 'غليزان', latitude: 35.73, longitude: 0.56 },
  { code: '49', name_fr: 'El M\'ghair', name_ar: 'المغير', latitude: 33.95, longitude: 5.92 },
  { code: '50', name_fr: 'El Meniaa', name_ar: 'المنيعة', latitude: 30.58, longitude: 2.88 },
  { code: '51', name_fr: 'Ouled Djellal', name_ar: 'أولاد جلال', latitude: 34.42, longitude: 5.07 },
  { code: '52', name_fr: 'Bordj Baji Mokhtar', name_ar: 'برج باجي مختار', latitude: 21.33, longitude: 0.95 },
  { code: '53', name_fr: 'Béni Abbès', name_ar: 'بني عباس', latitude: 30.13, longitude: -2.17 },
  { code: '54', name_fr: 'Timimoun', name_ar: 'تيميمون', latitude: 29.26, longitude: 0.23 },
  { code: '55', name_fr: 'Touggourt', name_ar: 'تقرت', latitude: 33.1, longitude: 6.06 },
  { code: '56', name_fr: 'Djanet', name_ar: 'جانت', latitude: 24.55, longitude: 9.48 },
  { code: '57', name_fr: 'In Salah', name_ar: 'عين صالح', latitude: 27.19, longitude: 2.47 },
  { code: '58', name_fr: 'In Guezzam', name_ar: 'عين قزام', latitude: 19.57, longitude: 8.0 },
];

async function seedWilayas() {
  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    // Wilaya a une relation @OneToMany vers Daira (qui elle-meme relie
    // Commune) : TypeORM doit connaitre toutes les entites du graphe de
    // relations pour construire ses metadonnees, meme si ce script ne
    // manipule que Wilaya.
    entities: [Wilaya, Daira, Commune],
    synchronize: false,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  await dataSource.initialize();
  
  const repository = dataSource.getRepository(Wilaya);
  
  // Vérifier si déjà peuplé
  const count = await repository.count();
  if (count > 0) {
    console.log(`✅ La table wilayas contient déjà ${count} wilayas.`);
    process.exit(0);
  }
  
  // Insérer les wilayas
  await repository.save(wilayasData);
  console.log(`✅ ${wilayasData.length} wilayas insérées avec succès !`);
  
  await dataSource.destroy();
  process.exit(0);
}

seedWilayas();