import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Language = "ru" | "uz" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translations
const translations: Record<Language, Record<string, string>> = {
  ru: {
    // Common
    "common.loading": "Загрузка...",
    "common.save": "Сохранить",
    "common.cancel": "Отмена",
    "common.delete": "Удалить",
    "common.edit": "Редактировать",
    "common.back": "Назад",
    "common.next": "Далее",
    "common.submit": "Отправить",
    "common.search": "Поиск",
    "common.filter": "Фильтр",
    "common.export": "Экспорт",
    "common.currency": "сум",
    "common.km": "км",
    "common.kg": "кг",
    
    // Auth
    "auth.login": "Войти",
    "auth.logout": "Выйти",
    "auth.register": "Регистрация",
    "auth.email": "Email",
    "auth.password": "Пароль",
    "auth.forgotPassword": "Забыли пароль?",
    
    // Navigation
    "nav.home": "Главная",
    "nav.dashboard": "Панель управления",
    "nav.profile": "Профиль",
    "nav.orders": "Заказы",
    "nav.deals": "Сделки",
    "nav.settings": "Настройки",
    
    // Roles
    "role.client": "Клиент",
    "role.carrier": "Перевозчик",
    "role.admin": "Администратор",
    
    // Dashboard
    "dashboard.myDeals": "Мои сделки",
    "dashboard.noDeals": "У вас пока нет активных сделок",
    "dashboard.deals": "сделок",
    
    // Orders
    "orders.create": "Создать заказ",
    "orders.myOrders": "Мои заказы",
    "orders.available": "Доступные заказы",
    "orders.cargoType": "Тип груза",
    "orders.weight": "Вес",
    "orders.dimensions": "Габариты",
    "orders.pickupAddress": "Адрес забора",
    "orders.deliveryAddress": "Адрес доставки",
    "orders.pickupDate": "Дата забора",
    "orders.description": "Описание",
    "orders.price": "Цена",
    "orders.clientPrice": "Цена клиента",
    
    // Carrier
    "carrier.stats": "Статистика перевозчика",
    "carrier.history": "Ваша история и достижения",
    "carrier.completed": "Выполнено",
    "carrier.earned": "Заработано",
    "carrier.rating": "Рейтинг",
    "carrier.inProgress": "В работе",
    "carrier.completionRate": "Завершённость",
    "carrier.ordersCompleted": "заказов выполнено",
    "carrier.yourRating": "Ваш рейтинг",
    "carrier.reviews": "отзывов",
    "carrier.thisMonth": "В этом месяце",
    "carrier.orders": "Заказов",
    "carrier.cancelled": "Отменено",
    "carrier.achievements": "Достижения",
    "carrier.unlocked": "Разблокировано",
    "carrier.of": "из",
    "carrier.nextAchievements": "Следующие достижения",
    "carrier.preferences": "Настройки уведомлений",
    
    // Levels
    "level.beginner": "Новичок",
    "level.experienced": "Опытный",
    "level.professional": "Профессионал",
    "level.expert": "Эксперт",
    "level.yourLevel": "Ваш уровень",
    "level.privileges": "Привилегии",
    "level.nextLevel": "До следующего уровня",
    "level.dealsNeeded": "заказов",
    "level.priorityOrders": "Приоритетные заказы",
    "level.reducedCommission": "Сниженная комиссия",
    "level.verifiedBadge": "Значок проверенного",
    "level.premiumSupport": "Премиум поддержка",
    "level.topPlacement": "Топ размещение",
    "level.exclusiveOffers": "Эксклюзивные предложения",
    
    // Deals
    "deals.status.pending": "Ожидает",
    "deals.status.accepted": "Принята",
    "deals.status.in_transit": "В пути",
    "deals.status.delivered": "Доставлено",
    "deals.status.cancelled": "Отменена",
    "deals.chat": "Чат",
    "deals.driver": "Перевозчик",
    "deals.client": "Клиент",
    
    // Negotiation
    "negotiation.title": "Торг по цене",
    "negotiation.clientPrice": "Цена клиента",
    "negotiation.currentPrice": "Текущая цена",
    "negotiation.waitingResponse": "Ожидает ответа",
    "negotiation.accepted": "Принято",
    "negotiation.rejected": "Отклонено",
    "negotiation.priceAgreed": "Цена согласована",
    "negotiation.proposePrice": "Предложить цену",
    "negotiation.yourPrice": "Ваша цена",
    "negotiation.comment": "Комментарий (необязательно)",
    "negotiation.propose": "Предложить",
    
    // Calculator
    "calculator.title": "Калькулятор доставки",
    "calculator.description": "Рассчитайте стоимость между городами",
    "calculator.from": "Откуда",
    "calculator.to": "Куда",
    "calculator.selectCity": "Выберите город",
    "calculator.cargoWeight": "Вес груза",
    "calculator.vehicleType": "Тип транспорта",
    "calculator.currency": "Валюта",
    "calculator.distance": "Расстояние",
    "calculator.basePrice": "Базовая цена",
    "calculator.distancePrice": "Расстояние",
    "calculator.weightPrice": "Вес",
    "calculator.vehicleSurcharge": "Надбавка транспорта",
    "calculator.borderFee": "Пошлина границы",
    "calculator.totalPrice": "Итого",
    "calculator.internationalShipping": "Международная перевозка",
    "calculator.approximatePrice": "Примерная цена",
    "calculator.exchangeRate": "Курс",
    
    // Map
    "map.route": "Маршрут",
    "map.showOnMap": "Показать на карте",
    
    // Languages
    "language.ru": "Русский",
    "language.uz": "O'zbek",
    "language.en": "English",
    "language.select": "Язык",
  },
  
  uz: {
    // Common
    "common.loading": "Yuklanmoqda...",
    "common.save": "Saqlash",
    "common.cancel": "Bekor qilish",
    "common.delete": "O'chirish",
    "common.edit": "Tahrirlash",
    "common.back": "Orqaga",
    "common.next": "Keyingi",
    "common.submit": "Yuborish",
    "common.search": "Qidirish",
    "common.filter": "Filtr",
    "common.export": "Eksport",
    "common.currency": "so'm",
    "common.km": "km",
    "common.kg": "kg",
    
    // Auth
    "auth.login": "Kirish",
    "auth.logout": "Chiqish",
    "auth.register": "Ro'yxatdan o'tish",
    "auth.email": "Email",
    "auth.password": "Parol",
    "auth.forgotPassword": "Parolni unutdingizmi?",
    
    // Navigation
    "nav.home": "Bosh sahifa",
    "nav.dashboard": "Boshqaruv paneli",
    "nav.profile": "Profil",
    "nav.orders": "Buyurtmalar",
    "nav.deals": "Bitimlar",
    "nav.settings": "Sozlamalar",
    
    // Roles
    "role.client": "Mijoz",
    "role.carrier": "Haydovchi",
    "role.admin": "Administrator",
    
    // Dashboard
    "dashboard.myDeals": "Mening bitimlarim",
    "dashboard.noDeals": "Sizda hali faol bitimlar yo'q",
    "dashboard.deals": "ta bitim",
    
    // Orders
    "orders.create": "Buyurtma yaratish",
    "orders.myOrders": "Mening buyurtmalarim",
    "orders.available": "Mavjud buyurtmalar",
    "orders.cargoType": "Yuk turi",
    "orders.weight": "Og'irligi",
    "orders.dimensions": "O'lchamlari",
    "orders.pickupAddress": "Olish manzili",
    "orders.deliveryAddress": "Yetkazish manzili",
    "orders.pickupDate": "Olish sanasi",
    "orders.description": "Tavsif",
    "orders.price": "Narx",
    "orders.clientPrice": "Mijoz narxi",
    
    // Carrier
    "carrier.stats": "Haydovchi statistikasi",
    "carrier.history": "Sizning tarix va yutuqlaringiz",
    "carrier.completed": "Bajarildi",
    "carrier.earned": "Topilgan",
    "carrier.rating": "Reyting",
    "carrier.inProgress": "Jarayonda",
    "carrier.completionRate": "Bajarilish darajasi",
    "carrier.ordersCompleted": "ta buyurtma bajarildi",
    "carrier.yourRating": "Sizning reytingingiz",
    "carrier.reviews": "ta sharh",
    "carrier.thisMonth": "Bu oy",
    "carrier.orders": "Buyurtmalar",
    "carrier.cancelled": "Bekor qilindi",
    "carrier.achievements": "Yutuqlar",
    "carrier.unlocked": "Ochilgan",
    "carrier.of": "dan",
    "carrier.nextAchievements": "Keyingi yutuqlar",
    "carrier.preferences": "Bildirishnoma sozlamalari",
    
    // Levels
    "level.beginner": "Yangi",
    "level.experienced": "Tajribali",
    "level.professional": "Professional",
    "level.expert": "Ekspert",
    "level.yourLevel": "Sizning darajangiz",
    "level.privileges": "Imtiyozlar",
    "level.nextLevel": "Keyingi darajagacha",
    "level.dealsNeeded": "ta buyurtma",
    "level.priorityOrders": "Ustuvor buyurtmalar",
    "level.reducedCommission": "Kamaytrilgan komissiya",
    "level.verifiedBadge": "Tasdiqlangan nishoni",
    "level.premiumSupport": "Premium yordam",
    "level.topPlacement": "Yuqori joylashuv",
    "level.exclusiveOffers": "Eksklyuziv takliflar",
    
    // Deals
    "deals.status.pending": "Kutilmoqda",
    "deals.status.accepted": "Qabul qilindi",
    "deals.status.in_transit": "Yo'lda",
    "deals.status.delivered": "Yetkazildi",
    "deals.status.cancelled": "Bekor qilindi",
    "deals.chat": "Chat",
    "deals.driver": "Haydovchi",
    "deals.client": "Mijoz",
    
    // Negotiation
    "negotiation.title": "Narx savdosi",
    "negotiation.clientPrice": "Mijoz narxi",
    "negotiation.currentPrice": "Joriy narx",
    "negotiation.waitingResponse": "Javob kutilmoqda",
    "negotiation.accepted": "Qabul qilindi",
    "negotiation.rejected": "Rad etildi",
    "negotiation.priceAgreed": "Narx kelishildi",
    "negotiation.proposePrice": "Narxni taklif qilish",
    "negotiation.yourPrice": "Sizning narxingiz",
    "negotiation.comment": "Izoh (ixtiyoriy)",
    "negotiation.propose": "Taklif qilish",
    
    // Calculator
    "calculator.title": "Yetkazib berish kalkulyatori",
    "calculator.description": "Shaharlar o'rtasida narxni hisoblang",
    "calculator.from": "Qayerdan",
    "calculator.to": "Qayerga",
    "calculator.selectCity": "Shaharni tanlang",
    "calculator.cargoWeight": "Yuk og'irligi",
    "calculator.vehicleType": "Transport turi",
    "calculator.currency": "Valyuta",
    "calculator.distance": "Masofa",
    "calculator.basePrice": "Bazaviy narx",
    "calculator.distancePrice": "Masofa",
    "calculator.weightPrice": "Og'irlik",
    "calculator.vehicleSurcharge": "Transport ustamasi",
    "calculator.borderFee": "Chegara to'lovi",
    "calculator.totalPrice": "Jami",
    "calculator.internationalShipping": "Xalqaro tashish",
    "calculator.approximatePrice": "Taxminiy narx",
    "calculator.exchangeRate": "Kurs",
    
    // Map
    "map.route": "Marshrut",
    "map.showOnMap": "Xaritada ko'rsatish",
    
    // Languages
    "language.ru": "Русский",
    "language.uz": "O'zbek",
    "language.en": "English",
    "language.select": "Til",
  },
  
  en: {
    // Common
    "common.loading": "Loading...",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.back": "Back",
    "common.next": "Next",
    "common.submit": "Submit",
    "common.search": "Search",
    "common.filter": "Filter",
    "common.export": "Export",
    "common.currency": "UZS",
    "common.km": "km",
    "common.kg": "kg",
    
    // Auth
    "auth.login": "Login",
    "auth.logout": "Logout",
    "auth.register": "Register",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.forgotPassword": "Forgot password?",
    
    // Navigation
    "nav.home": "Home",
    "nav.dashboard": "Dashboard",
    "nav.profile": "Profile",
    "nav.orders": "Orders",
    "nav.deals": "Deals",
    "nav.settings": "Settings",
    
    // Roles
    "role.client": "Client",
    "role.carrier": "Carrier",
    "role.admin": "Administrator",
    
    // Dashboard
    "dashboard.myDeals": "My Deals",
    "dashboard.noDeals": "You don't have any active deals yet",
    "dashboard.deals": "deals",
    
    // Orders
    "orders.create": "Create Order",
    "orders.myOrders": "My Orders",
    "orders.available": "Available Orders",
    "orders.cargoType": "Cargo Type",
    "orders.weight": "Weight",
    "orders.dimensions": "Dimensions",
    "orders.pickupAddress": "Pickup Address",
    "orders.deliveryAddress": "Delivery Address",
    "orders.pickupDate": "Pickup Date",
    "orders.description": "Description",
    "orders.price": "Price",
    "orders.clientPrice": "Client Price",
    
    // Carrier
    "carrier.stats": "Carrier Statistics",
    "carrier.history": "Your history and achievements",
    "carrier.completed": "Completed",
    "carrier.earned": "Earned",
    "carrier.rating": "Rating",
    "carrier.inProgress": "In Progress",
    "carrier.completionRate": "Completion Rate",
    "carrier.ordersCompleted": "orders completed",
    "carrier.yourRating": "Your Rating",
    "carrier.reviews": "reviews",
    "carrier.thisMonth": "This Month",
    "carrier.orders": "Orders",
    "carrier.cancelled": "Cancelled",
    "carrier.achievements": "Achievements",
    "carrier.unlocked": "Unlocked",
    "carrier.of": "of",
    "carrier.nextAchievements": "Next Achievements",
    "carrier.preferences": "Notification Settings",
    
    // Levels
    "level.beginner": "Beginner",
    "level.experienced": "Experienced",
    "level.professional": "Professional",
    "level.expert": "Expert",
    "level.yourLevel": "Your Level",
    "level.privileges": "Privileges",
    "level.nextLevel": "To Next Level",
    "level.dealsNeeded": "deals",
    "level.priorityOrders": "Priority Orders",
    "level.reducedCommission": "Reduced Commission",
    "level.verifiedBadge": "Verified Badge",
    "level.premiumSupport": "Premium Support",
    "level.topPlacement": "Top Placement",
    "level.exclusiveOffers": "Exclusive Offers",
    
    // Deals
    "deals.status.pending": "Pending",
    "deals.status.accepted": "Accepted",
    "deals.status.in_transit": "In Transit",
    "deals.status.delivered": "Delivered",
    "deals.status.cancelled": "Cancelled",
    "deals.chat": "Chat",
    "deals.driver": "Driver",
    "deals.client": "Client",
    
    // Negotiation
    "negotiation.title": "Price Negotiation",
    "negotiation.clientPrice": "Client Price",
    "negotiation.currentPrice": "Current Price",
    "negotiation.waitingResponse": "Waiting Response",
    "negotiation.accepted": "Accepted",
    "negotiation.rejected": "Rejected",
    "negotiation.priceAgreed": "Price Agreed",
    "negotiation.proposePrice": "Propose Price",
    "negotiation.yourPrice": "Your Price",
    "negotiation.comment": "Comment (optional)",
    "negotiation.propose": "Propose",
    
    // Calculator
    "calculator.title": "Delivery Calculator",
    "calculator.description": "Calculate cost between cities",
    "calculator.from": "From",
    "calculator.to": "To",
    "calculator.selectCity": "Select city",
    "calculator.cargoWeight": "Cargo Weight",
    "calculator.vehicleType": "Vehicle Type",
    "calculator.currency": "Currency",
    "calculator.distance": "Distance",
    "calculator.basePrice": "Base Price",
    "calculator.distancePrice": "Distance",
    "calculator.weightPrice": "Weight",
    "calculator.vehicleSurcharge": "Vehicle Surcharge",
    "calculator.borderFee": "Border Fee",
    "calculator.totalPrice": "Total",
    "calculator.internationalShipping": "International Shipping",
    "calculator.approximatePrice": "Approximate Price",
    "calculator.exchangeRate": "Exchange Rate",
    
    // Map
    "map.route": "Route",
    "map.showOnMap": "Show on Map",
    
    // Languages
    "language.ru": "Русский",
    "language.uz": "O'zbek",
    "language.en": "English",
    "language.select": "Language",
  },
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("app-language");
    return (saved as Language) || "ru";
  });

  useEffect(() => {
    localStorage.setItem("app-language", language);
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
