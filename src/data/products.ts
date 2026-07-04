export interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  price: number;
  discountedPrice?: number;
  description: string;
  images: string[];
  sizes: string[];
  colors: string[];
  fabric: string;
  fit: string;
  care: string;
  isNewArrival: boolean;
  isBestseller: boolean;
}

export const products: Product[] = [
  {
    id: "prod_1",
    name: "Atelier Heavyweight Tee",
    slug: "atelier-heavyweight-tee",
    category: "Tshirts",
    price: 1999,
    discountedPrice: 1599,
    description: "A premium, boxy heavyweight T-shirt crafted from 280gsm organic combed cotton. Woven with a thick ribbed mock collar and dropped shoulders for a clean, structural drape.",
    images: [
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80",
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&q=80"
    ],
    sizes: ["S", "M", "L", "XL"],
    colors: ["Ivory", "Black", "Olive"],
    fabric: "100% Organic Combed Cotton",
    fit: "Relaxed boxy fit. Take your normal size.",
    care: "Machine wash cold inside out. Hang dry.",
    isNewArrival: true,
    isBestseller: true
  },
  {
    id: "prod_2",
    name: "Mercerized Cotton Slub Tee",
    slug: "mercerized-cotton-slub-tee",
    category: "Tshirts",
    price: 2499,
    description: "An elegant t-shirt with a refined silk-like luster. Cut from breathable slub cotton that offers a textured look and high moisture absorption for hot summer days.",
    images: [
      "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=800&q=80",
      "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&q=80"
    ],
    sizes: ["XS", "S", "M", "L"],
    colors: ["Beige", "Ivory", "Black"],
    fabric: "100% Mercerized Cotton",
    fit: "Regular fit, true to size.",
    care: "Dry flat. Machine wash gentle cycle in laundry bag.",
    isNewArrival: false,
    isBestseller: false
  },
  {
    id: "prod_3",
    name: "Atelier Classic Linen Shirt",
    slug: "atelier-classic-linen-shirt",
    category: "Full Shirts",
    price: 3999,
    discountedPrice: 3199,
    description: "A signature wardrobe staple, this long-sleeve shirt is woven from premium organic Belgian linen. Styled with a classic point collar, double-button cuffs, and a curved hem.",
    images: [
      "https://images.unsplash.com/photo-1603252109303-2751441dd157?w=800&q=80",
      "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&q=80"
    ],
    sizes: ["S", "M", "L", "XL"],
    colors: ["Ivory", "Beige", "Olive"],
    fabric: "100% Pure Organic Linen",
    fit: "Relaxed classic fit.",
    care: "Warm iron or steam. Dry cleaning optional.",
    isNewArrival: true,
    isBestseller: true
  },
  {
    id: "prod_4",
    name: "Premium Oxford Cotton Shirt",
    slug: "premium-oxford-cotton-shirt",
    category: "Full Shirts",
    price: 4499,
    description: "Crafted from durable, premium long-staple Supima cotton, this heavy Oxford shirt features a button-down collar and chest pocket. Designed to soften over time.",
    images: [
      "https://images.unsplash.com/photo-1554568218-0f1715e72254?w=800&q=80",
      "https://images.unsplash.com/photo-1620012253295-c05518e99309?w=800&q=80"
    ],
    sizes: ["S", "M", "L", "XL"],
    colors: ["Ivory", "Black", "Beige"],
    fabric: "100% Supima Cotton Oxford",
    fit: "Tailored fit.",
    care: "Machine wash warm. Warm iron.",
    isNewArrival: false,
    isBestseller: false
  },
  {
    id: "prod_5",
    name: "Tailored Wool Blend Trousers",
    slug: "tailored-wool-blend-trousers",
    category: "Trousers",
    price: 6999,
    description: "Designed for seamless transition, these tailored trousers feature a mid-rise waist, subtle front pleats, and side slip pockets. Crafted from a refined wool and silk weave.",
    images: [
      "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&q=80",
      "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&q=80"
    ],
    sizes: ["S", "M", "L"],
    colors: ["Black", "Brown", "Beige"],
    fabric: "80% Wool, 20% Silk",
    fit: "Straight leg, mid-rise.",
    care: "Dry clean only. Steam gently.",
    isNewArrival: true,
    isBestseller: false
  },
  {
    id: "prod_6",
    name: "Pleated Linen Wide-Leg Trousers",
    slug: "pleated-linen-wide-leg-trousers",
    category: "Trousers",
    price: 5499,
    discountedPrice: 4399,
    description: "Flowy, high-waisted wide-leg trousers cut from premium Belgian linen. Featuring front double pleats and an elasticated back waistband for comfort.",
    images: [
      "https://images.unsplash.com/photo-1509551388413-e18d0ac5d495?w=800&q=80",
      "https://images.unsplash.com/photo-1517423568366-8b83523034fd?w=800&q=80"
    ],
    sizes: ["XS", "S", "M", "L"],
    colors: ["Ivory", "Beige", "Olive"],
    fabric: "100% Pure Linen",
    fit: "High-waisted, wide leg.",
    care: "Gentle machine wash cold. Iron on reverse.",
    isNewArrival: false,
    isBestseller: true
  },
  {
    id: "prod_7",
    name: "Atelier Drawstring Linen Shorts",
    slug: "atelier-drawstring-linen-shorts",
    category: "Half Pants",
    price: 2999,
    description: "Relaxed summer lounge shorts featuring an elasticated drawstring waistband and deep side pockets. Pre-washed for a soft feel.",
    images: [
      "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800&q=80",
      "https://images.unsplash.com/photo-1582552938357-32b906df43c3?w=800&q=80"
    ],
    sizes: ["S", "M", "L", "XL"],
    colors: ["Beige", "Olive", "Black"],
    fabric: "100% Organic Linen",
    fit: "Relaxed fit, sits above the knee.",
    care: "Machine wash cold. Tumble dry low.",
    isNewArrival: true,
    isBestseller: false
  },
  {
    id: "prod_8",
    name: "Tailored Cotton Chino Shorts",
    slug: "tailored-cotton-chino-shorts",
    category: "Half Pants",
    price: 3299,
    description: "Smart chino shorts woven from comfortable stretch cotton twill. Features belt loops, button closure, and rear welt pockets.",
    images: [
      "https://images.unsplash.com/photo-1604176354204-9268737828e4?w=800&q=80",
      "https://images.unsplash.com/photo-1565084888279-aca607ecad0c?w=800&q=80"
    ],
    sizes: ["S", "M", "L"],
    colors: ["Beige", "Black", "Olive"],
    fabric: "98% Cotton, 2% Elastane",
    fit: "Regular fit.",
    care: "Machine wash warm inside out with like colors.",
    isNewArrival: false,
    isBestseller: false
  },
  {
    id: "prod_9",
    name: "Apex Minimalist Leather Sneaker",
    slug: "apex-minimalist-leather-sneaker",
    category: "Sneakers",
    price: 8999,
    description: "Crafted in Portugal from full-grain Italian Nappa leather, featuring a clean profile, leather lining, and Margom rubber outsoles.",
    images: [
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&q=80",
      "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&q=80"
    ],
    sizes: ["6", "7", "8", "9", "10", "11"],
    colors: ["Ivory", "Black", "Beige"],
    fabric: "100% Italian Nappa Leather",
    fit: "True to size. Standard width.",
    care: "Wipe clean with leather cleaner and soft cloth.",
    isNewArrival: true,
    isBestseller: true
  },
  {
    id: "prod_10",
    name: "Atelier Suede Low-Top Sneaker",
    slug: "atelier-suede-low-top-sneaker",
    category: "Sneakers",
    price: 9499,
    description: "A luxury everyday trainer made from premium calf suede. Set on a durable cupsole with reinforced stitching and ortholite insole.",
    images: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80",
      "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&q=80"
    ],
    sizes: ["6", "7", "8", "9", "10", "11"],
    colors: ["Beige", "Brown", "Olive"],
    fabric: "100% Premium Calf Suede",
    fit: "True to size.",
    care: "Brush with suede brush. Avoid water exposure.",
    isNewArrival: false,
    isBestseller: false
  }
];
