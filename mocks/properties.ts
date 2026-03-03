import { Property } from "@/types/property";

export const properties: Property[] = [
  {
    id: "1",
    title: "Modern Waterfront Villa",
    price: 125000000,
    address: "123 Lakeside Drive",
    city: "Lagos",
    state: "Lagos",
    zipCode: "101233",
    description: "Stunning waterfront property with panoramic views of the lake and mountains. This modern villa features floor-to-ceiling windows, a gourmet kitchen with top-of-the-line appliances, and a spacious outdoor entertaining area with an infinity pool.",
    bedrooms: 4,
    bathrooms: 3.5,
    squareFeet: 3200,
    images: [
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2075&q=80",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2053&q=80"
    ],
    isFeatured: true,
    type: "house",
    amenities: ["Pool", "Waterfront", "Home Theater", "Smart Home", "Wine Cellar"],
    yearBuilt: 2020,
    latitude: 6.4550,
    longitude: 3.3841,
    listingType: "sell"
  },
  {
    id: "2",
    title: "Downtown Luxury Apartment",
    price: 3500000,
    address: "456 Urban Avenue",
    city: "Abuja",
    state: "FCT",
    zipCode: "900108",
    description: "Elegant luxury apartment in the heart of downtown. This sophisticated residence offers premium finishes, an open concept living area, and breathtaking city views. Building amenities include a fitness center, rooftop lounge, and 24-hour concierge.",
    bedrooms: 2,
    bathrooms: 2,
    squareFeet: 1500,
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2074&q=80"
    ],
    isFeatured: true,
    type: "apartment",
    amenities: ["Gym", "Concierge", "Rooftop Deck", "Pet Friendly", "EV Charging"],
    yearBuilt: 2018,
    latitude: 9.0765,
    longitude: 7.3986,
    listingType: "rent",
    paymentFrequency: {
      rent: "monthly"
    }
  },
  {
    id: "3",
    title: "Charming Suburban Cottage",
    price: 57500000,
    address: "789 Maple Street",
    city: "Port Harcourt",
    state: "Rivers",
    zipCode: "500272",
    description: "Delightful cottage in a peaceful suburban neighborhood. This charming home features original hardwood floors, a cozy fireplace, and a beautifully landscaped garden. Perfect for families looking for a quiet community with excellent schools nearby.",
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: 1800,
    images: [
      "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      "https://images.unsplash.com/photo-1484301548518-d0e0a5db0fc8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
    ],
    isFeatured: false,
    type: "house",
    amenities: ["Fireplace", "Garden", "Hardwood Floors", "Garage", "Patio"],
    yearBuilt: 1985,
    latitude: 4.8156,
    longitude: 7.0498,
    listingType: "sell"
  },
  {
    id: "4",
    title: "Modern Townhouse",
    price: 2200000,
    address: "101 Urban Lane",
    city: "Kano",
    state: "Kano",
    zipCode: "700241",
    description: "Contemporary townhouse in a vibrant neighborhood. This stylish residence offers an open floor plan, high ceilings, and a private rooftop terrace. Walking distance to trendy restaurants, shops, and entertainment venues.",
    bedrooms: 3,
    bathrooms: 2.5,
    squareFeet: 2100,
    images: [
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2074&q=80",
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2074&q=80"
    ],
    isFeatured: false,
    type: "townhouse",
    amenities: ["Rooftop Terrace", "Smart Home", "Energy Efficient", "Walk-in Closets", "Balcony"],
    yearBuilt: 2019,
    latitude: 12.0022,
    longitude: 8.5920,
    listingType: "rent",
    paymentFrequency: {
      rent: "yearly"
    }
  },
  {
    id: "5",
    title: "Luxury Beachfront Condo",
    price: 450000,
    address: "555 Ocean Drive",
    city: "Calabar",
    state: "Cross River",
    zipCode: "540001",
    description: "Exquisite beachfront condo with direct ocean access. This luxury residence features premium finishes, a gourmet kitchen, and a spacious balcony overlooking the Atlantic. Resort-style amenities include multiple pools, a spa, and private beach access.",
    bedrooms: 3,
    bathrooms: 3,
    squareFeet: 2400,
    images: [
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      "https://images.unsplash.com/photo-1600210492493-0946911123ea?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2074&q=80"
    ],
    isFeatured: true,
    type: "condo",
    amenities: ["Beachfront", "Pool", "Spa", "Fitness Center", "24/7 Security"],
    yearBuilt: 2017,
    latitude: 4.9757,
    longitude: 8.3417,
    listingType: "short-let",
    paymentFrequency: {
      "short-let": "weekly"
    }
  },
  {
    id: "6",
    title: "Historic Duplex",
    price: 185000000,
    address: "222 Heritage Row",
    city: "Ibadan",
    state: "Oyo",
    zipCode: "200001",
    description: "Meticulously restored duplex in a historic district. This elegant home combines classic architectural details with modern amenities. Features include high ceilings, original moldings, a chef's kitchen, and a private garden.",
    bedrooms: 4,
    bathrooms: 3.5,
    squareFeet: 3500,
    images: [
      "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2084&q=80",
      "https://images.unsplash.com/photo-1600585154526-990dced4db0d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
    ],
    isFeatured: false,
    type: "duplex",
    amenities: ["Historic", "Garden", "Wine Cellar", "Fireplace", "Library"],
    yearBuilt: 1990,
    latitude: 7.3775,
    longitude: 3.9470,
    listingType: "sell"
  },
  {
    id: "7",
    title: "Luxury Vacation Villa",
    price: 75000,
    address: "888 Paradise Lane",
    city: "Lagos",
    state: "Lagos",
    zipCode: "101245",
    description: "Stunning vacation villa perfect for short stays. This luxury property features a private pool, outdoor entertainment area, and breathtaking views. Fully furnished with high-end amenities and daily housekeeping available.",
    bedrooms: 5,
    bathrooms: 4,
    squareFeet: 3800,
    images: [
      "https://images.unsplash.com/photo-1613977257363-707ba9348227?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      "https://images.unsplash.com/photo-1613977257592-4a9a32f9141b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2068&q=80"
    ],
    isFeatured: true,
    type: "villa",
    amenities: ["Private Pool", "Ocean View", "Fully Furnished", "Housekeeping", "Security"],
    yearBuilt: 2015,
    latitude: 6.4698,
    longitude: 3.5852,
    listingType: "short-let",
    paymentFrequency: {
      "short-let": "daily"
    }
  },
  {
    id: "8",
    title: "Executive Apartment",
    price: 1800000,
    address: "333 Business District",
    city: "Abuja",
    state: "FCT",
    zipCode: "900288",
    description: "Modern executive apartment in the heart of the business district. Perfect for professionals, this stylish residence offers premium finishes, smart home features, and 24-hour security. Building amenities include a fitness center and rooftop lounge.",
    bedrooms: 2,
    bathrooms: 2,
    squareFeet: 1200,
    images: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2080&q=80",
      "https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
    ],
    isFeatured: false,
    type: "apartment",
    amenities: ["Smart Home", "Gym", "Rooftop Lounge", "24/7 Security", "Parking"],
    yearBuilt: 2020,
    latitude: 9.0643,
    longitude: 7.4821,
    listingType: "rent",
    paymentFrequency: {
      rent: "monthly"
    }
  },
  {
    id: "9",
    title: "Weekend Getaway Cottage",
    price: 120000,
    address: "444 Lakeside Retreat",
    city: "Calabar",
    state: "Cross River",
    zipCode: "540101",
    description: "Charming cottage perfect for weekend getaways. This cozy retreat features a fireplace, outdoor deck, and beautiful lake views. Fully furnished with all amenities for a comfortable short stay.",
    bedrooms: 2,
    bathrooms: 1,
    squareFeet: 900,
    images: [
      "https://images.unsplash.com/photo-1587061949409-02df41d5e562?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      "https://images.unsplash.com/photo-1595877244574-e90ce41ce089?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
    ],
    isFeatured: false,
    type: "house",
    amenities: ["Lake View", "Fireplace", "Deck", "Fully Furnished", "Parking"],
    yearBuilt: 2005,
    latitude: 4.9631,
    longitude: 8.3242,
    listingType: "short-let",
    paymentFrequency: {
      "short-let": "monthly"
    }
  }
];