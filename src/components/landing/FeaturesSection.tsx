import { MessageSquare, Shield, Star, TrendingUp, Users, Zap } from "lucide-react";

const features = [
  {
    icon: MessageSquare,
    title: "Умные чаты",
    description: "Общий чат до сделки и отдельный чат для каждой сделки с полной историей",
    color: "customer",
  },
  {
    icon: Shield,
    title: "Безопасность",
    description: "Верификация документов, логи действий и защищённые транзакции",
    color: "driver",
  },
  {
    icon: Star,
    title: "Рейтинги",
    description: "Двусторонние оценки после каждой сделки с защитой от накрутки",
    color: "company",
  },
  {
    icon: TrendingUp,
    title: "Аналитика",
    description: "Графики активности, статистика сделок и контроль эффективности",
    color: "customer",
  },
  {
    icon: Users,
    title: "3 роли",
    description: "Клиенты, водители и компании — каждый со своим интерфейсом",
    color: "driver",
  },
  {
    icon: Zap,
    title: "Быстрый старт",
    description: "Регистрация за минуту, первая заявка — за 5 минут",
    color: "company",
  },
];

const colorClasses = {
  customer: "bg-customer/10 text-customer",
  driver: "bg-driver/10 text-driver",
  company: "bg-company/10 text-company",
};

export const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Всё для успешной логистики
          </h2>
          <p className="text-muted-foreground">
            Мощные инструменты для всех участников процесса
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group bg-card rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${
                  colorClasses[feature.color as keyof typeof colorClasses]
                }`}
              >
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
