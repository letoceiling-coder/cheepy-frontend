import { MapPin, Phone, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import type { FooterSettings, NavLinkItem } from "@/constructor/types";
import { FOOTER_DEFAULT_SETTINGS } from "@/shared/layoutDefaults";

interface FooterProps {
  settings?: Partial<FooterSettings>;
}

function renderLink(link: NavLinkItem, className: string) {
  const isExternal = /^https?:\/\//i.test(link.url);
  const target = link.target ?? "_self";
  if (isExternal) {
    return (
      <a href={link.url} target={target} rel={target === "_blank" ? "noopener noreferrer" : undefined} className={className}>
        {link.label}
      </a>
    );
  }
  return (
    <Link to={link.url || "/"} target={target} className={className}>
      {link.label}
    </Link>
  );
}

const Footer = ({ settings }: FooterProps) => {
  const merged: FooterSettings = {
    ...FOOTER_DEFAULT_SETTINGS,
    ...settings,
    contacts: { ...FOOTER_DEFAULT_SETTINGS.contacts, ...(settings?.contacts ?? {}) },
    columns: settings?.columns ?? FOOTER_DEFAULT_SETTINGS.columns,
    legalLinks: settings?.legalLinks ?? FOOTER_DEFAULT_SETTINGS.legalLinks,
  };

  const columns = (merged.columns ?? []).filter((c) => c.enabled);
  const legalLinks = (merged.legalLinks ?? []).filter((l) => l.enabled);

  return (
    <footer className="bg-secondary border-t border-border">
      <div className="max-w-[1400px] mx-auto px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <h3 className="text-2xl font-extrabold text-foreground mb-3">{merged.brandText}</h3>
            <p className="text-sm text-muted-foreground mb-4">{merged.description}</p>
            {merged.showContacts ? (
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span>{merged.contacts.city}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 shrink-0" />
                  <span>{merged.contacts.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 shrink-0" />
                  <span>{merged.contacts.email}</span>
                </div>
              </div>
            ) : null}
          </div>

          {columns.map(col => (
            <div key={col.id}>
              <h4 className="font-semibold text-foreground mb-3">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.filter((x) => x.enabled).map(link => (
                  <li key={link.id}>
                    {renderLink(link, "text-sm text-muted-foreground hover:text-primary transition-colors")}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-border pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">{merged.copyrightText}</p>
          {merged.showBottomLegal ? (
            <div className="flex gap-4 text-xs text-muted-foreground">
              {legalLinks.map((link) => (
                <span key={link.id}>{renderLink(link, "hover:text-primary transition-colors")}</span>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
