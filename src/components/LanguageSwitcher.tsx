import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const langs = [
  { code: "uz", label: "O'zbekcha" },
  { code: "ru", label: "Русский" },
  { code: "en", label: "English" },
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = langs.find((l) => l.code === i18n.language) ?? langs[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 rounded-full">
          <Globe className="size-4" />
          <span className="text-xs font-medium uppercase">{current.code}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="glass-strong">
        {langs.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => i18n.changeLanguage(l.code)}
            className={l.code === i18n.language ? "font-semibold text-primary" : ""}
          >
            {l.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
