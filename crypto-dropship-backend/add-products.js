const { Product } = require('./database/models');

async function addProducts() {
  try {
    console.log('🔍 Checking existing products...');
    const existingProducts = await Product.findAll();
    console.log(`Found ${existingProducts.length} existing products`);
    
    if (existingProducts.length === 0) {
      console.log('📦 Adding demo Printify products...');
      
      const demoProducts = [
        {
          title: 'Custom T-Shirt Premium',
          description: 'High-quality cotton t-shirt with custom design print - Printify Integration',
          base_price: 19.99,
          markup_percentage: 50,
          selling_price: 29.99,
          category: 'Apparel',
          tags: JSON.stringify(['apparel', 'shirts', 'custom', 'printify']),
          images: JSON.stringify(['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop']),
          is_available: true,
          is_published: true,
          inventory_count: 100
        },
        {
          title: 'Ceramic Coffee Mug',
          description: 'Durable ceramic coffee mug with personalized artwork - Printify POD',
          base_price: 9.99,
          markup_percentage: 50,
          selling_price: 14.99,
          category: 'Drinkware',
          tags: JSON.stringify(['accessories', 'drinkware', 'mugs', 'printify']),
          images: JSON.stringify(['https://images.unsplash.com/photo-1514228742587-6b1558fcf93a?w=400&h=400&fit=crop']),
          is_available: true,
          is_published: true,
          inventory_count: 50
        },
        {
          title: 'Premium Phone Case',
          description: 'Protective phone case with custom artwork design - Printify Quality',
          base_price: 12.99,
          markup_percentage: 54,
          selling_price: 19.99,
          category: 'Accessories',
          tags: JSON.stringify(['accessories', 'phone', 'cases', 'printify']),
          images: JSON.stringify(['https://images.unsplash.com/photo-1556656793-08538906a9f8?w=400&h=400&fit=crop']),
          is_available: true,
          is_published: true,
          inventory_count: 75
        },
        {
          title: 'Canvas Tote Bag',
          description: 'Eco-friendly canvas tote bag with custom print - Printify Sustainable',
          base_price: 14.99,
          markup_percentage: 40,
          selling_price: 20.99,
          category: 'Bags',
          tags: JSON.stringify(['accessories', 'bags', 'eco-friendly', 'printify']),
          images: JSON.stringify(['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop']),
          is_available: true,
          is_published: true,
          inventory_count: 30
        },
        {
          title: 'Wireless Mouse Pad',
          description: 'High-quality mouse pad with wireless charging capability - Printify Tech',
          base_price: 24.99,
          markup_percentage: 60,
          selling_price: 39.99,
          category: 'Tech',
          tags: JSON.stringify(['tech', 'accessories', 'gaming', 'printify']),
          images: JSON.stringify(['https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&h=400&fit=crop']),
          is_available: true,
          is_published: true,
          inventory_count: 25
        }
      ];
      
      for (const productData of demoProducts) {
        await Product.create(productData);
        console.log(`✅ Created product: ${productData.title}`);
      }
      
      console.log('🎉 All demo Printify products created successfully!');
    } else {
      console.log('✅ Products already exist in database');
      existingProducts.forEach(p => {
        console.log(`  - ${p.title} - $${p.selling_price} (Published: ${p.is_published}, Available: ${p.is_available})`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addProducts();
