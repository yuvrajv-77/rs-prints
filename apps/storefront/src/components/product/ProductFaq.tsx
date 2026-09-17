import type { ProductFaq as ProductFaqType } from "@/types/product"
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent
} from "@/components/ui/accordion"
import { HelpCircleIcon } from "lucide-react"

interface ProductFaqProps {
  faqs: ProductFaqType[]
  title?: string
}

export default function ProductFaq({ faqs, title = "Frequently Asked Questions" }: ProductFaqProps) {
  if (!faqs || faqs.length === 0) return null

  return (
    <div className="mt-14 space-y-6">
      <div className="flex items-center gap-2.5">
        <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
          <HelpCircleIcon className="size-5" />
        </div>
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Common questions regarding artwork specifications, minimums, and shipping.
          </p>
        </div>
      </div>

      <Accordion>
        {faqs.map((faq, idx) => (
          <AccordionItem key={idx} value={`faq-${idx}`}>
            <AccordionTrigger>
              {faq.q}
            </AccordionTrigger>
            <AccordionContent>
              {faq.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
