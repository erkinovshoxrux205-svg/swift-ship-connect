import { Truck } from "lucide-react";

const footerLinks = {
  product: {
    title: "Продукт",
    links: ["Возможности", "Тарифы", "API", "Интеграции"],
  },
  company: {
    title: "Компания",
    links: ["О нас", "Карьера", "Блог", "Пресса"],
  },
  resources: {
    title: "Ресурсы",
    links: ["Документация", "Поддержка", "FAQ", "Обучение"],
  },
  legal: {
    title: "Правовая информация",
    links: ["Условия", "Конфиденциальность", "Cookies"],
  },
};

export const Footer = () => {
  return (
    <footer className="bg-card border-t border-border py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-12 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 gradient-hero rounded-xl flex items-center justify-center">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-foreground">LogiFlow</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              Логистическая платформа нового поколения. Соединяем клиентов, водителей и компании.
            </p>
          </div>

          {/* Links */}
          {Object.values(footerLinks).map((section) => (
            <div key={section.title}>
              <h4 className="font-semibold text-foreground mb-4">{section.title}</h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © 2024 LogiFlow. Все права защищены.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Telegram
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              LinkedIn
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
