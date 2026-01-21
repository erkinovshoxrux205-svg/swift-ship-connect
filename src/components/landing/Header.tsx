import { Button } from "@/components/ui/button";
import { Truck, Menu, X } from "lucide-react";
import { useState } from "react";

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 gradient-hero rounded-xl flex items-center justify-center">
              <Truck className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">LogiFlow</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Возможности
            </a>
            <a href="#roles" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Для кого
            </a>
            <a href="#trust" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Доверие
            </a>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="sm">
              Войти
            </Button>
            <Button variant="hero" size="sm">
              Начать бесплатно
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="w-6 h-6 text-foreground" />
            ) : (
              <Menu className="w-6 h-6 text-foreground" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border animate-fade-in">
            <nav className="flex flex-col gap-4">
              <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                Возможности
              </a>
              <a href="#roles" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                Для кого
              </a>
              <a href="#trust" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                Доверие
              </a>
              <div className="flex flex-col gap-2 pt-4">
                <Button variant="outline" size="sm">
                  Войти
                </Button>
                <Button variant="hero" size="sm">
                  Начать бесплатно
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};
