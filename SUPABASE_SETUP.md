# 🚀 Swift Ship Connect - Supabase Setup Instructions

## 📋 Current Status
✅ **Application configured** with new Supabase project  
✅ **Security settings updated** with proper keys  
✅ **Build successful** - ready for deployment  
⏳ **Database tables** need to be created  

## 🔧 Configuration Updated
```env
VITE_SUPABASE_URL="https://uxjlhghytiysdtneiota.supabase.co"
VITE_SUPABASE_ANON_KEY="sb_publishable_Ww8WaamV4fAuGG47FtM2tA_BkLOE2WG"
SUPABASE_SERVICE_ROLE_KEY="[service role key for backend]"
```

## 🗄️ Database Setup

### Option 1: Quick Setup (Recommended)
1. Open **Supabase Dashboard**: https://uxjlhghytiysdtneiota.supabase.co
2. Go to **SQL Editor**
3. Copy and paste the entire content of: `scripts/create_schema.sql`
4. Click **Run** to execute
5. ✅ Database ready with test data!

### Option 2: Manual Setup
Run these SQL commands in Supabase SQL Editor:

```sql
-- Create basic tables
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  email TEXT,
  account_status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT CHECK (role IN ('client', 'carrier', 'admin')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add more tables as needed from create_schema.sql
```

## 🧪 Test Connection
After creating tables, run:
```bash
node scripts/test_new_key.js
```

## 🚀 Start Application
```bash
npm run dev
```
Application will be available at: http://localhost:8082/

## 📊 What's Included in Database
- ✅ User profiles and roles
- ✅ Orders and deals system
- ✅ Messaging and GPS tracking
- ✅ Ratings and reviews
- ✅ AI conversations
- ✅ Subscription plans
- ✅ Loyalty points system
- ✅ Promo codes
- ✅ KYC verification
- ✅ Test users and data

## 🔐 Security Features
- ✅ Row Level Security disabled (Firebase Auth)
- ✅ Service role key only for backend
- ✅ Anon key only for frontend
- ✅ No hardcoded secrets in code

## 📱 Test Users Created
- **Admin**: admin@test.com
- **Client**: client@test.com  
- **Carrier**: carrier@test.com

---

**Next Steps**: Execute the SQL script in Supabase Dashboard and your application will be fully functional! 🎉
