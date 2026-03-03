export const nigerianStates = [
  'Abia',
  'Adamawa',
  'Akwa Ibom',
  'Anambra',
  'Bauchi',
  'Bayelsa',
  'Benue',
  'Borno',
  'Cross River',
  'Delta',
  'Ebonyi',
  'Edo',
  'Ekiti',
  'Enugu',
  'FCT (Abuja)',
  'Gombe',
  'Imo',
  'Jigawa',
  'Kaduna',
  'Kano',
  'Katsina',
  'Kebbi',
  'Kogi',
  'Kwara',
  'Lagos',
  'Nasarawa',
  'Niger',
  'Ogun',
  'Ondo',
  'Osun',
  'Oyo',
  'Plateau',
  'Rivers',
  'Sokoto',
  'Taraba',
  'Yobe',
  'Zamfara'
];

export const popularCities = {
  'Abia': ['Umuahia', 'Aba', 'Arochukwu'],
  'Adamawa': ['Yola', 'Mubi', 'Jimeta', 'Ganye'],
  'Akwa Ibom': ['Uyo', 'Eket', 'Ikot Ekpene', 'Oron'],
  'Anambra': ['Awka', 'Onitsha', 'Nnewi', 'Ekwulobia'],
  'Bauchi': ['Bauchi', 'Azare', 'Misau', 'Jama\'are'],
  'Bayelsa': ['Yenagoa', 'Brass', 'Nembe', 'Ogbia'],
  'Benue': ['Makurdi', 'Gboko', 'Otukpo', 'Katsina-Ala'],
  'Borno': ['Maiduguri', 'Bama', 'Gwoza', 'Dikwa'],
  'Cross River': ['Calabar', 'Ogoja', 'Ikom', 'Ugep'],
  'Delta': ['Asaba', 'Warri', 'Sapele', 'Ughelli'],
  'Ebonyi': ['Abakaliki', 'Afikpo', 'Onueke', 'Ishieke'],
  'Edo': ['Benin City', 'Auchi', 'Ekpoma', 'Uromi'],
  'Ekiti': ['Ado Ekiti', 'Ikere', 'Efon', 'Ijero'],
  'Enugu': ['Enugu', 'Nsukka', 'Oji River', 'Awgu'],
  'FCT (Abuja)': ['Abuja', 'Gwagwalada', 'Kuje', 'Bwari'],
  'Gombe': ['Gombe', 'Billiri', 'Kaltungo', 'Bajoga'],
  'Imo': ['Owerri', 'Orlu', 'Okigwe', 'Mbaise'],
  'Jigawa': ['Dutse', 'Hadejia', 'Gumel', 'Kazaure'],
  'Kaduna': ['Kaduna', 'Zaria', 'Kafanchan', 'Kagoro'],
  'Kano': ['Kano', 'Dala', 'Nassarawa', 'Ungogo'],
  'Katsina': ['Katsina', 'Daura', 'Funtua', 'Malumfashi'],
  'Kebbi': ['Birnin Kebbi', 'Argungu', 'Yauri', 'Zuru'],
  'Kogi': ['Lokoja', 'Okene', 'Kabba', 'Idah'],
  'Kwara': ['Ilorin', 'Offa', 'Patigi', 'Lafiagi'],
  'Lagos': ['Lagos Island', 'Ikeja', 'Lekki', 'Surulere', 'Ajah', 'Ikorodu', 'Badagry', 'Epe', 'Apapa', 'Mushin', 'Yaba', 'Victoria Island', 'Ikoyi', 'Oshodi', 'Agege', 'Alimosho', 'Festac'],
  'Nasarawa': ['Lafia', 'Keffi', 'Akwanga', 'Nasarawa'],
  'Niger': ['Minna', 'Bida', 'Kontagora', 'Suleja'],
  'Ogun': ['Abeokuta', 'Ijebu Ode', 'Sagamu', 'Ota', 'Ijebu-Igbo'],
  'Ondo': ['Akure', 'Ondo', 'Owo', 'Ikare', 'Okitipupa'],
  'Osun': ['Osogbo', 'Ile-Ife', 'Ilesa', 'Ede', 'Iwo'],
  'Oyo': ['Ibadan', 'Ogbomosho', 'Oyo', 'Iseyin', 'Saki'],
  'Plateau': ['Jos', 'Bukuru', 'Pankshin', 'Shendam'],
  'Rivers': ['Port Harcourt', 'Bonny', 'Degema', 'Eleme', 'Okrika'],
  'Sokoto': ['Sokoto', 'Tambuwal', 'Gwadabawa', 'Illela'],
  'Taraba': ['Jalingo', 'Wukari', 'Bali', 'Gembu'],
  'Yobe': ['Damaturu', 'Potiskum', 'Gashua', 'Nguru'],
  'Zamfara': ['Gusau', 'Kaura Namoda', 'Anka', 'Talata Mafara']
};

// Get all cities as a flat array
export const getAllCities = () => {
  const allCities: string[] = [];
  Object.values(popularCities).forEach(cities => {
    cities.forEach(city => {
      if (!allCities.includes(city)) {
        allCities.push(city);
      }
    });
  });
  return allCities.sort();
};