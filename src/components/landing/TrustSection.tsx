import { Award, Shield, TrendingUp } from "lucide-react";

const trustLevels = [
  {
    level: "Bronze",
    color: "bronze",
    icon: Award,
    requirements: "Первые шаги",
    benefits: ["Базовый профиль", "Доступ к заявкам", "Стандартный чат"],
    minDeals: "0-10 сделок",
  },
  {
    level: "Silver",
    color: "silver",
    icon: Shield,
    requirements: "Проверенный участник",
    benefits: ["Приоритет в поиске", "Расширенная аналитика", "Значок доверия"],
    minDeals: "11-50 сделок",
  },
  {
    level: "Gold",
    color: "gold",
    icon: TrendingUp,
    requirements: "Топ исполнитель",
    benefits: ["Первые в выдаче", "VIP поддержка", "Эксклюзивные заказы"],
    minDeals: "50+ сделок",
  },
];

export const TrustSection = () => {
  return (
    <section id="trust" className="py-24 bg-admin text-admin-foreground overflow-hidden relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full" 
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      <div className="container mx-auto px-4 relative">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white/80 text-sm font-medium mb-6">
            <Shield className="w-4 h-4" />
            Trust System
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Система доверия
          </h2>
          <p className="text-white/70">
            Чем больше успешных сделок — тем выше ваш статус и привилегии
          </p>
        </div>

        {/* Trust Levels */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {trustLevels.map((trust, index) => (
            <div
              key={trust.level}
              className="relative bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              {/* Level Badge */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-xl bg-${trust.color}/20 flex items-center justify-center`}>
                  <trust.icon className={`w-6 h-6 text-${trust.color}`} />
                </div>
                <div>
                  <h3 className={`text-xl font-bold text-${trust.color}`}>{trust.level}</h3>
                  <p className="text-xs text-white/50">{trust.minDeals}</p>
                </div>
              </div>

              {/* Requirements */}
              <p className="text-sm text-white/70 mb-4">{trust.requirements}</p>

              {/* Benefits */}
              <ul className="space-y-2">
                {trust.benefits.map((benefit) => (
                  <li key={benefit} className="flex items-center gap-2 text-sm text-white/80">
                    <div className={`w-1.5 h-1.5 rounded-full bg-${trust.color}`} />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Anti-Fake Notice */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 border border-white/10">
            <Shield className="w-5 h-5 text-driver" />
            <span className="text-sm text-white/80">
              Оценки доступны только после завершённых сделок — защита от накруток
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
