import { InfoPageLayout, PageHero, SectionFadeIn } from "@/components/InfoPageShared";
import { MapPin, Briefcase, ArrowRight } from "lucide-react";

const jobs = [
  { title: "Frontend-разработчик", dept: "Разработка", location: "Москва / удалённо", type: "Полная занятость" },
  { title: "Product Designer", dept: "Дизайн", location: "Москва", type: "Полная занятость" },
  { title: "Data Analyst", dept: "Аналитика", location: "Удалённо", type: "Полная занятость" },
  { title: "Менеджер по работе с продавцами", dept: "Коммерция", location: "Москва", type: "Полная занятость" },
  { title: "QA-инженер", dept: "Разработка", location: "Удалённо", type: "Полная занятость" },
  { title: "Контент-менеджер", dept: "Маркетинг", location: "Москва / удалённо", type: "Частичная занятость" },
];

const CareersPage = () => (
  <InfoPageLayout>
    <PageHero
      title="Вакансии"
      subtitle="Присоединяйтесь к команде Cheepy и создавайте будущее e-commerce"
      breadcrumb={[{ label: "Главная", to: "/" }, { label: "Вакансии" }]}
    />
    <div className="space-y-4 pb-12">
      {jobs.map((j, i) => (
        <SectionFadeIn key={i}>
          <div className="bg-card rounded-xl border border-border p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-primary transition-all duration-300 cursor-pointer group">
            <div>
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{j.title}</h3>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Briefcase size={14} /> {j.dept}</span>
                <span className="flex items-center gap-1"><MapPin size={14} /> {j.location}</span>
                <span className="px-2 py-0.5 rounded-full bg-secondary text-xs">{j.type}</span>
              </div>
            </div>
            <button className="flex items-center gap-2 text-primary font-medium text-sm hover:opacity-80 transition-opacity group/btn shrink-0">
              Откликнуться <ArrowRight size={14} className="transition-transform group-hover/btn:translate-x-1" />
            </button>
          </div>
        </SectionFadeIn>
      ))}
    </div>
  </InfoPageLayout>
);

export default CareersPage;
