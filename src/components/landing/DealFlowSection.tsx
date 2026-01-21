import { CheckCircle, Clock, MessageSquare, Package, Star, Truck, User } from "lucide-react";

const steps = [
  {
    icon: Package,
    title: "Заявка",
    description: "Клиент создаёт заявку на перевозку",
    color: "customer",
  },
  {
    icon: User,
    title: "Отклик",
    description: "Водитель или компания откликается",
    color: "driver",
  },
  {
    icon: MessageSquare,
    title: "Согласование",
    description: "Обсуждение условий в общем чате",
    color: "company",
  },
  {
    icon: CheckCircle,
    title: "Сделка",
    description: "Клиент подтверждает — создаётся чат сделки",
    color: "customer",
  },
  {
    icon: Truck,
    title: "Доставка",
    description: "Груз в пути с обновлением статуса",
    color: "driver",
  },
  {
    icon: Star,
    title: "Оценка",
    description: "Взаимные оценки после завершения",
    color: "gold",
  },
];

export const DealFlowSection = () => {
  return (
    <section className="py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Как работает сделка
          </h2>
          <p className="text-muted-foreground">
            Простой и прозрачный процесс от заявки до доставки
          </p>
        </div>

        {/* Steps Timeline */}
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            {/* Connection Line */}
            <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-customer via-driver to-gold md:-translate-x-1/2" />

            {/* Steps */}
            <div className="space-y-8">
              {steps.map((step, index) => (
                <div
                  key={step.title}
                  className={`relative flex items-center gap-6 md:gap-12 animate-fade-in ${
                    index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                  }`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Step Number & Icon */}
                  <div className="relative z-10 shrink-0">
                    <div className={`w-12 h-12 rounded-full gradient-${step.color === "gold" ? "hero" : step.color} flex items-center justify-center shadow-lg`}>
                      <step.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className={`flex-1 bg-card rounded-2xl p-6 shadow-sm ${
                    index % 2 === 0 ? "md:text-left" : "md:text-right"
                  }`}>
                    <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                      <span className="font-medium">Шаг {index + 1}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">
                      {step.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {step.description}
                    </p>
                  </div>

                  {/* Spacer for alternating layout */}
                  <div className="hidden md:block flex-1" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
