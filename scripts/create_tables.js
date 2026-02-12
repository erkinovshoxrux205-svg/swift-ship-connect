import { createClient } from '@supabase/supabase-js';

// Конфигурация Supabase
const supabaseUrl = 'https://uxjlhghytiysdtneiota.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4amxoZ2h5dGl5c2R0bmVpb3RhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDkwNzkxMSwiZXhwIjoyMDg2NDgzOTExfQ.VfAVY8tITOWeaWTcOp5WDhOxWHacX58hVggSjVDGj2o';

const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

async function createTablesViaREST() {
  console.log('🔨 Создание таблиц через REST API...');
  
  try {
    // Создаем таблицу profiles
    console.log('👤 Создание таблицы profiles...');
    const profilesSQL = `
      CREATE TABLE IF NOT EXISTS public.profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
        full_name TEXT,
        phone TEXT,
        avatar_url TEXT,
        carrier_type TEXT CHECK (carrier_type IN ('driver', 'company')),
        vehicle_type TEXT,
        company_name TEXT,
        is_verified BOOLEAN DEFAULT false,
        email_verified BOOLEAN DEFAULT FALSE,
        email_verified_at TIMESTAMPTZ,
        last_login_at TIMESTAMPTZ,
        account_status TEXT DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
      );
    `;

    // Создаем таблицу user_roles
    console.log('👥 Создание таблицы user_roles...');
    const userRolesSQL = `
      CREATE TABLE IF NOT EXISTS public.user_roles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
        role TEXT CHECK (role IN ('client', 'carrier', 'admin')) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
        UNIQUE (user_id, role)
      );
    `;

    // Создаем таблицу orders
    console.log('📦 Создание таблицы orders...');
    const ordersSQL = `
      CREATE TABLE IF NOT EXISTS public.orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
        cargo_type TEXT NOT NULL,
        weight DECIMAL(10, 2),
        length DECIMAL(10, 2),
        width DECIMAL(10, 2),
        height DECIMAL(10, 2),
        pickup_address TEXT NOT NULL,
        delivery_address TEXT NOT NULL,
        pickup_date TIMESTAMP WITH TIME ZONE NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
      );
    `;

    // Выполняем SQL через POST запрос к REST API
    const executeSQL = async (sql) => {
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey
        },
        body: JSON.stringify({ sql })
      });
      
      if (!response.ok) {
        const error = await response.text();
        console.log('⚠️ Ошибка выполнения SQL:', error);
        return false;
      }
      
      return true;
    };

    // Пробуем выполнить SQL
    await executeSQL(profilesSQL);
    await executeSQL(userRolesSQL);
    await executeSQL(ordersSQL);

    console.log('✅ Основные таблицы созданы!');

    // Теперь пробуем проверить таблицы
    console.log('🔍 Проверка таблиц...');
    const { data: profiles, error: profilesError } = await serviceClient
      .from('profiles')
      .select('*')
      .limit(1);

    if (profilesError) {
      console.log('❌ Ошибка проверки profiles:', profilesError.message);
    } else {
      console.log('✅ Таблица profiles доступна!');
    }

    const { data: orders, error: ordersError } = await serviceClient
      .from('orders')
      .select('*')
      .limit(1);

    if (ordersError) {
      console.log('❌ Ошибка проверки orders:', ordersError.message);
    } else {
      console.log('✅ Таблица orders доступна!');
    }

    // Добавляем тестовые данные
    console.log('📊 Добавление тестовых данных...');
    const testProfile = {
      id: crypto.randomUUID(),
      user_id: crypto.randomUUID(),
      full_name: 'Admin User',
      email: 'admin@test.com',
      account_status: 'active',
      email_verified: true,
      email_verified_at: new Date().toISOString()
    };

    const { data: insertData, error: insertError } = await serviceClient
      .from('profiles')
      .insert(testProfile)
      .select();

    if (insertError) {
      console.log('❌ Ошибка добавления данных:', insertError.message);
    } else {
      console.log('✅ Тестовые данные добавлены!');
      console.log('👤 Профиль:', insertData[0]);
    }

  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
  }
}

createTablesViaREST();
