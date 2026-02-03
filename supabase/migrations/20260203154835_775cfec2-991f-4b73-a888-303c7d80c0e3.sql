-- Database Optimization Migration (Адаптировано под реальную схему)
-- Оптимизация базы данных для высокой производительности

-- 1. Индексы для таблицы orders
CREATE INDEX IF NOT EXISTS idx_orders_client_id_status 
ON orders(client_id, status);

CREATE INDEX IF NOT EXISTS idx_orders_created_at 
ON orders(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_status_created_at 
ON orders(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_pickup_delivery 
ON orders(pickup_address, delivery_address);

CREATE INDEX IF NOT EXISTS idx_orders_client_status_created 
ON orders(client_id, status, created_at DESC);

-- 2. Индексы для таблицы deals
CREATE INDEX IF NOT EXISTS idx_deals_carrier_id_status 
ON deals(carrier_id, status);

CREATE INDEX IF NOT EXISTS idx_deals_client_id_status 
ON deals(client_id, status);

CREATE INDEX IF NOT EXISTS idx_deals_order_id 
ON deals(order_id);

CREATE INDEX IF NOT EXISTS idx_deals_status_created_at 
ON deals(status, created_at DESC);

-- 3. Индексы для таблицы gps_locations
CREATE INDEX IF NOT EXISTS idx_gps_locations_deal_id_recorded 
ON gps_locations(deal_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_gps_locations_carrier_id_recorded 
ON gps_locations(carrier_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_gps_locations_recorded_at 
ON gps_locations(recorded_at DESC);

-- 4. Индексы для таблицы notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_is_read 
ON notifications(user_id, is_read);

CREATE INDEX IF NOT EXISTS idx_notifications_firebase_uid_is_read 
ON notifications(firebase_uid, is_read);

CREATE INDEX IF NOT EXISTS idx_notifications_created_at 
ON notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_type_created_at 
ON notifications(type, created_at DESC);

-- 5. Индексы для таблицы profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email 
ON profiles(email);

CREATE INDEX IF NOT EXISTS idx_profiles_phone 
ON profiles(phone);

CREATE INDEX IF NOT EXISTS idx_profiles_role 
ON profiles(role);

CREATE INDEX IF NOT EXISTS idx_profiles_firebase_uid 
ON profiles(firebase_uid);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id 
ON profiles(user_id);

-- 6. Индексы для таблицы responses
CREATE INDEX IF NOT EXISTS idx_responses_order_id 
ON responses(order_id);

CREATE INDEX IF NOT EXISTS idx_responses_carrier_id 
ON responses(carrier_id);

CREATE INDEX IF NOT EXISTS idx_responses_order_carrier 
ON responses(order_id, carrier_id);

-- 7. Индексы для таблицы messages
CREATE INDEX IF NOT EXISTS idx_messages_deal_id_created 
ON messages(deal_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_order_id_created 
ON messages(order_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_sender_id 
ON messages(sender_id);

-- 8. Индексы для таблицы ratings
CREATE INDEX IF NOT EXISTS idx_ratings_deal_id 
ON ratings(deal_id);

CREATE INDEX IF NOT EXISTS idx_ratings_rated_id 
ON ratings(rated_id);

CREATE INDEX IF NOT EXISTS idx_ratings_rater_id 
ON ratings(rater_id);

-- 9. Индексы для таблицы user_roles
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id 
ON user_roles(user_id);

CREATE INDEX IF NOT EXISTS idx_user_roles_firebase_uid 
ON user_roles(firebase_uid);

CREATE INDEX IF NOT EXISTS idx_user_roles_role 
ON user_roles(role);

-- 10. Индексы для таблицы kyc_documents
CREATE INDEX IF NOT EXISTS idx_kyc_documents_user_id 
ON kyc_documents(user_id);

CREATE INDEX IF NOT EXISTS idx_kyc_documents_status 
ON kyc_documents(status);

-- 11. Индексы для таблицы payments
CREATE INDEX IF NOT EXISTS idx_payments_user_id_status 
ON payments(user_id, status);

CREATE INDEX IF NOT EXISTS idx_payments_created_at 
ON payments(created_at DESC);

-- 12. Индексы для таблицы balance_transactions
CREATE INDEX IF NOT EXISTS idx_balance_transactions_user_id 
ON balance_transactions(user_id);

CREATE INDEX IF NOT EXISTS idx_balance_transactions_created_at 
ON balance_transactions(created_at DESC);

-- 13. Индексы для telegram_verifications
CREATE INDEX IF NOT EXISTS idx_telegram_verifications_phone 
ON telegram_verifications(phone);

CREATE INDEX IF NOT EXISTS idx_telegram_verifications_telegram_id 
ON telegram_verifications(telegram_id);

-- 14. Создание расширения для полнотекстового поиска
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 15. Полнотекстовый поиск по адресам
CREATE INDEX IF NOT EXISTS idx_orders_pickup_address_trgm 
ON orders USING gin(pickup_address gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_orders_delivery_address_trgm 
ON orders USING gin(delivery_address gin_trgm_ops);

-- 16. Добавление комментариев к таблицам
COMMENT ON TABLE orders IS 'Заказы на перевозку грузов';
COMMENT ON TABLE deals IS 'Сделки между клиентами и перевозчиками';
COMMENT ON TABLE gps_locations IS 'GPS координаты трекинга';
COMMENT ON TABLE notifications IS 'Уведомления пользователей';
COMMENT ON TABLE profiles IS 'Профили пользователей';
COMMENT ON TABLE responses IS 'Отклики перевозчиков на заказы';
COMMENT ON TABLE messages IS 'Сообщения в чатах';
COMMENT ON TABLE ratings IS 'Рейтинги и отзывы';

-- 17. Создание представлений для часто используемых запросов
CREATE OR REPLACE VIEW active_deals AS
SELECT 
    d.*,
    o.cargo_type,
    o.pickup_address,
    o.delivery_address,
    o.weight,
    o.client_price as order_price,
    p_client.full_name as client_name,
    p_client.email as client_email,
    p_carrier.full_name as carrier_name,
    p_carrier.email as carrier_email
FROM deals d
LEFT JOIN orders o ON d.order_id = o.id
LEFT JOIN profiles p_client ON d.client_id = p_client.user_id
LEFT JOIN profiles p_carrier ON d.carrier_id = p_carrier.user_id
WHERE d.status IN ('pending', 'accepted', 'in_transit');

CREATE OR REPLACE VIEW carrier_statistics AS
SELECT 
    carrier_id,
    COUNT(*) as total_deals,
    COUNT(CASE WHEN status = 'delivered' THEN 1 END) as completed_deals,
    COUNT(CASE WHEN status = 'in_transit' THEN 1 END) as active_deals,
    SUM(agreed_price) as total_earnings,
    AVG(agreed_price) as avg_deal_price,
    CASE 
        WHEN COUNT(*) > 0 THEN 
            ROUND((COUNT(CASE WHEN status = 'delivered' THEN 1 END)::NUMERIC / COUNT(*)::NUMERIC) * 100, 2)
        ELSE 0 
    END as completion_rate
FROM deals
GROUP BY carrier_id;

-- 18. Функция для получения статистики перевозчика
CREATE OR REPLACE FUNCTION get_carrier_stats(carrier_user_id TEXT)
RETURNS TABLE(
    total_deals BIGINT,
    completed_deals BIGINT,
    active_deals BIGINT,
    total_earnings NUMERIC,
    avg_deal_price NUMERIC,
    completion_rate NUMERIC,
    avg_rating NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_deals,
        COUNT(CASE WHEN d.status = 'delivered' THEN 1 END)::BIGINT as completed_deals,
        COUNT(CASE WHEN d.status = 'in_transit' THEN 1 END)::BIGINT as active_deals,
        COALESCE(SUM(d.agreed_price), 0) as total_earnings,
        COALESCE(AVG(d.agreed_price), 0) as avg_deal_price,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                ROUND((COUNT(CASE WHEN d.status = 'delivered' THEN 1 END)::NUMERIC / COUNT(*)::NUMERIC) * 100, 2)
            ELSE 0 
        END as completion_rate,
        COALESCE((SELECT AVG(r.score) FROM ratings r WHERE r.rated_id = carrier_user_id), 0) as avg_rating
    FROM deals d
    WHERE d.carrier_id = carrier_user_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- 19. Функция для очистки старых GPS данных
CREATE OR REPLACE FUNCTION cleanup_old_gps_data(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM gps_locations 
    WHERE recorded_at < NOW() - INTERVAL '1 day' * days_to_keep;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 20. Настройка авто-вакуума для таблиц с частыми изменениями
ALTER TABLE gps_locations SET (autovacuum_enabled = true, autovacuum_vacuum_scale_factor = 0.1);
ALTER TABLE gps_locations SET (autovacuum_analyze_scale_factor = 0.05);

ALTER TABLE notifications SET (autovacuum_enabled = true, autovacuum_vacuum_scale_factor = 0.1);
ALTER TABLE notifications SET (autovacuum_analyze_scale_factor = 0.05);

ALTER TABLE messages SET (autovacuum_enabled = true, autovacuum_vacuum_scale_factor = 0.1);
ALTER TABLE messages SET (autovacuum_analyze_scale_factor = 0.05);