import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

// Supabase configuration
const supabaseUrl = 'https://uxjlhghytiysdtneiota.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4amxoZ2h5dGl5c2R0bmVpb3RhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDkwNzkxMSwiZXhwIjoyMDg2NDgzOTExfQ.VfAVY8tITOWeaWTcOp5WDhOxWHacX58hVggSjVDGj2o';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTablesDirectly() {
  console.log('🚀 Creating tables directly...');

  try {
    // 1. Create ENUMs
    console.log('📝 Creating enums...');
    
    const enumQueries = [
      'DO $$ BEGIN CREATE TYPE IF NOT EXISTS public.app_role AS ENUM (\'client\', \'carrier\', \'admin\'); EXCEPTION WHEN duplicate_object THEN null; END $$;',
      'DO $$ BEGIN CREATE TYPE IF NOT EXISTS public.order_status AS ENUM (\'open\', \'in_progress\', \'completed\', \'cancelled\'); EXCEPTION WHEN duplicate_object THEN null; END $$;',
      'DO $$ BEGIN CREATE TYPE IF NOT EXISTS public.deal_status AS ENUM (\'pending\', \'accepted\', \'in_transit\', \'delivered\', \'cancelled\'); EXCEPTION WHEN duplicate_object THEN null; END $$;',
      'DO $$ BEGIN CREATE TYPE IF NOT EXISTS public.carrier_type AS ENUM (\'driver\', \'company\'); EXCEPTION WHEN duplicate_object THEN null; END $$;'
    ];

    for (const query of enumQueries) {
      try {
        await supabase.rpc('exec_sql', { sql: query });
      } catch (e) {
        // Continue
      }
    }

    // 2. Create profiles table
    console.log('👤 Creating profiles table...');
    await supabase.from('profiles').select('*').limit(1); // Test if table exists

    // 3. Create user_roles table
    console.log('👥 Creating user_roles table...');
    await supabase.from('user_roles').select('*').limit(1);

    // 4. Create orders table
    console.log('📦 Creating orders table...');
    await supabase.from('orders').select('*').limit(1);

    // 5. Create other tables
    console.log('📊 Creating remaining tables...');
    const tables = ['responses', 'deals', 'messages', 'gps_locations', 'ratings', 'ai_conversations', 'ai_messages', 'subscription_plans', 'user_subscriptions', 'favorites', 'promo_codes', 'user_promo_codes', 'kyc_verifications', 'loyalty_points', 'loyalty_transactions'];

    for (const table of tables) {
      try {
        await supabase.from(table).select('*').limit(1);
        console.log(`✅ ${table} table exists`);
      } catch (error) {
        console.log(`⚠️  ${table} table might not exist yet`);
      }
    }

    console.log('✅ Tables check completed!');

    // Now create test data
    await createTestData();

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function createTestData() {
  console.log('📊 Creating test data...');

  try {
    // Test user IDs
    const adminUserId = randomUUID();
    const clientUserId = randomUUID();
    const carrierUserId = randomUUID();

    // 1. Create admin user profile and role
    console.log('👤 Creating admin user...');
    try {
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
      console.log('✅ Admin user created');
    } catch (error) {
      console.log('⚠️  Admin user might already exist');
    }

    // 2. Create client user
    console.log('👤 Creating client user...');
    try {
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
      console.log('✅ Client user created');
    } catch (error) {
      console.log('⚠️  Client user might already exist');
    }

    // 3. Create carrier user
    console.log('👤 Creating carrier user...');
    try {
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
      console.log('✅ Carrier user created');
    } catch (error) {
      console.log('⚠️  Carrier user might already exist');
    }

    // 4. Create subscription plans
    console.log('💳 Creating subscription plans...');
    const plans = [
      {
        name: 'Basic',
        description: 'Basic plan for individuals',
        price: 10.00,
        duration_days: 30,
        features: ['Basic support', 'Up to 5 orders/month'],
        required_role: 'client'
      },
      {
        name: 'Premium',
        description: 'Premium plan for businesses',
        price: 50.00,
        duration_days: 30,
        features: ['Priority support', 'Unlimited orders', 'Advanced features'],
        required_role: 'client'
      },
      {
        name: 'Carrier Pro',
        description: 'Professional plan for carriers',
        price: 30.00,
        duration_days: 30,
        features: ['Verified badge', 'Priority orders', 'GPS tracking'],
        required_role: 'carrier'
      }
    ];

    try {
      for (const plan of plans) {
        await supabase.from('subscription_plans').insert(plan);
      }
      console.log('✅ Subscription plans created');
    } catch (error) {
      console.log('⚠️  Subscription plans might already exist');
    }

    // 5. Create test order
    console.log('📦 Creating test order...');
    const orderId = randomUUID();
    try {
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
        pickup_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Fragile electronic equipment',
        status: 'open'
      });
      console.log('✅ Test order created');
    } catch (error) {
      console.log('⚠️  Test order might already exist');
    }

    // 6. Create response to the order
    console.log('💬 Creating carrier response...');
    try {
      await supabase.from('responses').insert({
        order_id: orderId,
        carrier_id: carrierUserId,
        price: 150.00,
        delivery_time: '2 days',
        comment: 'I have experience with fragile cargo. Safe delivery guaranteed.'
      });
      console.log('✅ Carrier response created');
    } catch (error) {
      console.log('⚠️  Carrier response might already exist');
    }

    // 7. Create a deal
    console.log('🤝 Creating test deal...');
    const dealId = randomUUID();
    try {
      await supabase.from('deals').insert({
        id: dealId,
        order_id: orderId,
        client_id: clientUserId,
        carrier_id: carrierUserId,
        agreed_price: 150.00,
        status: 'pending'
      });
      console.log('✅ Test deal created');
    } catch (error) {
      console.log('⚠️  Test deal might already exist');
    }

    // 8. Create messages
    console.log('💬 Creating test messages...');
    try {
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
      console.log('✅ Test messages created');
    } catch (error) {
      console.log('⚠️  Test messages might already exist');
    }

    // 9. Create AI conversation
    console.log('🤖 Creating AI conversation...');
    const conversationId = randomUUID();
    try {
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
      console.log('✅ AI conversation created');
    } catch (error) {
      console.log('⚠️  AI conversation might already exist');
    }

    // 10. Create loyalty points
    console.log('⭐ Creating loyalty points...');
    try {
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
      console.log('✅ Loyalty points created');
    } catch (error) {
      console.log('⚠️  Loyalty points might already exist');
    }

    // 11. Create favorites
    console.log('⭐ Creating favorites...');
    try {
      await supabase.from('favorites').insert({
        user_id: clientUserId,
        carrier_id: carrierUserId
      });
      console.log('✅ Favorites created');
    } catch (error) {
      console.log('⚠️  Favorites might already exist');
    }

    // 12. Create promo codes
    console.log('🎫 Creating promo codes...');
    try {
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
      console.log('✅ Promo codes created');
    } catch (error) {
      console.log('⚠️  Promo codes might already exist');
    }

    // 13. Create KYC verification for carrier
    console.log('🔐 Creating KYC verification...');
    try {
      await supabase.from('kyc_verifications').insert({
        user_id: carrierUserId,
        status: 'approved',
        documents: [
          { type: 'passport', url: 'https://example.com/passport.jpg' },
          { type: 'driver_license', url: 'https://example.com/license.jpg' }
        ],
        face_match_score: 0.95,
        verified_at: new Date().toISOString()
      });
      console.log('✅ KYC verification created');
    } catch (error) {
      console.log('⚠️  KYC verification might already exist');
    }

    console.log('🎉 Test data creation completed!');

  } catch (error) {
    console.error('❌ Error creating test data:', error);
  }
}

// Run the initialization
createTablesDirectly().catch(console.error);
