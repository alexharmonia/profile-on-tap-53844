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
    <AccordionItem value={value} className="bg-card border rounded-2xl shadow-sm overflow-hidden">
      <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-4">
          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", iconColor)}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <span className="font-semibold text-lg text-foreground">{title}</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-6 pb-6 pt-2">
        {children}
      </AccordionContent>
    </AccordionItem>
  );
};
