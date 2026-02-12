import { createClient } from '@supabase/supabase-js';

// Новая конфигурация Supabase
const supabaseUrl = 'https://uxjlhghytiysdtneiota.supabase.co';
const supabaseAnonKey = 'sb_publishable_Ww8WaamV4fAuGG47FtM2tA_BkLOE2WG';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4amxoZ2h5dGl5c2R0bmVpb3RhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDkwNzkxMSwiZXhwIjoyMDg2NDgzOTExfQ.VfAVY8tITOWeaWTcOp5WDhOxWHacX58hVggSjVDGj2o';

// Создаем клиенты
const anonClient = createClient(supabaseUrl, supabaseAnonKey);
const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

async function testNewKey() {
  console.log('🔑 Тестирование нового publishable ключа...');
  
  try {
    // 1. Тест подключения с новым anon ключом
    console.log('📡 Тест anon подключения с новым ключом...');
    const { data: anonData, error: anonError } = await anonClient.from('profiles').select('*').limit(1);
    
    if (anonError) {
      console.log('❌ Ошибка anon подключения:', anonError.message);
      console.log('🔍 Пробуем проверить доступность проекта...');
      
      // Тест базового подключения
      const { data: healthCheck, error: healthError } = await anonClient
        .from('_health_check')
        .select('*')
        .limit(1);
        
      if (healthError && healthError.message.includes('JWT')) {
        console.log('✅ Ключ работает, но таблицы еще не созданы');
      } else {
        console.log('❌ Проблема с ключом:', healthError?.message);
      }
    } else {
      console.log('✅ Anon подключение успешно!');
      console.log(`📊 Найдено профилей: ${anonData?.length || 0}`);
    }

    // 2. Тест подключения с service role ключом
    console.log('🔑 Тест service role подключения...');
    const { data: serviceData, error: serviceError } = await serviceClient.from('profiles').select('*').limit(5);
    
    if (serviceError) {
      console.log('❌ Ошибка service role подключения:', serviceError.message);
      
      if (serviceError.message.includes('relation "public.profiles" does not exist')) {
        console.log('📋 Нужно выполнить SQL скрипт для создания таблиц');
        console.log('📝 Скрипт находится в: scripts/create_schema.sql');
        console.log('🌐 Выполните в Supabase Dashboard: https://uxjlhghytiysdtneiota.supabase.co');
      }
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

    // 3. Проверка конфигурации приложения
    console.log('⚙️ Проверка конфигурации...');
    console.log('🔗 URL:', supabaseUrl);
    console.log('🔑 Anon Key:', supabaseAnonKey.substring(0, 20) + '...');
    console.log('🔐 Service Key:', supabaseServiceKey.substring(0, 20) + '...');

    console.log('🎉 Тестирование завершено!');

  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
  }
}

// Запускаем тест
testNewKey();
