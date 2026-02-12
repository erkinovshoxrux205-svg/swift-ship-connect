import { createClient } from '@supabase/supabase-js';

// Конфигурация Supabase
const supabaseUrl = 'https://uxjlhghytiysdtneiota.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4amxoZ2h5dGl5c2R0bmVpb3RhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDkwNzkxMSwiZXhwIjoyMDg2NDgzOTExfQ.VfAVY8tITOWeaWTcOp5WDhOxWHacX58hVggSjVDGj2o';

const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

async function testDirectSQL() {
  console.log('🔍 Прямая проверка таблиц через SQL...');
  
  try {
    // Проверяем существование таблиц через information_schema
    const { data: tables, error: tablesError } = await serviceClient
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['profiles', 'orders', 'deals', 'messages', 'user_roles']);

    if (tablesError) {
      console.log('❌ Ошибка получения списка таблиц:', tablesError.message);
    } else {
      console.log('📋 Найденные таблицы:');
      tables?.forEach(table => {
        console.log(`  ✅ ${table.table_name}`);
      });
    }

    // Пробуем прямой SQL запрос
    console.log('\n🔍 Тест прямого SQL запроса...');
    const { data: profiles, error: profilesError } = await serviceClient
      .rpc('exec', { sql: 'SELECT COUNT(*) as count FROM profiles' });

    if (profilesError) {
      console.log('❌ Ошибка SQL запроса:', profilesError.message);
    } else {
      console.log('✅ SQL запрос выполнен, профилей:', profiles);
    }

    // Альтернативный способ - через view
    console.log('\n🔍 Тест через pg_tables...');
    const { data: pgTables, error: pgError } = await serviceClient
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public')
      .in('tablename', ['profiles', 'orders', 'deals']);

    if (pgError) {
      console.log('❌ Ошибка pg_tables:', pgError.message);
    } else {
      console.log('📋 Таблицы в pg_tables:');
      pgTables?.forEach(table => {
        console.log(`  ✅ ${table.tablename}`);
      });
    }

  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
  }
}

testDirectSQL();
