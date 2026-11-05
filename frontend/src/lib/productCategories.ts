export interface CategoryConfig {
  id: string;
  name: string;
  slug: string;
  description: string;
  defaultSubcategories: string[];
  suggestedVariantType: 'clothing' | 'shoes' | 'perfume' | 'hair' | 'jewelry' | 'simple' | 'general';
  attributeSchema: AttributeFieldDefinition[];
  sampleImages: { label: string; url: string }[];
}

export interface AttributeFieldDefinition {
  key: string;
  label: string;
  type: 'text' | 'select' | 'multiselect' | 'number';
  placeholder?: string;
  options?: string[];
  helperText?: string;
}

export const BOUTIQUE_CATEGORIES_CONFIG: CategoryConfig[] = [
  {
    id: 'cat_clothing',
    name: 'Clothing & Apparel',
    slug: 'clothing-apparel',
    description: 'Luxury ready-to-wear, evening gowns, tailored suiting, knitwear, and daily essentials',
    suggestedVariantType: 'clothing',
    defaultSubcategories: [
      'Dresses', 'Shirts', 'Blouses', 'T-Shirts', 'Tops', 'Jeans', 'Trousers',
      'Shorts', 'Skirts', 'Jackets', 'Coats', 'Sweaters', 'Hoodies',
      'Leggings', 'Underwear', 'Sleepwear', 'Activewear', 'Traditional Clothing'
    ],
    attributeSchema: [
      {
        key: 'gender',
        label: 'Target Audience / Gender',
        type: 'select',
        options: ['Women', 'Men', 'Unisex', 'Kids']
      },
      {
        key: 'material',
        label: 'Fabric & Composition',
        type: 'text',
        placeholder: 'e.g., 100% Mulberry Silk, 85% Cashmere 15% Silk'
      },
      {
        key: 'fit_type',
        label: 'Fit Style',
        type: 'select',
        options: ['Classic Tailored', 'Relaxed Oversized', 'Slim Fit', 'Bias Cut Flowing', 'A-Line', 'Structured']
      },
      {
        key: 'season',
        label: 'Season & Collection',
        type: 'text',
        placeholder: 'e.g., Autumn/Winter 2026, Riviera Spring'
      },
      {
        key: 'care_instructions',
        label: 'Care Instructions',
        type: 'select',
        options: ['Specialist Dry Clean Only', 'Hand Wash Cold in Silk Wash', 'Machine Wash Delicate 30°C', 'Spot Clean Only']
      }
    ],
    sampleImages: [
      { label: 'Silk Slip Gown', url: '/src/assets/images/product_silk_dress_1793729959681.jpg' },
      { label: 'Cashmere Overcoat', url: '/src/assets/images/product_cashmere_coat_1793729960408.jpg' },
      { label: 'Linen Blazer', url: '/src/assets/images/product_linen_blazer_1793729960494.jpg' },
      { label: 'Satin Evening Dress', url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&auto=format&fit=crop&q=80' }
    ]
  },
  {
    id: 'cat_shoes',
    name: 'Shoes & Footwear',
    slug: 'shoes-footwear',
    description: 'Designer heels, leather loafers, luxury sneakers, boots, and evening footwear',
    suggestedVariantType: 'shoes',
    defaultSubcategories: [
      'High Heels', 'Sneakers', 'Sandals', 'Slippers', 'Flats', 'Boots', 'Formal Shoes', 'Casual Shoes'
    ],
    attributeSchema: [
      {
        key: 'target_gender',
        label: 'Target Demographic',
        type: 'select',
        options: ['Women', 'Men', 'Unisex']
      },
      {
        key: 'upper_material',
        label: 'Upper Material',
        type: 'select',
        options: ['Full Grain Calfskin', 'Italian Silk Satin', 'Suede / Nubuck', 'Patent Leather', 'Nappa Leather', 'Velvet', 'Technical Canvas']
      },
      {
        key: 'sole_material',
        label: 'Sole & Lining',
        type: 'select',
        options: ['Brushed Italian Leather Sole', 'Rubber Commando Sole', 'Kidskin Cushion Footbed', 'Crepe Sole']
      },
      {
        key: 'heel_style',
        label: 'Heel Style & Height',
        type: 'select',
        options: ['Flat (0 - 1 inch)', 'Low Block (1 - 2 inches)', 'Mid Heel (2.5 - 3 inches)', 'Stiletto (4 inches / 105mm)', 'Platform', 'Wedge']
      },
      {
        key: 'closure',
        label: 'Closure & Fastening',
        type: 'select',
        options: ['Slip-on', 'Buckled Ankle Strap', 'Waxed Lace-Up', 'Inner Zipper', 'Elastic Gusset']
      }
    ],
    sampleImages: [
      { label: 'Satin Pointed Pumps', url: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&auto=format&fit=crop&q=80' },
      { label: 'Leather Dress Loafers', url: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=600&auto=format&fit=crop&q=80' },
      { label: 'Designer Minimal Sneakers', url: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&auto=format&fit=crop&q=80' },
      { label: 'Strappy Evening Sandals', url: 'https://images.unsplash.com/photo-1562273138-f46be4ebdf33?w=600&auto=format&fit=crop&q=80' }
    ]
  },
  {
    id: 'cat_bags',
    name: 'Bags & Handbags',
    slug: 'bags-handbags',
    description: 'Fine leather tote bags, shoulder bags, evening clutches, crossbody, and travel luggage',
    suggestedVariantType: 'simple',
    defaultSubcategories: [
      'Handbags', 'Shoulder Bags', 'Crossbody Bags', 'Tote Bags', 'Backpacks', 'Clutches', 'Wallets', 'Purses', 'Travel Bags'
    ],
    attributeSchema: [
      {
        key: 'leather_type',
        label: 'Exterior Material',
        type: 'select',
        options: ['Vegetable-Tanned Calfskin', 'Saffiano Textured Leather', 'Crocodile Embossed', 'Smooth Box Calf', 'Supple Nappa', 'Canvas & Leather Trim']
      },
      {
        key: 'hardware_finish',
        label: 'Hardware Finish',
        type: 'select',
        options: ['24K Light Gold Plated', 'Polished Champagne Brass', 'Silver / Palladium', 'Brushed Gunmetal', 'Antiqued Bronze']
      },
      {
        key: 'strap_type',
        label: 'Strap & Carry Handle',
        type: 'select',
        options: ['Detachable & Adjustable Crossbody Strap', 'Gourmette Chain Strap', 'Dual Tubular Top Handles', 'Wristlet Loop']
      },
      {
        key: 'closure_type',
        label: 'Closure System',
        type: 'select',
        options: ['Magnetic Flap Clasp', 'Two-Way Metal Zipper', 'Turn-Lock Clasp', 'Drawstring Leather Cinch', 'Open Tote with Tie']
      },
      {
        key: 'dimensions',
        label: 'Dimensions & Capacity',
        type: 'text',
        placeholder: 'e.g., 32cm W x 24cm H x 12cm D (Fits 13" laptop)'
      }
    ],
    sampleImages: [
      { label: 'Calfskin Structured Tote', url: '/src/assets/images/product_leather_tote_1793729961465.jpg' },
      { label: 'Quilted Flap Crossbody', url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&auto=format&fit=crop&q=80' },
      { label: 'Evening Satin Clutch', url: 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=600&auto=format&fit=crop&q=80' },
      { label: 'Luxury Weekender Duffle', url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80' }
    ]
  },
  {
    id: 'cat_jewelry',
    name: 'Jewelry & Watches',
    slug: 'jewelry-watches',
    description: 'Fine jewelry, precious metals, diamonds, gemstones, and artisanal timepieces',
    suggestedVariantType: 'jewelry',
    defaultSubcategories: [
      'Earrings', 'Necklaces', 'Bracelets', 'Rings', 'Anklets', 'Watches', 'Brooches'
    ],
    attributeSchema: [
      {
        key: 'metal_type',
        label: 'Precious Metal Type',
        type: 'select',
        options: ['18K Yellow Gold (750)', '18K White Gold', '18K Rose Gold', '14K Yellow Gold', '925 Sterling Silver', '950 Platinum', 'Titanium / Steel']
      },
      {
        key: 'karat_purity',
        label: 'Purity / Hallmark',
        type: 'select',
        options: ['18 Karat (Au 750)', '14 Karat (Au 585)', '24 Karat Solid Gold', '925 Sterling (Ag 925)', 'Pt 950 Platinum']
      },
      {
        key: 'gemstone',
        label: 'Primary Gemstone',
        type: 'select',
        options: ['Solitaire Diamond (VS1 / F)', 'Pave Diamonds', 'Colombian Emerald', 'Ceylon Blue Sapphire', 'Burmese Ruby', 'Freshwater Cultured Pearl', 'No Gemstones (Pure Metal)']
      },
      {
        key: 'watch_movement',
        label: 'Watch Movement (if applicable)',
        type: 'select',
        options: ['N/A (Jewelry Piece)', 'Swiss Automatic Mechanical', 'Precision Quartz', 'Hand-Wound Tourbillon']
      },
      {
        key: 'certification',
        label: 'Certification / Authenticity',
        type: 'text',
        placeholder: 'e.g., Quality Certificate, Hirbit Store Hallmark'
      }
    ],
    sampleImages: [
      { label: 'Diamond Solitaire Ring', url: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&auto=format&fit=crop&q=80' },
      { label: 'Gold Link Bracelet', url: 'https://images.unsplash.com/photo-1611591475155-426477a1f062?w=600&auto=format&fit=crop&q=80' },
      { label: 'Pearl Drop Earrings', url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&auto=format&fit=crop&q=80' },
      { label: 'Swiss Automatic Watch', url: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=600&auto=format&fit=crop&q=80' }
    ]
  },
  {
    id: 'cat_accessories',
    name: 'Fashion Accessories',
    slug: 'fashion-accessories',
    description: 'Silk scarves, designer belts, Italian sunglasses, headwear, and bespoke accessories',
    suggestedVariantType: 'general',
    defaultSubcategories: [
      'Belts', 'Sunglasses', 'Scarves', 'Hats', 'Caps', 'Gloves', 'Hair Accessories', 'Hair Clips', 'Headbands', 'Fashion Accessories'
    ],
    attributeSchema: [
      {
        key: 'accessory_type',
        label: 'Accessory Category',
        type: 'select',
        options: ['Eyewear / Sunglasses', 'Silk Square / Twill Scarf', 'Leather Belt', 'Fedora / Millinery', 'Leather Gloves', 'Hair Barrette / Clasp']
      },
      {
        key: 'material',
        label: 'Material / Construction',
        type: 'text',
        placeholder: 'e.g., 100% Silk Twill 16mm, Mazzucchelli Acetate, Italian Cowhide'
      },
      {
        key: 'lens_specs',
        label: 'Optics / UV Rating (Sunglasses)',
        type: 'select',
        options: ['N/A', '100% UV400 Protection (Cat. 3)', 'Polarized Carl Zeiss Lenses', 'Gradient Tinted Lenses']
      },
      {
        key: 'dimensions_length',
        label: 'Dimensions / Width',
        type: 'text',
        placeholder: 'e.g., 90 x 90 cm scarf, 30mm belt width'
      }
    ],
    sampleImages: [
      { label: 'Acetate Sunglasses', url: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&auto=format&fit=crop&q=80' },
      { label: 'Silk Twill Scarf', url: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=600&auto=format&fit=crop&q=80' },
      { label: 'Calfskin Leather Belt', url: 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=600&auto=format&fit=crop&q=80' },
      { label: 'Felt Fedora Hat', url: 'https://images.unsplash.com/photo-1514327605112-b887c0e61c0a?w=600&auto=format&fit=crop&q=80' }
    ]
  },
  {
    id: 'cat_beauty',
    name: 'Beauty & Cosmetics',
    slug: 'beauty-cosmetics',
    description: 'Niche perfumes, luxury skincare, high-pigment cosmetics, and artisanal body care',
    suggestedVariantType: 'perfume',
    defaultSubcategories: [
      'Perfumes', 'Body Sprays', 'Makeup', 'Lipsticks', 'Foundations', 'Skincare', 'Face Creams', 'Body Lotions', 'Soaps', 'Beauty Accessories'
    ],
    attributeSchema: [
      {
        key: 'fragrance_family',
        label: 'Olfactory / Fragrance Family',
        type: 'select',
        options: ['Floral Oriental', 'Woody Amber', 'Citrus Fresh', 'Gourmand Vanilla', 'Spicy Chypre', 'Aromatic Fougere', 'Unscented / Skincare']
      },
      {
        key: 'concentration',
        label: 'Formula Concentration',
        type: 'select',
        options: ['Extrait de Parfum (30%+)', 'Eau de Parfum (15-20%)', 'Eau de Toilette (5-15%)', 'Treatment Serum / Cream', 'High-Pigment Lipstick']
      },
      {
        key: 'skin_type',
        label: 'Target Skin Type',
        type: 'select',
        options: ['All Skin Types', 'Sensitive & Reactive', 'Dry / Dehydrated', 'Combination / Oily', 'Mature / Firming']
      },
      {
        key: 'net_volume',
        label: 'Base Volume / Weight',
        type: 'text',
        placeholder: 'e.g., 50ml, 100ml, 30g, 3.4 fl oz'
      },
      {
        key: 'pao_expiry',
        label: 'Period After Opening (PAO) & Expiry',
        type: 'text',
        placeholder: 'e.g., 24M after opening, Batch Exp 12/2028'
      }
    ],
    sampleImages: [
      { label: 'Niche Perfume Flacon', url: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=600&auto=format&fit=crop&q=80' },
      { label: 'Satin Luxury Lipstick', url: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600&auto=format&fit=crop&q=80' },
      { label: 'Radiance Face Cream', url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80' },
      { label: 'Botanical Body Elixir', url: 'https://images.unsplash.com/photo-1608248597359-bb43e1d7a31b?w=600&auto=format&fit=crop&q=80' }
    ]
  },
  {
    id: 'cat_hair',
    name: 'Hair Products',
    slug: 'hair-products',
    description: 'Virgin hair extensions, luxury lace wigs, hairpieces, styling elixirs, and salon care',
    suggestedVariantType: 'hair',
    defaultSubcategories: [
      'Wigs', 'Hair Extensions', 'Braids', 'Hairpieces', 'Hair Accessories', 'Hair Care Products'
    ],
    attributeSchema: [
      {
        key: 'hair_origin',
        label: 'Hair Origin & Grade',
        type: 'select',
        options: ['100% Raw Virgin Brazilian', '100% Unprocessed Peruvian', 'Raw Indian Temple Hair', 'Slavic Blonde Virgin', 'Luxury Heat-Resistant Synthetic']
      },
      {
        key: 'texture',
        label: 'Wave & Texture Pattern',
        type: 'select',
        options: ['Silky Straight', 'Body Wave', 'Deep Wave', 'Water Wave', 'Kinky Curly', 'Loose Deep', 'Coarse Yaki Straight']
      },
      {
        key: 'density',
        label: 'Wig Density',
        type: 'select',
        options: ['150% Natural Medium', '180% Full Glam', '200% Heavy Glam', '250% Extra Full', 'N/A (Bundle Extensions)']
      },
      {
        key: 'lace_cap',
        label: 'Lace Type & Construction',
        type: 'select',
        options: ['13x4 HD Invisible Lace Frontal', '13x6 Deep Part Frontal', '5x5 HD Lace Closure', 'Glueless 360 Full Lace', 'Machine Weft Bundle']
      },
      {
        key: 'color_shade',
        label: 'Color Code / Tone',
        type: 'text',
        placeholder: 'e.g., #1B Natural Black, #613 Platinum Blonde, Honey Highlights'
      }
    ],
    sampleImages: [
      { label: 'Raw Virgin Body Wave Wig', url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&auto=format&fit=crop&q=80' },
      { label: 'Lace Frontal Extensions', url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80' },
      { label: 'Straight Bundle Wefts', url: 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=600&auto=format&fit=crop&q=80' }
    ]
  },
  {
    id: 'cat_personal_care',
    name: 'Personal Care',
    slug: 'personal-care',
    description: 'Botanical bath & body wash, botanical deodorants, restorative hair oils, and luxury care kits',
    suggestedVariantType: 'simple',
    defaultSubcategories: [
      'Deodorants', 'Body Wash', 'Shampoos', 'Conditioners', 'Body Oils', 'Personal Care Kits'
    ],
    attributeSchema: [
      {
        key: 'formula_highlights',
        label: 'Formulation Highlights',
        type: 'select',
        options: ['100% Organic Botanical', 'Sulfate & Paraben Free', 'Vegan & Cruelty Free', 'Dermatologist Tested', 'Essential Oil Infused']
      },
      {
        key: 'key_ingredients',
        label: 'Key Active Botanicals',
        type: 'text',
        placeholder: 'e.g., Cold-Pressed Moroccan Argan, Jojoba, Vitamin E, Neroli'
      },
      {
        key: 'aroma_scent',
        label: 'Aroma / Scent Profile',
        type: 'text',
        placeholder: 'e.g., French Lavender & Rosemary, Bergamot Amber'
      },
      {
        key: 'volume_weight',
        label: 'Volume / Size',
        type: 'text',
        placeholder: 'e.g., 250ml / 8.4 fl oz, 500ml Dispenser'
      }
    ],
    sampleImages: [
      { label: 'Botanical Body Wash', url: 'https://images.unsplash.com/photo-1608248597359-bb43e1d7a31b?w=600&auto=format&fit=crop&q=80' },
      { label: 'Restorative Hair Oil', url: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=600&auto=format&fit=crop&q=80' },
      { label: 'Artisan Scented Soap Bar', url: 'https://images.unsplash.com/photo-1607006314646-0b89326e5d8f?w=600&auto=format&fit=crop&q=80' }
    ]
  },
  {
    id: 'cat_lifestyle',
    name: 'Lifestyle & Gift Items',
    slug: 'lifestyle-gift-items',
    description: 'Curated gift hampers, scented boutique candles, travel organizers, and keepsake gift boxes',
    suggestedVariantType: 'simple',
    defaultSubcategories: [
      'Gift Sets', 'Gift Boxes', 'Cosmetic Bags', 'Travel Accessories', 'Keychains', 'Fashion Gifts', 'Other Lifestyle Products'
    ],
    attributeSchema: [
      {
        key: 'packaging_style',
        label: 'Gift Packaging & Presentation',
        type: 'select',
        options: ['Luxury Rigid Magnetic Keepsake Chest', 'Gold-Embossed Velvet Box', 'Silk Grosgrain Ribbon Wrapped', 'Artisanal Wooden Cask']
      },
      {
        key: 'contents_summary',
        label: 'Set Contents / Items Included',
        type: 'text',
        placeholder: 'e.g., 1x Scented Candle, 1x Silk Eye Mask, 1x Mulberry Silk Scrunchie'
      },
      {
        key: 'occasion',
        label: 'Occasion & Theme',
        type: 'select',
        options: ['VIP Corporate Gift', 'Holiday & New Year', 'Wedding & Bridal', 'Anniversary Keepsake', 'Personal Indulgence']
      }
    ],
    sampleImages: [
      { label: 'Velvet Holiday Gift Box', url: 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=600&auto=format&fit=crop&q=80' },
      { label: 'Luxury Scented Candle', url: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=600&auto=format&fit=crop&q=80' },
      { label: 'Leather Travel Organizer', url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80' }
    ]
  },
  {
    id: 'cat_other',
    name: 'Other Products',
    slug: 'other-products',
    description: 'General boutique merchandise, limited drops, custom orders, and seasonal items',
    suggestedVariantType: 'simple',
    defaultSubcategories: [
      'General Merchandise', 'Custom Items', 'Seasonal Miscellaneous'
    ],
    attributeSchema: [
      {
        key: 'product_type_label',
        label: 'Item Specification / Category Note',
        type: 'text',
        placeholder: 'e.g., Bespoke Monogramming, Special Order Item'
      },
      {
        key: 'origin_country',
        label: 'Country of Manufacture',
        type: 'text',
        placeholder: 'e.g., France, Italy, United Kingdom'
      }
    ],
    sampleImages: [
      { label: 'Boutique Keepsake', url: 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=600&auto=format&fit=crop&q=80' }
    ]
  }
];

export const VARIANT_TEMPLATES = {
  clothing: [
    { size: 'XS', color: 'Champagne', color_code: '#E8DFD3', quantity: 4 },
    { size: 'S', color: 'Champagne', color_code: '#E8DFD3', quantity: 6 },
    { size: 'M', color: 'Champagne', color_code: '#E8DFD3', quantity: 8 },
    { size: 'L', color: 'Champagne', color_code: '#E8DFD3', quantity: 5 }
  ],
  shoes: [
    { size: 'EU 37', color: 'Noir Black', color_code: '#111111', quantity: 4 },
    { size: 'EU 38', color: 'Noir Black', color_code: '#111111', quantity: 6 },
    { size: 'EU 39', color: 'Noir Black', color_code: '#111111', quantity: 6 },
    { size: 'EU 40', color: 'Noir Black', color_code: '#111111', quantity: 3 }
  ],
  perfume: [
    { size: '50ml', color: 'Crystal Flacon', color_code: '#D4AF37', quantity: 8 },
    { size: '100ml', color: 'Crystal Flacon', color_code: '#D4AF37', quantity: 6 }
  ],
  hair: [
    { size: '20 inch', color: '#1B Natural Black', color_code: '#1B1B1B', quantity: 4 },
    { size: '24 inch', color: '#1B Natural Black', color_code: '#1B1B1B', quantity: 6 },
    { size: '28 inch', color: '#1B Natural Black', color_code: '#1B1B1B', quantity: 3 }
  ],
  jewelry: [
    { size: 'US 6', color: '18K Yellow Gold', color_code: '#FFD700', quantity: 2 },
    { size: 'US 7', color: '18K Yellow Gold', color_code: '#FFD700', quantity: 3 },
    { size: 'US 8', color: '18K Yellow Gold', color_code: '#FFD700', quantity: 2 }
  ],
  general: [
    { size: 'Standard', color: 'Classic Gold', color_code: '#B89B65', quantity: 5 },
    { size: 'Standard', color: 'Onyx Noir', color_code: '#1A1A1A', quantity: 5 }
  ],
  simple: [
    { size: 'Standard', color: 'Standard', color_code: '#B89B65', quantity: 10 }
  ]
};

export function getCategoryConfig(categorySlugOrId?: string): CategoryConfig | undefined {
  if (!categorySlugOrId) return undefined;
  return BOUTIQUE_CATEGORIES_CONFIG.find(
    c => c.id === categorySlugOrId || c.slug === categorySlugOrId || c.name.toLowerCase() === categorySlugOrId.toLowerCase()
  );
}
