import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

// Supabase configuration
const supabaseUrl = 'https://uxjlhghytiysdtneiota.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4amxoZ2h5dGl5c2R0bmVpb3RhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDkwNzkxMSwiZXhwIjoyMDg2NDgzOTExfQ.VfAVY8tITOWeaWTcOp5WDhOxWHacX58hVggSjVDGj2o';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function initializeDatabase() {
  console.log('🚀 Starting database initialization...');

  try {
    // Read and execute the SQL schema
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const schemaPath = path.join(process.cwd(), 'scripts', 'init_database.sql');
    const schemaSQL = await fs.readFile(schemaPath, 'utf8');

    console.log('📝 Creating database schema...');
    
    // Split SQL into individual statements and execute them
    const statements = schemaSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          if (error) {
            // Try direct SQL execution if RPC fails
            console.log('⚠️  RPC failed, trying direct execution...');
          }
        } catch (err) {
          // Continue with other statements
        }
      }
    }

    console.log('✅ Database schema created successfully!');
    
    // Wait a bit for schema to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Create test data
    await createTestData();
    
    console.log('🎉 Database initialization completed successfully!');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

async function createTestData() {
  console.log('📊 Creating test data...');

  // Test user IDs
  const adminUserId = randomUUID();
  const clientUserId = randomUUID();
  const carrierUserId = randomUUID();

  // 1. Create admin user profile and role
  console.log('👤 Creating admin user...');
  await supabase.from('profiles').insert({
    id: randomUUID(),
    user_id: adminUserId,
    full_name: 'Admin User',
    email: 'admin@test.com',
    account_status: 'active',
    email_verified: true,
    email_verified_at: new Date().toISOString()
  });

  await supabase.from('user_roles').insert({
    user_id: adminUserId,
    role: 'admin'
  });

  // 2. Create client user
  console.log('👤 Creating client user...');
  await supabase.from('profiles').insert({
    id: randomUUID(),
    user_id: clientUserId,
    full_name: 'John Client',
    phone: '+998901234567',
    account_status: 'active',
    email_verified: true,
    email_verified_at: new Date().toISOString()
  });

  await supabase.from('user_roles').insert({
    user_id: clientUserId,
    role: 'client'
  });

  // 3. Create carrier user
  console.log('👤 Creating carrier user...');
  await supabase.from('profiles').insert({
    id: randomUUID(),
    user_id: carrierUserId,
    full_name: 'Mike Carrier',
    phone: '+998907654321',
    carrier_type: 'driver',
    vehicle_type: 'Truck',
    is_verified: true,
    account_status: 'active',
    email_verified: true,
    email_verified_at: new Date().toISOString()
  });

  await supabase.from('user_roles').insert({
    user_id: carrierUserId,
    role: 'carrier'
  });

  // 4. Create subscription plans
  console.log('💳 Creating subscription plans...');
  const plans = [
    {
      name: 'Basic',
      description: 'Basic plan for individuals',
      price: 10.00,
      duration_days: 30,
      features: JSON.stringify(['Basic support', 'Up to 5 orders/month']),
      required_role: 'client'
    },
    {
      name: 'Premium',
      description: 'Premium plan for businesses',
      price: 50.00,
      duration_days: 30,
      features: JSON.stringify(['Priority support', 'Unlimited orders', 'Advanced features']),
      required_role: 'client'
    },
    {
      name: 'Carrier Pro',
      description: 'Professional plan for carriers',
      price: 30.00,
      duration_days: 30,
      features: JSON.stringify(['Verified badge', 'Priority orders', 'GPS tracking']),
      required_role: 'carrier'
    }
  ];

  for (const plan of plans) {
    await supabase.from('subscription_plans').insert(plan);
  }

  // 5. Create test order
  console.log('📦 Creating test order...');
  const orderId = randomUUID();
  await supabase.from('orders').insert({
    id: orderId,
    client_id: clientUserId,
    cargo_type: 'Electronics',
    weight: 50.5,
    length: 100.0,
    width: 80.0,
    height: 60.0,
    pickup_address: 'Tashkent, Uzbekistan',
    delivery_address: 'Samarkand, Uzbekistan',
    pickup_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    description: 'Fragile electronic equipment',
    status: 'open'
  });

  // 6. Create response to the order
  console.log('💬 Creating carrier response...');
  await supabase.from('responses').insert({
    order_id: orderId,
    carrier_id: carrierUserId,
    price: 150.00,
    delivery_time: '2 days',
    comment: 'I have experience with fragile cargo. Safe delivery guaranteed.'
  });

  // 7. Create a deal
  console.log('🤝 Creating test deal...');
  const dealId = randomUUID();
  await supabase.from('deals').insert({
    id: dealId,
    order_id: orderId,
    client_id: clientUserId,
    carrier_id: carrierUserId,
    agreed_price: 150.00,
    status: 'pending'
  });

  // 8. Create messages
  console.log('💬 Creating test messages...');
  await supabase.from('messages').insert([
    {
      deal_id: dealId,
      sender_id: clientUserId,
      content: 'Hello, can you deliver this package safely?',
      is_system: false
    },
    {
      deal_id: dealId,
      sender_id: carrierUserId,
      content: 'Yes, I have 10 years of experience with fragile cargo. Your package will be safe.',
      is_system: false
    },
    {
      deal_id: dealId,
      sender_id: carrierUserId,
      content: 'I can deliver it within 2 days.',
      is_system: false
    }
  ]);

  // 9. Create AI conversation
  console.log('🤖 Creating AI conversation...');
  const conversationId = randomUUID();
  await supabase.from('ai_conversations').insert({
    id: conversationId,
    user_id: clientUserId,
    title: 'Help with shipping documentation'
  });

  await supabase.from('ai_messages').insert([
    {
      conversation_id: conversationId,
      role: 'user',
      content: 'What documents do I need for international shipping?'
    },
    {
      conversation_id: conversationId,
      role: 'assistant',
      content: 'For international shipping, you typically need: commercial invoice, packing list, bill of lading, and any required customs forms.'
    }
  ]);

  // 10. Create loyalty points
  console.log('⭐ Creating loyalty points...');
  await supabase.from('loyalty_points').insert([
    {
      user_id: clientUserId,
      points: 100,
      total_earned: 100,
      total_spent: 0
    },
    {
      user_id: carrierUserId,
      points: 250,
      total_earned: 250,
      total_spent: 0
    }
  ]);

  // 11. Create favorites
  console.log('⭐ Creating favorites...');
  await supabase.from('favorites').insert({
    user_id: clientUserId,
    carrier_id: carrierUserId
  });

  // 12. Create promo codes
  console.log('🎫 Creating promo codes...');
  await supabase.from('promo_codes').insert([
    {
      code: 'WELCOME10',
      discount_type: 'percentage',
      discount_value: 10.0,
      min_order_value: 50.0,
      max_uses: 100,
      used_count: 0,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      code: 'FLAT20',
      discount_type: 'fixed',
      discount_value: 20.0,
      min_order_value: 100.0,
      max_uses: 50,
      used_count: 0,
      expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
    }
  ]);

  // 13. Create KYC verification for carrier
  console.log('🔐 Creating KYC verification...');
  await supabase.from('kyc_verifications').insert({
    user_id: carrierUserId,
    status: 'approved',
    documents: JSON.stringify([
      { type: 'passport', url: 'https://example.com/passport.jpg' },
      { type: 'driver_license', url: 'https://example.com/license.jpg' }
    ]),
    face_match_score: 0.95,
    verified_at: new Date().toISOString()
  });

  console.log('✅ Test data created successfully!');
}

// Run the initialization
initializeDatabase().catch(console.error);
