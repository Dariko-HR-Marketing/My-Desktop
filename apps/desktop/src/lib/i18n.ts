// Uzbek (Latin) dictionary. Other languages (Cyrillic, Russian, English) are added later as sibling dictionaries.
const uz = {
  'app.name': 'Ish maydoni',
  'app.org': 'Tashkilot',

  'nav.main': 'Asosiy',
  'nav.modules': 'Modullar',
  'nav.networks': 'Tarmoqlar',
  'nav.home': 'Bosh sahifa',
  'nav.tasks': 'Vazifalarim',
  'nav.browser': 'Brauzer',
  'nav.settings': 'Sozlamalar',
  'nav.profile': 'Profil',
  'nav.collapse': 'Menyuni yigʻish',
  'nav.expand': 'Menyuni yoyish',
  'nav.primary': 'Asosiy menyu',
  'nav.mobile': 'Pastki menyu',
  'nav.modulesShort': 'Modullar',
  'nav.homeShort': 'Bosh',
  'nav.tasksShort': 'Vazifalar',

  'module.edo': 'Hujjat aylanishi',
  'module.edo.sub': 'Hujjatlar · Ijro · Topshiriqlar',

  'app.telegram': 'Telegram',
  'app.whatsapp': 'WhatsApp',
  'app.instagram': 'Instagram',
  'app.facebook': 'Facebook',
  'app.youtube': 'YouTube',
  'app.linkedin': 'LinkedIn',

  'top.search': 'Qidirish',
  'top.searchPlaceholder': 'Vazifa, hujjat yoki saytni qidiring',
  'top.ai': 'AI',
  'top.soon': 'Tez orada',
  'top.notifications': 'Bildirishnomalar',
  'top.profile': 'Profil va sozlamalar',

  'common.retry': 'Qayta urinish',
  'common.close': 'Yopish',
  'common.more': 'Hammasi',
  'common.loading': 'Yuklanmoqda',

  'page.home.title': 'Bosh sahifa',
  'page.home.lead': 'Kun xulosasi 4-bosqichda qoʻshiladi.',
  'page.tasks.title': 'Vazifalarim',
  'page.tasks.lead': 'Vazifalar roʻyxati 5-bosqichda qoʻshiladi.',
  'page.browser.title': 'Brauzer',
  'page.browser.lead': 'Ichki brauzer 6-bosqichda qoʻshiladi.',
  'page.module.lead': 'Modul ekranlari 8-bosqichda qoʻshiladi.',
  'page.module.unknown': 'Modul topilmadi',
  'page.module.unknownLead': 'Bunday modul mavjud emas yoki sizga yoqilmagan.',
  'page.login.title': 'Kirish',
  'page.login.lead': 'Kirish sahifasi 4-bosqichda qoʻshiladi.',
  'page.notFound.title': 'Sahifa topilmadi',
  'page.notFound.lead': 'Manzil notoʻgʻri yoki sahifa koʻchirilgan.',
  'page.notFound.home': 'Bosh sahifaga qaytish',

  'settings.title': 'Sozlamalar',
  'settings.appearance': 'Koʻrinish',
  'settings.theme': 'Tema',
  'settings.theme.light': 'Yorugʻ',
  'settings.theme.dark': 'Tungi',
  'settings.theme.system': 'Tizim',
  'settings.density': 'Zichlik',
  'settings.density.comfortable': 'Qulay',
  'settings.density.compact': 'Ixcham',
  'settings.densityNote':
    'Ixcham rejim faqat sichqoncha bilan ishlaydigan keng oynalarda (≥ 1024 px) qoʻllanadi.',

  'a11y.skip': 'Asosiy mazmunga oʻtish',
} as const;

export type MessageKey = keyof typeof uz;

export function t(key: MessageKey): string {
  return uz[key];
}
