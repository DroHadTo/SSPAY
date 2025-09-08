const { Product } = require('./database/models');

async function checkProducts() {
  try {
    const products = await Product.findAll();
    console.log('📦 Products in database:', products.length);
    
    if (products.length > 0) {
      console.log('\n🛍️ Your Products:');
      products.forEach((product, index) => {
        console.log(`${index + 1}. ${product.title} - $${product.selling_price} (${product.category})`);
      });
    } else {
      console.log('❌ No products found in database');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
  process.exit(0);
}

checkProducts();
