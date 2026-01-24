import { useState } from "react";
import { Volume2, VolumeX, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type VoiceGender = "male" | "female";

export interface VoiceSettings {
  enabled: boolean;
  gender: VoiceGender;
  rate: number; // 0.5 - 2.0
}

interface VoiceSettingsPanelProps {
  settings: VoiceSettings;
  onChange: (settings: VoiceSettings) => void;
  isSpeaking?: boolean;
  onTestVoice?: () => void;
}

const translations = {
  voiceSettings: "Настройки голоса",
  voiceGender: "Голос",
  male: "Мужской",
  female: "Женский",
  speechRate: "Скорость речи",
  slow: "Медленно",
  normal: "Нормально",
  fast: "Быстро",
  testVoice: "Тест голоса",
  enabled: "Голос включён",
  disabled: "Голос выключен",
};

export const VoiceSettingsPanel = ({
  settings,
  onChange,
  isSpeaking = false,
  onTestVoice,
}: VoiceSettingsPanelProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggleEnabled = () => {
    onChange({ ...settings, enabled: !settings.enabled });
  };

  const handleGenderChange = (gender: VoiceGender) => {
    onChange({ ...settings, gender });
  };

  const handleRateChange = (value: number[]) => {
    onChange({ ...settings, rate: value[0] });
  };

  const getRateLabel = (rate: number): string => {
    if (rate <= 0.75) return translations.slow;
    if (rate <= 1.25) return translations.normal;
    return translations.fast;
  };

  return (
    <div className="flex items-center gap-2">
      {/* Quick Toggle */}
      <Button
        variant={settings.enabled ? "secondary" : "outline"}
        size="icon"
        onClick={handleToggleEnabled}
        title={settings.enabled ? translations.enabled : translations.disabled}
      >
        {settings.enabled ? (
          <Volume2 className={cn("h-4 w-4", isSpeaking && "text-primary animate-pulse")} />
        ) : (
          <VolumeX className="h-4 w-4" />
        )}
      </Button>

      {/* Settings Popover */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon" title={translations.voiceSettings}>
            <Settings className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 bg-background border shadow-lg z-50" align="end">
          <div className="space-y-4">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              {translations.voiceSettings}
            </h4>

            {/* Voice Gender */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                {translations.voiceGender}
              </Label>
              <Select value={settings.gender} onValueChange={(v) => handleGenderChange(v as VoiceGender)}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-50">
                  <SelectItem value="male">{translations.male}</SelectItem>
                  <SelectItem value="female">{translations.female}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Speech Rate */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">
                  {translations.speechRate}
                </Label>
                <span className="text-xs font-medium">
                  {getRateLabel(settings.rate)} ({settings.rate.toFixed(1)}x)
                </span>
              </div>
              <Slider
                value={[settings.rate]}
                onValueChange={handleRateChange}
                min={0.5}
                max={2.0}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0.5x</span>
                <span>1.0x</span>
                <span>2.0x</span>
              </div>
            </div>

            {/* Test Voice Button */}
            {onTestVoice && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={onTestVoice}
                disabled={!settings.enabled}
              >
                <Volume2 className="h-4 w-4 mr-2" />
                {translations.testVoice}
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
