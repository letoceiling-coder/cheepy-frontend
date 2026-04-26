import type { FooterSettings, HeaderSettings } from '@/constructor/types';

export const HEADER_DEFAULT_SETTINGS: HeaderSettings = {
  brandText: 'Cheepy',
  searchPlaceholder: 'Искать на Cheepy',
  deliveryCtaText: 'Укажите адрес доставки',
  sellerCtaText: 'Стать продавцом',
  wholesaleText: 'Оптовым покупателям',
  rulesText: 'Правила площадки',
  deliveryText: 'Доставка',
  supportText: 'Поддержка',
  showTopBar: true,
  showMainNav: true,
  showSocialLinks: true,
  showFavorites: true,
  showCart: true,
  showAccount: true,
  topLinks: [],
  mainNavLinks: [
    { id: 'main-men', label: 'Мужское', url: '/category/muzhskoe', enabled: true, target: '_self' },
    { id: 'main-women', label: 'Женское', url: '/category/zhenskoe', enabled: true, target: '_self' },
    { id: 'main-shoes', label: 'Обувь и одежда', url: '/category/odezhda', enabled: true, target: '_self' },
    { id: 'main-favorites', label: 'Избранное', url: '/favorites', enabled: true, target: '_self' },
    { id: 'main-delivery', label: 'Доставка', url: '/delivery', enabled: true, target: '_self' },
    { id: 'main-rules', label: 'Правила площадки', url: '/rules', enabled: true, target: '_self' },
    { id: 'main-support', label: 'Поддержка', url: '/faq', enabled: true, target: '_self' },
  ],
  socialLinks: [
    { id: 'social-youtube', network: 'youtube', label: 'YouTube', url: '#', enabled: true },
    { id: 'social-vk', network: 'vk', label: 'VK', url: '#', enabled: true },
    { id: 'social-ok', network: 'ok', label: 'OK', url: '#', enabled: true },
    { id: 'social-telegram', network: 'telegram', label: 'TG', url: '#', enabled: true },
  ],
};

export const FOOTER_DEFAULT_SETTINGS: FooterSettings = {
  brandText: 'Cheepy',
  description: 'Маркетплейс модной одежды и аксессуаров',
  copyrightText: '© 2025 Cheepy. Все права защищены.',
  showContacts: true,
  showBottomLegal: true,
  contacts: {
    city: 'Москва, Россия',
    phone: '8 (800) 123-45-67',
    email: 'info@cheepy.ru',
  },
  columns: [
    {
      id: 'footer-col-customers',
      title: 'Покупателям',
      enabled: true,
      links: [
        { id: 'customers-order', label: 'Как сделать заказ', url: '/how-to-order', enabled: true, target: '_self' },
        { id: 'customers-payment', label: 'Способы оплаты', url: '/payment', enabled: true, target: '_self' },
        { id: 'customers-delivery', label: 'Доставка', url: '/delivery', enabled: true, target: '_self' },
        { id: 'customers-returns', label: 'Возврат товара', url: '/returns', enabled: true, target: '_self' },
        { id: 'customers-faq', label: 'Вопросы и ответы', url: '/faq', enabled: true, target: '_self' },
      ],
    },
    {
      id: 'footer-col-sellers',
      title: 'Продавцам',
      enabled: true,
      links: [
        { id: 'sellers-start', label: 'Как начать продавать', url: '/sell', enabled: true, target: '_self' },
        { id: 'sellers-rules', label: 'Правила площадки', url: '/rules', enabled: true, target: '_self' },
        { id: 'sellers-fee', label: 'Комиссия', url: '/commission', enabled: true, target: '_self' },
        { id: 'sellers-help', label: 'Помощь продавцам', url: '/seller-help', enabled: true, target: '_self' },
      ],
    },
    {
      id: 'footer-col-company',
      title: 'Компания',
      enabled: true,
      links: [
        { id: 'company-about', label: 'О нас', url: '/about', enabled: true, target: '_self' },
        { id: 'company-contacts', label: 'Контакты', url: '/contacts', enabled: true, target: '_self' },
        { id: 'company-careers', label: 'Вакансии', url: '/careers', enabled: true, target: '_self' },
        { id: 'company-blog', label: 'Блог', url: '/blog', enabled: true, target: '_self' },
      ],
    },
  ],
  legalLinks: [
    { id: 'legal-privacy', label: 'Политика конфиденциальности', url: '/privacy', enabled: true, target: '_self' },
    { id: 'legal-terms', label: 'Пользовательское соглашение', url: '/terms', enabled: true, target: '_self' },
  ],
};

