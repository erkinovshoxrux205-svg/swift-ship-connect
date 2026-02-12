import { createClient } from '@supabase/supabase-js';

// Конфигурация Supabase
const supabaseUrl = 'https://uxjlhghytiysdtneiota.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4amxoZ2h5dGl5c2R0bmVpb3RhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MDc5MTEsImV4cCI6MjA4NjQ4MzkxMX0.DcbQsn_ft2OZVt0GcwYxgNqhS_Hm5FNuSmq9rmoZ8E0';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4amxoZ2h5dGl5c2R0bmVpb3RhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDkwNzkxMSwiZXhwIjoyMDg2NDgzOTExfQ.VfAVY8tITOWeaWTcOp5WDhOxWHacX58hVggSjVDGj2o';

// Создаем клиенты
const anonClient = createClient(supabaseUrl, supabaseAnonKey);
const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

async function testSupabaseConnection() {
  console.log('🚀 Тестирование подключения к Supabase...');
  
  try {
    // 1. Тест подключения с anon ключом
    console.log('📡 Тест anon подключения...');
    const { data: anonData, error: anonError } = await anonClient.from('profiles').select('*').limit(1);
    
    if (anonError) {
      console.log('❌ Ошибка anon подключения:', anonError.message);
    } else {
      console.log('✅ Anon подключение успешно!');
      console.log(`📊 Найдено профилей: ${anonData?.length || 0}`);
    }

    // 2. Тест подключения с service role ключом
    console.log('🔑 Тест service role подключения...');
    const { data: serviceData, error: serviceError } = await serviceClient.from('profiles').select('*').limit(5);
    
    if (serviceError) {
      console.log('❌ Ошибка service role подключения:', serviceError.message);
    } else {
      console.log('✅ Service role подключение успешно!');
      console.log(`📊 Найдено профилей: ${serviceData?.length || 0}`);
      
      // Показываем пример данных
      if (serviceData && serviceData.length > 0) {
        console.log('👤 Пример профиля:', {
          id: serviceData[0].id,
          full_name: serviceData[0].full_name,
          email: serviceData[0].email,
          account_status: serviceData[0].account_status
        });
      }
    }

    // 3. Проверка основных таблиц
    console.log('🗄️ Проверка таблиц...');
    const tables = ['orders', 'deals', 'messages', 'user_roles', 'subscription_plans'];
    
    for (const table of tables) {
      try {
        const { data, error } = await serviceClient.from(table).select('*').limit(1);
        if (error) {
          console.log(`❌ Таблица ${table}:`, error.message);
        } else {
          console.log(`✅ Таблица ${table}: ${data?.length || 0} записей`);
        }
      } catch (e) {
        console.log(`❌ Таблица ${table}: не существует`);
      }
    }

    // 4. Тест создания записи
    console.log('➕ Тест создания записи...');
    const testProfile = {
      id: crypto.randomUUID(),
      user_id: crypto.randomUUID(),
      full_name: 'Test User',
      email: `test-${Date.now()}@example.com`,
      account_status: 'active',
      email_verified: true,
      email_verified_at: new Date().toISOString()
    };

    const { data: insertData, error: insertError } = await serviceClient
      .from('profiles')
      .insert(testProfile)
      .select();

    if (insertError) {
      console.log('❌ Ошибка создания записи:', insertError.message);
    } else {
      console.log('✅ Тестовая запись создана успешно!');
      
      // Удаляем тестовую запись
      await serviceClient.from('profiles').delete().eq('id', testProfile.id);
      console.log('🗑️ Тестовая запись удалена');
    }

    console.log('🎉 Тестирование Supabase завершено успешно!');

  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
  }
}

// Запускаем тест
testSupabaseConnection();
