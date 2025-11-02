import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccordionSectionProps {
  value: string;
  title: string;
  icon: LucideIcon;
  iconColor: string;
  children: React.ReactNode;
}

export const DashboardAccordion = ({ children }: { children: React.ReactNode }) => {
  return (
    <Accordion type="single" collapsible className="w-full space-y-2">
      {children}
    </Accordion>
  );
};

export const AccordionSection = ({ value, title, icon: Icon, iconColor, children }: AccordionSectionProps) => {
  return (
    <AccordionItem value={value} className="bg-card border rounded-xl sm:rounded-2xl shadow-sm overflow-hidden">
      <AccordionTrigger className="px-4 sm:px-6 py-3 sm:py-4 hover:no-underline hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className={cn("w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0", iconColor)}>
            <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
          <span className="font-semibold text-base sm:text-lg text-foreground text-left">{title}</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 sm:px-6 pb-4 sm:pb-6 pt-2">
        {children}
      </AccordionContent>
    </AccordionItem>
  );
};
