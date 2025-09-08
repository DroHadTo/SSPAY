const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'database.db');
console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    return;
  }
  console.log('Connected to SQLite database');
});

// Check if products table exists and has data
db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
  if (err) {
    console.error('Error getting tables:', err.message);
    return;
  }
  
  console.log('Tables in database:', tables.map(t => t.name));
  
  // Check products table
  db.all("SELECT COUNT(*) as count FROM Products", (err, result) => {
    if (err) {
      console.error('Error counting products:', err.message);
    } else {
      console.log('Current products count:', result[0].count);
    }
    
    // Add demo products if none exist
    if (result[0].count === 0) {
      console.log('Adding demo products...');
      
      const insertSQL = `
        INSERT INTO Products (
          title, description, base_price, markup_percentage, selling_price, 
          category, tags, images, is_available, is_published, inventory_count,
          createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `;
      
      const products = [
        ['Custom T-Shirt Premium', 'High-quality cotton t-shirt with custom design print - Printify Integration', 19.99, 50, 29.99, 'Apparel', '["apparel","shirts","custom","printify"]', '["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop"]', 1, 1, 100],
        ['Ceramic Coffee Mug', 'Durable ceramic coffee mug with personalized artwork - Printify POD', 9.99, 50, 14.99, 'Drinkware', '["accessories","drinkware","mugs","printify"]', '["https://images.unsplash.com/photo-1514228742587-6b1558fcf93a?w=400&h=400&fit=crop"]', 1, 1, 50],
        ['Premium Phone Case', 'Protective phone case with custom artwork design - Printify Quality', 12.99, 54, 19.99, 'Accessories', '["accessories","phone","cases","printify"]', '["https://images.unsplash.com/photo-1556656793-08538906a9f8?w=400&h=400&fit=crop"]', 1, 1, 75]
      ];
      
      products.forEach((product, index) => {
        db.run(insertSQL, product, function(err) {
          if (err) {
            console.error(`Error inserting product ${index + 1}:`, err.message);
          } else {
            console.log(`✅ Inserted product ${index + 1}: ${product[0]}`);
          }
          
          if (index === products.length - 1) {
            // Verify insertion
            db.all("SELECT id, title, selling_price, is_published FROM Products", (err, rows) => {
              if (err) {
                console.error('Error verifying products:', err.message);
              } else {
                console.log('\n🎉 Products in database:');
                rows.forEach(row => {
                  console.log(`  - ID: ${row.id}, Title: ${row.title}, Price: $${row.selling_price}, Published: ${row.is_published}`);
                });
              }
              db.close();
            });
          }
        });
      });
    } else {
      console.log('Products already exist, showing current products:');
      db.all("SELECT id, title, selling_price, is_published FROM Products", (err, rows) => {
        if (err) {
          console.error('Error getting products:', err.message);
        } else {
          rows.forEach(row => {
            console.log(`  - ID: ${row.id}, Title: ${row.title}, Price: $${row.selling_price}, Published: ${row.is_published}`);
          });
        }
        db.close();
      });
    }
  });
});
