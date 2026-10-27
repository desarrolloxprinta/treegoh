export interface BotanicalAvatar {
  id: string;
  alias: string;
  species: string;
  scientificName: string;
  imageUrl: string;
  trait: string;
}

export const BOTANICAL_AVATARS: BotanicalAvatar[] = [
  {
    id: 'monstera_asesina',
    alias: 'Monstera Variegada Asesina',
    species: 'Costilla de Adán',
    scientificName: 'Monstera deliciosa',
    imageUrl:
      'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=600&q=80',
    trait: 'Fenestraciones voraces y transpiración intensa',
  },
  {
    id: 'pothos_sigilosa',
    alias: 'Potus Sigilosa',
    species: 'Poto Dorado',
    scientificName: 'Epipremnum aureum',
    imageUrl:
      'https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?auto=format&fit=crop&w=600&q=80',
    trait: 'Crecimiento silencioso y purificación continua',
  },
  {
    id: 'calathea_dramatica',
    alias: 'Calathea Dramática',
    species: 'Calathea Orbifolia',
    scientificName: 'Goeppertia orbifolia',
    imageUrl:
      'https://images.unsplash.com/photo-1599598425947-320d41829910?auto=format&fit=crop&w=600&q=80',
    trait: 'Movimiento foliar circadiano y sensibilidad al agua',
  },
  {
    id: 'sansevieria_invencible',
    alias: 'Sansevieria Invencible',
    species: 'Lengua de Suegra',
    scientificName: 'Dracaena trifasciata',
    imageUrl:
      'https://images.unsplash.com/photo-1593482892290-f54927ae1bf6?auto=format&fit=crop&w=600&q=80',
    trait: 'Metabolismo CAM nocturno e inmunidad a la sequía',
  },
  {
    id: 'ficus_vengador',
    alias: 'Ficus Lyrata Vengador',
    species: 'Higuera Hoja de Violín',
    scientificName: 'Ficus lyrata',
    imageUrl:
      'https://images.unsplash.com/photo-1597055181300-e3633a917c9c?auto=format&fit=crop&w=600&q=80',
    trait: 'Exigencia de lúmenes altos y porte escultórico',
  },
  {
    id: 'zamioculca_inmortal',
    alias: 'Zamioculca Inmortal',
    species: 'Planta ZZ',
    scientificName: 'Zamioculcas zamiifolia',
    imageUrl:
      'https://images.unsplash.com/photo-1632207691143-643e2a9a9361?auto=format&fit=crop&w=600&q=80',
    trait: 'Rizomas con reserva hídrica indestructible',
  },
  {
    id: 'begonia_maculata_lunar',
    alias: 'Begonia Lunar Festiva',
    species: 'Begonia Lunares',
    scientificName: 'Begonia maculata',
    imageUrl:
      'https://images.unsplash.com/photo-1617173944883-6ffbd35d584d?auto=format&fit=crop&w=600&q=80',
    trait: 'Manchas plateadas fotogénicas y envés rojizo',
  },
  {
    id: 'maranta_noctambula',
    alias: 'Maranta Noctámbula',
    species: 'Planta de la Oración',
    scientificName: 'Maranta leuconeura',
    imageUrl:
      'https://images.unsplash.com/photo-1620127814421-081467545ec7?auto=format&fit=crop&w=600&q=80',
    trait: 'Plegado de hojas al anochecer y nervaduras carmesí',
  },
  {
    id: 'helecho_rebelde',
    alias: 'Helecho Nido Rebelde',
    species: 'Helecho Nido de Ave',
    scientificName: 'Asplenium nidus',
    imageUrl:
      'https://images.unsplash.com/photo-1596724898162-e64e52702758?auto=format&fit=crop&w=600&q=80',
    trait: 'Frondas onduladas y avidez por alta humedad',
  },
  {
    id: 'pilea_galactica',
    alias: 'Pilea Galáctica',
    species: 'Planta China del Dinero',
    scientificName: 'Pilea peperomioides',
    imageUrl:
      'https://images.unsplash.com/photo-1610444576136-1e0e84b8109d?auto=format&fit=crop&w=600&q=80',
    trait: 'Discos foliares peltados y brotes multiplicadores',
  },
];

export const getRandomBotanicalAvatar = (): BotanicalAvatar => {
  const index = Math.floor(Math.random() * BOTANICAL_AVATARS.length);
  return BOTANICAL_AVATARS[index];
};
