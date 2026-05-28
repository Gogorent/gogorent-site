const header = document.querySelector("[data-header]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const nav = document.querySelector("[data-nav]");
const bookingForm = document.querySelector("[data-booking-form]");
const dateInputs = document.querySelectorAll("[data-date-input]");
const galleryButtons = document.querySelectorAll("[data-gallery]");
const lightbox = document.querySelector("[data-lightbox]");
const lightboxImage = document.querySelector("[data-lightbox-image]");
const lightboxTitle = document.querySelector("[data-lightbox-title]");
const lightboxCount = document.querySelector("[data-lightbox-count]");
const lightboxClose = document.querySelector("[data-lightbox-close]");
const lightboxPrev = document.querySelector("[data-lightbox-prev]");
const lightboxNext = document.querySelector("[data-lightbox-next]");
const languageButtons = document.querySelectorAll("[data-lang-button]");
const aiChat = document.querySelector("[data-ai-chat]");
const aiChatToggle = document.querySelector("[data-ai-chat-toggle]");
const aiChatClose = document.querySelector("[data-ai-chat-close]");
const aiChatPanel = document.querySelector("[data-ai-chat] .ai-chat-panel");
const aiChatMessages = document.querySelector("[data-ai-chat-messages]");
const aiChatForm = document.querySelector("[data-ai-chat-form]");
const aiChatInput = document.querySelector("[data-ai-chat-input]");
const aiPromptButtons = document.querySelectorAll("[data-ai-prompt]");
const aiWhatsAppButton = document.querySelector("[data-ai-whatsapp]");
const textNodeKeys = new WeakMap();
const preloadedImages = new Map();
let activeGallery = [];
let activeGalleryTitle = "";
let activeGalleryIndex = 0;
let aiMessages = [];
let aiBusy = false;

const pageMeta = {
  en: {
    title: "Car Rental in Tbilisi With No Deposit | GoGoRent Georgia",
    description: "Rent a car in Tbilisi with no deposit, full insurance included, airport delivery, SUVs for Georgia trips, and fast booking by WhatsApp.",
    genericMessage: "Hi GoGoRent, I want to rent a car in Georgia.",
    formIntro: "Hi GoGoRent, I want to rent a car in Tbilisi.",
    notSelected: "not selected",
    sendAvailability: "Please send availability and price."
  },
  ru: {
    title: "Аренда авто в Тбилиси без депозита | GoGoRent Georgia",
    description: "Аренда авто в Тбилиси и по Грузии без депозита, с полной страховкой, доставкой в аэропорт и быстрым бронированием через WhatsApp.",
    genericMessage: "Здравствуйте, GoGoRent. Хочу арендовать авто в Грузии.",
    formIntro: "Здравствуйте, GoGoRent. Хочу арендовать авто в Тбилиси.",
    notSelected: "не выбрано",
    sendAvailability: "Пожалуйста, отправьте наличие и цену."
  }
};

const aiChatText = {
  en: {
    kicker: "AI consultant",
    title: "GoGoRent assistant",
    toggle: "Ask GoGoRent",
    close: "Close assistant",
    placeholder: "Ask about cars, insurance, delivery, or dates",
    send: "Send",
    whatsapp: "Send chat to WhatsApp",
    greeting: "Hi. I can help with GoGoRent cars, prices, insurance, delivery, routes, and rental conditions. What dates or route are you planning?",
    loading: "Checking...",
    error: "I cannot answer right now. Please message us on WhatsApp and we will help quickly.",
    transcriptIntro: "Hi GoGoRent, I talked with the AI assistant and want to continue booking.",
    userLabel: "Client",
    assistantLabel: "AI",
    prompts: ["Cars", "Conditions", "Mountain trip"]
  },
  ru: {
    kicker: "AI консультант",
    title: "Помощник GoGoRent",
    toggle: "Спросить GoGoRent",
    close: "Закрыть помощника",
    placeholder: "Спросите про авто, страховку, доставку или даты",
    send: "Отправить",
    whatsapp: "Отправить чат в WhatsApp",
    greeting: "Здравствуйте. Я помогу с авто GoGoRent, ценами, страховкой, доставкой, маршрутами и условиями аренды. На какие даты или маршрут планируете машину?",
    loading: "Проверяю...",
    error: "Сейчас не могу ответить. Напишите нам в WhatsApp, и мы быстро поможем.",
    transcriptIntro: "Здравствуйте, GoGoRent. Я пообщался с AI-помощником и хочу продолжить бронирование.",
    userLabel: "Клиент",
    assistantLabel: "AI",
    prompts: ["Авто", "Условия", "Горы"]
  }
};

const ruText = {
  "Cars": "Авто",
  "Reviews": "Отзывы",
  "Routes": "Маршруты",
  "How it works": "Как это работает",
  "FAQ": "FAQ",
  "Tbilisi car rental for Georgia trips": "Аренда авто в Тбилиси для поездок по Грузии",
  "Car rental in Tbilisi": "Аренда авто в Тбилиси",
  "with no deposit": "без депозита",
  "Fully insured SUVs and sedans, airport delivery, WhatsApp booking, and cars ready for city roads, Kazbegi, Gudauri, Kakheti, and long trips across Georgia.": "Автомобили с полной страховкой, подача в аэропорт, быстрое бронирование в WhatsApp и машины для города, Казбеги, Гудаури, Кахетии и дальних маршрутов по Грузии.",
  "Book on WhatsApp": "Забронировать в WhatsApp",
  "Book": "Забронировать",
  "View photos": "Фото",
  "Close": "Закрыть",
  "Previous": "Назад",
  "Next": "Вперёд",
  "Call now": "Позвонить",
  "No deposit": "Без депозита",
  "Full insurance": "Полная страховка",
  "Automatic cars": "Автомат",
  "Airport delivery": "Доставка в аэропорт",
  "Fast request": "Быстрая заявка",
  "Get availability in WhatsApp": "Узнать наличие в WhatsApp",
  "Pickup date": "Получение",
  "Return date": "Возврат",
  "DD.MM.YYYY": "ДД.ММ.ГГГГ",
  "SUV for mountains": "Кроссовер для гор",
  "7-seat SUV": "7-местный кроссовер",
  "Economy sedan": "Седан эконом",
  "Any available car": "Любая доступная машина",
  "Check cars": "Проверить авто",
  "No deposit rental": "Аренда без депозита",
  "Clear terms before pickup.": "Все условия согласуем заранее.",
  "Insurance included": "Страховка включена",
  "Daily price already includes insurance.": "Страховка уже входит в цену дня.",
  "Tbilisi delivery": "Доставка по Тбилиси",
  "Airport, hotel, or agreed pickup point.": "Аэропорт, отель или удобная локация.",
  "Road-trip ready": "Готово к поездкам",
  "SUVs for mountain and regional routes.": "Кроссоверы для гор и поездок по регионам.",
  "Why travellers trust us": "Почему нам доверяют",
  "Local car rental with clear terms": "Локальная аренда авто с понятными условиями",
  "We confirm the car, daily price, insurance, delivery point, and extras before pickup. The goal is simple: no surprises when you land in Tbilisi.": "Мы заранее подтверждаем авто, цену за сутки, страховку, точку подачи и дополнительные услуги. Цель простая: без сюрпризов после прилета в Тбилиси.",
  "Clear before pickup": "Все ясно до подачи",
  "Price, insurance, delivery, and extras confirmed in chat.": "Цену, страховку, доставку и допы подтверждаем в переписке.",
  "Fast support": "Быстрая связь",
  "WhatsApp, Telegram, or phone when plans change.": "WhatsApp, Telegram или телефон, если планы меняются.",
  "Route-aware cars": "Авто под маршрут",
  "SUVs and sedans matched to city, airport, mountain, and wine-region trips.": "SUV и седаны под город, аэропорт, горы и винные маршруты.",
  "Fleet and prices": "Автопарк и цены",
  "Choose a car for Georgia": "Выберите авто для Грузии",
  "Prices are per day. Long-term rental prices are confirmed individually.": "Цены указаны за сутки. Для долгой аренды подберем отдельное предложение.",
  "7-seat AWD family SUV. Best for families, luggage, Kazbegi, Gudauri, and comfortable long trips.": "7-местный полноприводный кроссовер для семьи, багажа, Казбеги, Гудаури и дальних поездок.",
  "7 seats": "7 мест",
  "Apple CarPlay": "Apple CarPlay",
  "Book Mazda CX-9": "Забронировать Mazda CX-9",
  "Compact 4x4 SUV for Tbilisi streets, mountain roads, and travelers who want easy parking.": "Компактный 4x4 для Тбилиси, горных дорог и удобной парковки.",
  "4x4 drive": "Привод 4x4",
  "Automatic": "Автомат",
  "Heated seats": "Подогрев сидений",
  "Book Jeep Renegade": "Забронировать Jeep Renegade",
  "7-seat AWD SUV with extra room for luggage, family travel, and longer routes across Georgia.": "7-местный полноприводный кроссовер с запасом места для багажа и семейных поездок.",
  "Fully insured": "Полная страховка",
  "Quiet hybrid sedan for Tbilisi, airport transfers, business trips, and lower fuel cost.": "Тихий гибридный седан для Тбилиси, аэропорта, деловых поездок и экономии на топливе.",
  "Hybrid": "Гибрид",
  "Comfort sedan": "Комфортный седан",
  "Book Ford Fusion": "Забронировать Ford Fusion",
  "Comfortable family SUV for city, highway, wine region trips, and mixed road conditions.": "Комфортный семейный кроссовер для города, трассы, винных маршрутов и смешанных дорог.",
  "SUV": "Кроссовер",
  "Book Mazda CX-5": "Забронировать Mazda CX-5",
  "Local rental service": "Локальная аренда авто",
  "Rent a car in Tbilisi without stress": "Возьмите авто в Тбилиси без лишней бюрократии",
  "GoGoRent is built for travelers who need a simple car rental process in Georgia: no deposit on selected cars, insurance included, automatic vehicles, clear daily prices, and quick support in WhatsApp.": "GoGoRent подходит тем, кто хочет быстро получить понятную машину в Грузии: без депозита на выбранных авто, со страховкой, автоматической коробкой, прозрачной ценой за сутки и поддержкой в WhatsApp.",
  "We help with Tbilisi airport pickup, hotel delivery, city rental, long-term rental, and route advice for popular trips across Georgia.": "Поможем с подачей в аэропорт Тбилиси, доставкой к отелю, арендой по городу, долгосрочной арендой и выбором машины под ваш маршрут.",
  "Car rental Tbilisi no deposit": "Аренда авто Тбилиси без депозита",
  "SUV rental Tbilisi": "Аренда кроссовера в Тбилиси",
  "Car for Kazbegi and Gudauri": "Авто для Казбеги и Гудаури",
  "Tbilisi airport car delivery": "Доставка авто в аэропорт Тбилиси",
  "Rent a car in Georgia FAQ": "FAQ по аренде авто в Грузии",
  "Trip planning": "Планирование поездки",
  "Cars matched to real Georgia routes": "Авто под реальные маршруты по Грузии",
  "Tell us your route and luggage count. We will suggest the practical car, not just the most expensive one.": "Скажите маршрут, даты и сколько будет багажа. Мы предложим машину, которая действительно подходит под поездку.",
  "Tbilisi city and airport": "Тбилиси и аэропорт",
  "Ford Fusion Hybrid or Jeep Renegade for easy city driving, airport pickup, and daily errands.": "Ford Fusion Hybrid или Jeep Renegade для города, аэропорта и ежедневных поездок.",
  "Kazbegi and Gudauri": "Казбеги и Гудаури",
  "Choose AWD or 4x4 SUVs for mountain weather, luggage, and confident road handling.": "Для горной погоды, багажа и уверенного движения лучше брать AWD или 4x4.",
  "Kakheti wine route": "Винный маршрут Кахетии",
  "Comfortable SUVs and sedans for Sighnaghi, Telavi, Lopota, and winery trips.": "Комфортные SUV и седаны для Сигнахи, Телави, Лопоты и поездок по винодельням.",
  "Family travel": "Семейные поездки",
  "7-seat Mazda CX-9, baby seat, roof box, Wi-Fi, and private driver options when needed.": "7-местная Mazda CX-9, детское кресло, бокс на крышу, Wi-Fi и водитель при необходимости.",
  "Simple process": "Простой процесс",
  "How booking works": "Как проходит бронирование",
  "Send your dates": "Отправьте даты",
  "Message us on WhatsApp with pickup date, return date, route, and preferred car if you have one.": "Напишите даты, маршрут и желаемую машину, если уже выбрали.",
  "Confirm the car": "Подтвердите авто",
  "We send availability, daily price, insurance details, and delivery options.": "Мы отправим доступные машины, цену за сутки, условия страховки и варианты подачи.",
  "Pick up and drive": "Получите и поезжайте",
  "Get the car at the airport, hotel, or agreed location in Tbilisi and start your trip.": "Получите авто в аэропорту, у отеля или в согласованной точке Тбилиси и начинайте поездку.",
  "Extras": "Дополнительно",
  "Add what your trip needs": "Добавьте то, что нужно в поездке",
  "Private driver:": "Водитель:",
  "from $80/day for comfortable travel with a local driver.": "от $80/день для комфортной поездки с местным водителем.",
  "Unlimited Wi-Fi:": "Безлимитный Wi-Fi:",
  "from $5/day for navigation and calls across Georgia.": "от $5/день для навигации и связи по Грузии.",
  "Baby seat:": "Детское кресло:",
  "from $5/day for family trips.": "от $5/день для семейных поездок.",
  "Roof box or ski rack:": "Roof box или крепление для лыж:",
  "extra space for luggage, skis, and snowboards.": "дополнительное место для багажа, лыж и сноубордов.",
  "Traveller feedback": "Отзывы путешественников",
  "What customers usually mention": "Что чаще всего отмечают клиенты",
  "Quick replies, clear prices, and cars that fit real Georgia routes.": "Быстрые ответы, понятные цены и машины, которые подходят для реальных маршрутов по Грузии.",
  "“Picked up the car at Tbilisi Airport, insurance was explained clearly, and the trip to Kazbegi felt easy.”": "«Получили машину в аэропорту Тбилиси, страховку объяснили понятно, и поездка в Казбеги прошла спокойно.»",
  "United Kingdom": "Великобритания",
  "“No deposit made the booking simple. We confirmed everything in WhatsApp and got the car the same day.”": "«Без депозита бронирование стало проще. Все подтвердили в WhatsApp и получили машину в тот же день.»",
  "Germany": "Германия",
  "“The team suggested the right car for Gudauri. The road was snowy, but the Jeep handled it well.”": "«Команда подсказала подходящее авто для Гудаури. На дороге был снег, но Jeep справился уверенно.»",
  "Poland": "Польша",
  "Questions": "Вопросы",
  "Car rental FAQ": "Вопросы по аренде",
  "These are the questions travelers usually ask before renting a car in Tbilisi.": "Короткие ответы на вопросы, которые чаще всего задают перед арендой авто в Тбилиси.",
  "Can I rent a car without a deposit?": "Можно арендовать авто без депозита?",
  "Yes. GoGoRent offers no deposit car rental on selected vehicles. The exact terms are confirmed before booking.": "Да. На выбранные машины доступна аренда без депозита. Все условия подтверждаем до бронирования.",
  "Is full insurance included?": "Полная страховка включена?",
  "Yes. Insurance is included in the daily price. We explain the exact coverage for your selected car before pickup.": "Да. Страховка включена в стоимость суток. Перед подачей объясняем условия по выбранному авто.",
  "Can I get the car at Tbilisi Airport?": "Можно получить авто в аэропорту Тбилиси?",
  "Yes. Airport delivery and pickup in Tbilisi can be arranged through WhatsApp.": "Да. Подачу и возврат в аэропорту Тбилиси можно согласовать заранее.",
  "Which car should I choose for mountain roads?": "Какую машину выбрать для горных дорог?",
  "For Kazbegi, Gudauri, and winter travel, choose an AWD or 4x4 SUV such as Mazda CX-9, Mazda CX-5, or Jeep Renegade 4x4.": "Для Казбеги, Гудаури и зимних поездок лучше выбирать AWD или 4x4: Mazda CX-9, Mazda CX-5 или Jeep Renegade 4x4.",
  "Do you offer long-term rental?": "Есть долгосрочная аренда?",
  "Yes. Long-term rental prices are available on request and depend on the car, season, and rental period.": "Да. Цена долгосрочной аренды рассчитывается по запросу и зависит от машины, сезона и срока.",
  "Contact": "Контакты",
  "Message GoGoRent now": "Напишите GoGoRent сейчас",
  "Send your dates and route. We will answer with available cars, price, delivery options, and insurance details.": "Отправьте даты и маршрут. Мы быстро ответим, какие машины доступны, сколько стоит аренда и где удобнее подать авто.",
  "Fast booking chat": "Самый быстрый ответ",
  "Message us directly": "Удобно для переписки",
  "Cars, updates, stories": "Фото авто и обновления",
  "Car rental in Tbilisi and across Georgia. No deposit, full insurance, WhatsApp booking.": "Аренда авто в Тбилиси и по Грузии. Без депозита, со страховкой и быстрым бронированием.",
  "Call": "Позвонить"
};

const attributeText = {
  "Open menu": "Открыть меню",
  "Primary navigation": "Основная навигация",
  "GoGoRent home": "Главная GoGoRent",
  "GoGoRent SUV available for rent in Tbilisi": "SUV GoGoRent для аренды в Тбилиси",
  "Choose contact channel": "Выберите канал связи",
  "Rental benefits": "Преимущества аренды",
  "Why travelers choose GoGoRent": "Почему путешественники выбирают GoGoRent",
  "5 out of 5": "5 из 5",
  "Popular rental needs": "Популярные запросы по аренде",
  "Contact channels": "Каналы связи",
  "Footer navigation": "Навигация в подвале",
  "Quick contact": "Быстрая связь",
  "Car photo gallery": "Галерея автомобиля",
  "Close": "Закрыть",
  "Previous photo": "Предыдущее фото",
  "Next photo": "Следующее фото",
  "Pickup date": "Дата получения",
  "Return date": "Дата возврата",
  "DD.MM.YYYY": "ДД.ММ.ГГГГ",
  "Use DD.MM.YYYY format": "Используйте формат ДД.ММ.ГГГГ",
  "Black Mazda CX-9 rental car in Tbilisi": "Черная Mazda CX-9 для аренды в Тбилиси",
  "Jeep Renegade 4x4 rental car in Georgia": "Jeep Renegade 4x4 для аренды в Грузии",
  "White Mazda CX-9 7-seat rental SUV in Georgia": "Белая Mazda CX-9, 7-местный SUV для аренды в Грузии",
  "Ford Fusion Hybrid rental car in Tbilisi": "Ford Fusion Hybrid для аренды в Тбилиси",
  "Mazda CX-5 rental SUV in Georgia": "Mazda CX-5 SUV для аренды в Грузии",
  "Private driver service in Georgia": "Услуга личного водителя в Грузии"
};

function updateHeader() {
  if (!header) return;
  header.classList.toggle("is-scrolled", window.scrollY > 24);
}

function normalizeText(value) {
  return value.replace(/\s+/g, " ").trim();
}

function translateTextNodes(lang) {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || ["SCRIPT", "STYLE", "NOSCRIPT"].includes(parent.tagName)) {
        return NodeFilter.FILTER_REJECT;
      }
      return normalizeText(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }
  });

  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);

  nodes.forEach((node) => {
    const existingKey = textNodeKeys.get(node);
    const candidateKey = normalizeText(node.nodeValue);
    const key = existingKey || (ruText[candidateKey] ? candidateKey : null);
    if (!key) return;
    textNodeKeys.set(node, key);
    const nextValue = lang === "ru" ? ruText[key] : key;
    if (!nextValue) return;
    const leading = node.nodeValue.match(/^\s*/)[0];
    const trailing = node.nodeValue.match(/\s*$/)[0];
    node.nodeValue = `${leading}${nextValue}${trailing}`;
  });
}

function translateAttributes(lang) {
  document.querySelectorAll("[aria-label], [alt], [placeholder], [title]").forEach((element) => {
    ["aria-label", "alt", "placeholder", "title"].forEach((attribute) => {
      if (!element.hasAttribute(attribute)) return;
      const storageName = `data-original-${attribute}`;
      const original = element.getAttribute(storageName) || element.getAttribute(attribute);
      if (!attributeText[original]) return;
      element.setAttribute(storageName, original);
      element.setAttribute(attribute, lang === "ru" ? attributeText[original] : original);
    });
  });
}

function formatDateInput(value) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4, 8);
  return [day, month, year].filter(Boolean).join(".");
}

function activeLang() {
  return document.body.dataset.lang === "ru" ? "ru" : "en";
}

function parseDateValue(value) {
  const match = value.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
}

function validateDateInput(input) {
  if (!input.value) {
    input.setCustomValidity("");
    return true;
  }
  const date = parseDateValue(input.value);
  const lang = activeLang();
  if (!date) {
    input.setCustomValidity(lang === "ru" ? "Введите дату в формате ДД.ММ.ГГГГ" : "Use DD.MM.YYYY format");
    return false;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date < today) {
    input.setCustomValidity(lang === "ru" ? "Дата не должна быть в прошлом" : "Date cannot be in the past");
    return false;
  }
  input.setCustomValidity("");
  return true;
}

function gallerySources(button) {
  return (button.dataset.gallery || "").split("|").filter(Boolean);
}

function preloadGalleryImage(src) {
  if (!src) return null;
  if (preloadedImages.has(src)) return preloadedImages.get(src);

  const image = new Image();
  image.decoding = "async";
  image.src = src;

  const ready = image.decode
    ? image.decode().catch(() => {})
    : new Promise((resolve) => {
      image.onload = resolve;
      image.onerror = resolve;
    });

  const entry = { image, ready };
  preloadedImages.set(src, entry);
  return entry;
}

function preloadGallerySet(sources) {
  sources.forEach(preloadGalleryImage);
}

function preloadActiveNeighbors() {
  if (!activeGallery.length) return;
  preloadGalleryImage(activeGallery[activeGalleryIndex]);
  preloadGalleryImage(activeGallery[(activeGalleryIndex + 1) % activeGallery.length]);
  preloadGalleryImage(activeGallery[(activeGalleryIndex - 1 + activeGallery.length) % activeGallery.length]);
}

function preloadAllGalleryImages() {
  galleryButtons.forEach((button) => preloadGallerySet(gallerySources(button)));
}

function scheduleGalleryPreload() {
  const run = () => preloadAllGalleryImages();
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(run, { timeout: 2200 });
  } else {
    window.setTimeout(run, 1200);
  }
}

function updateLightbox() {
  if (!lightbox || !lightboxImage || !activeGallery.length) return;
  const src = activeGallery[activeGalleryIndex];
  lightboxImage.src = src;
  lightboxImage.alt = `${activeGalleryTitle} photo ${activeGalleryIndex + 1}`;
  if (lightboxTitle) lightboxTitle.textContent = activeGalleryTitle;
  if (lightboxCount) lightboxCount.textContent = `${activeGalleryIndex + 1} / ${activeGallery.length}`;
  preloadActiveNeighbors();
}

function openLightbox(button) {
  activeGallery = gallerySources(button);
  activeGalleryTitle = button.dataset.galleryTitle || "";
  activeGalleryIndex = 0;
  if (!activeGallery.length || !lightbox) return;
  preloadGallerySet(activeGallery);
  updateLightbox();
  lightbox.hidden = false;
  document.body.classList.add("lightbox-open");
  lightboxClose?.focus();
}

function closeLightbox() {
  if (!lightbox) return;
  lightbox.hidden = true;
  document.body.classList.remove("lightbox-open");
  if (lightboxImage) lightboxImage.src = "";
}

function moveGallery(step) {
  if (!activeGallery.length) return;
  activeGalleryIndex = (activeGalleryIndex + step + activeGallery.length) % activeGallery.length;
  updateLightbox();
}

function whatsappUrl(message) {
  return `https://wa.me/995500054521?text=${encodeURIComponent(message)}`;
}

function updateWhatsAppLinks(lang) {
  const message = pageMeta[lang].genericMessage;
  document
    .querySelectorAll(".hero-actions .btn-primary, .contact-actions .btn-primary, .channel-card[href*='wa.me'], .mobile-cta a[href*='wa.me']")
    .forEach((link) => {
      link.href = whatsappUrl(message);
    });
}

function setChatOpen(open) {
  if (!aiChat || !aiChatPanel || !aiChatToggle) return;
  aiChat.classList.toggle("is-open", open);
  document.body.classList.toggle("ai-chat-open", open);
  aiChatPanel.hidden = !open;
  aiChatToggle.setAttribute("aria-expanded", String(open));
  if (open) {
    window.setTimeout(() => aiChatInput?.focus(), 60);
  }
}

function chatLabels() {
  return aiChatText[activeLang()];
}

function messageHasAny(text, words) {
  return words.some((word) => text.includes(word));
}

function localAssistantReply(content) {
  const text = content.toLowerCase();
  const ru = activeLang() === "ru" || /[а-яё]/i.test(content);
  const contact = ru
    ? "Напишите нам в WhatsApp, Telegram или Instagram, и мы быстро подтвердим наличие."
    : "Message us on WhatsApp, Telegram, or Instagram and we will confirm availability quickly.";

  if (messageHasAny(text, ["jeep", "renegade", "джип", "ренег"])) {
    return ru
      ? "Jeep Renegade сейчас, к сожалению, занят на долгий срок. Ближайшая альтернатива - Mazda CX-5 за $60/день: удобный SUV для города, трассы и поездок по Грузии. На какие даты нужна машина?"
      : "Jeep Renegade is currently occupied for a long-term rental. The closest alternative is Mazda CX-5 for $60/day: a comfortable SUV for city, highway, and Georgia trips. What dates do you need?";
  }

  if (messageHasAny(text, ["condition", "conditions", "terms", "deposit", "insurance", "услов", "депозит", "страхов"])) {
    return ru
      ? "Основные условия: без депозита, страховка включена, безлимитный пробег по Грузии, выезд за границу нельзя. Водитель от 21 года и стаж больше 1 года. Нужны водительские права; международные права не обязательны, если в правах есть имя/фамилия латиницей. Шины, штрафы и off-road ДТП не входят в страховку."
      : "Main conditions: no deposit, insurance included, unlimited mileage inside Georgia, no border crossing. Driver must be 21+ with more than 1 year of experience. A valid driving license is required; international permit is not required if the license has name/surname in Latin letters. Tires, fines, and off-road accidents are not covered.";
  }

  if (messageHasAny(text, ["car", "cars", "fleet", "price", "available", "авто", "машин", "цена", "стоит", "налич"])) {
    return ru
      ? `У нас есть Mazda CX-5 - $60/день, Mazda CX-9 - $70/день, Mazda CX-9 NEW 2021 max комплектация с captain chairs - $75/день, Ford Fusion Hybrid - $45/день. Jeep Renegade сейчас занят на долгий срок. Для проверки наличия пришлите даты, время, машину, точку доставки и имя. ${contact}`
      : `We have Mazda CX-5 - $60/day, Mazda CX-9 - $70/day, Mazda CX-9 NEW 2021 max trim with captain chairs - $75/day, and Ford Fusion Hybrid - $45/day. Jeep Renegade is occupied long-term. To check availability, send dates, time, preferred car, delivery point, and name. ${contact}`;
  }

  if (messageHasAny(text, ["delivery", "airport", "pickup", "drop", "достав", "аэропорт", "забрать", "возврат"])) {
    return ru
      ? "Доставка по Тбилиси бесплатная при аренде от 2 дней. При аренде на 1 день машину нужно забрать около метро Ахметели Театр, Глдани, либо доставка стоит $20. Доставка или возврат с 23:00 до 09:00 стоит $20."
      : "Tbilisi delivery is free for rentals from 2 days. For a 1-day rental, pickup is near Akhmeteli Theatre metro in Gldani, or delivery costs $20. Delivery or drop-off from 23:00 to 09:00 costs $20.";
  }

  if (messageHasAny(text, ["payment", "pay", "card", "cash", "оплат", "карта", "налич"])) {
    return ru
      ? "Оплата возможна грузинским банковским переводом, Visa, наличными в EUR, USD или GEL."
      : "Payment is possible by Georgian bank transfer, Visa, or cash in EUR, USD, or GEL.";
  }

  if (messageHasAny(text, ["accident", "police", "дтп", "авар", "поли"])) {
    return ru
      ? "При ДТП остановите машину и не двигайте ее больше чем на 4 метра. Сначала позвоните GoGoRent, потом в полицию, если мы скажем. Мы дадим точные инструкции."
      : "In case of accident, stop the car and do not move it more than 4 meters. Call GoGoRent first, then the police if we instruct you. We will guide you step by step.";
  }

  if (messageHasAny(text, ["smoking", "smoke", "pet", "dog", "cat", "wash", "clean", "кур", "живот", "собак", "кот", "мой", "гряз", "чист"])) {
    return ru
      ? "Машину мыть перед возвратом не нужно. Если она очень грязная и нужна химчистка, доплата согласуется отдельно. Курение и животные - на ваш риск: если останется запах, шерсть или повреждения, клиент оплачивает чистку или ущерб."
      : "You do not need to wash the car before return. If it is extremely dirty and chemical cleaning is needed, the extra fee is agreed separately. Smoking and pets are at your own risk: if smell, hair, or damage remains, the customer pays cleaning or damage cost.";
  }

  if (messageHasAny(text, ["wifi", "baby", "seat", "driver", "roof", "ski", "extra", "вай", "кресл", "водител", "багаж", "лыж"])) {
    return ru
      ? "Дополнительно доступны: личный водитель от $80/день, Wi-Fi от $5/день, детское кресло от $5/день, roof box или ski rack по запросу."
      : "Extras available: private driver from $80/day, Wi-Fi from $5/day, baby seat from $5/day, roof box or ski rack on request.";
  }

  return ru
    ? `Я помогу с условиями аренды, ценами, страховкой, доставкой и подбором машины. Для бронирования пришлите даты, время, желаемую машину, точку доставки и имя. ${contact}`
    : `I can help with rental conditions, prices, insurance, delivery, and choosing a car. For booking, send dates, time, preferred car, delivery point, and name. ${contact}`;
}

function appendAiMessage(role, content, options = {}) {
  if (!aiChatMessages) return null;
  const message = document.createElement("div");
  message.className = `ai-message ${role}${options.loading ? " loading" : ""}`;
  message.textContent = content;
  aiChatMessages.appendChild(message);
  aiChatMessages.scrollTop = aiChatMessages.scrollHeight;
  return message;
}

function resetAiChatGreeting() {
  if (!aiChatMessages || aiMessages.length) return;
  aiChatMessages.textContent = "";
  appendAiMessage("assistant", chatLabels().greeting);
}

function updateChatLanguage() {
  if (!aiChat) return;
  const labels = chatLabels();
  const headerSpan = aiChat.querySelector(".ai-chat-header span");
  const headerStrong = aiChat.querySelector(".ai-chat-header strong");
  const toggleStrong = aiChat.querySelector(".ai-chat-toggle strong");
  const closeButton = aiChat.querySelector("[data-ai-chat-close]");
  const sendButton = aiChat.querySelector(".ai-chat-form button");

  if (headerSpan) headerSpan.textContent = labels.kicker;
  if (headerStrong) headerStrong.textContent = labels.title;
  if (toggleStrong) toggleStrong.textContent = labels.toggle;
  if (closeButton) closeButton.setAttribute("aria-label", labels.close);
  if (aiChatInput) aiChatInput.placeholder = labels.placeholder;
  if (sendButton) sendButton.textContent = labels.send;
  if (aiWhatsAppButton) aiWhatsAppButton.textContent = labels.whatsapp;
  aiPromptButtons.forEach((button, index) => {
    if (labels.prompts[index]) button.textContent = labels.prompts[index];
  });

  if (!aiMessages.length && aiChatMessages) {
    aiChatMessages.textContent = "";
    resetAiChatGreeting();
  }
}

async function sendAiMessage(text) {
  const content = text.trim();
  if (!content || aiBusy) return;

  aiBusy = true;
  aiMessages.push({ role: "user", content });
  appendAiMessage("user", content);
  if (aiChatInput) aiChatInput.value = "";
  const loadingMessage = appendAiMessage("assistant", chatLabels().loading, { loading: true });

  try {
    const response = await fetch("/.netlify/functions/ai-consultant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language: activeLang(),
        messages: aiMessages.slice(-10)
      })
    });
    const data = await response.json().catch(() => ({}));
    const reply = response.ok && data.reply ? data.reply : localAssistantReply(content);
    if (loadingMessage) {
      loadingMessage.classList.remove("loading");
      loadingMessage.textContent = reply;
    }
    aiMessages.push({ role: "assistant", content: reply });
  } catch {
    const reply = localAssistantReply(content);
    if (loadingMessage) {
      loadingMessage.classList.remove("loading");
      loadingMessage.textContent = reply;
    }
    aiMessages.push({ role: "assistant", content: reply });
  } finally {
    aiBusy = false;
    if (aiChatMessages) aiChatMessages.scrollTop = aiChatMessages.scrollHeight;
  }
}

function sendChatToWhatsApp() {
  const labels = chatLabels();
  const transcript = aiMessages
    .slice(-10)
    .map((message) => `${message.role === "user" ? labels.userLabel : labels.assistantLabel}: ${message.content}`)
    .join("\n\n");
  const message = transcript
    ? `${labels.transcriptIntro}\n\n${transcript}`
    : pageMeta[activeLang()].genericMessage;
  window.open(whatsappUrl(message), "_blank", "noopener");
}

function updateMeta(lang) {
  const meta = pageMeta[lang];
  document.documentElement.lang = lang;
  document.title = meta.title;
  document.querySelector("meta[name='description']")?.setAttribute("content", meta.description);
  document.querySelector("meta[property='og:title']")?.setAttribute("content", meta.title);
  document.querySelector("meta[property='og:description']")?.setAttribute("content", meta.description);
}

function setLanguage(lang) {
  const safeLang = lang === "ru" ? "ru" : "en";
  document.body.dataset.lang = safeLang;
  translateTextNodes(safeLang);
  translateAttributes(safeLang);
  updateWhatsAppLinks(safeLang);
  updateMeta(safeLang);
  updateChatLanguage();
  dateInputs.forEach(validateDateInput);
  languageButtons.forEach((button) => {
    const active = button.dataset.langButton === safeLang;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  localStorage.setItem("gogorent-language", safeLang);
}

updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });

if (menuToggle && header && nav) {
  menuToggle.addEventListener("click", () => {
    const open = !header.classList.contains("is-open");
    header.classList.toggle("is-open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
  });

  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      header.classList.remove("is-open");
      menuToggle.setAttribute("aria-expanded", "false");
    }
  });
}

languageButtons.forEach((button) => {
  button.addEventListener("click", () => setLanguage(button.dataset.langButton));
});

dateInputs.forEach((input) => {
  input.addEventListener("input", () => {
    const formatted = formatDateInput(input.value);
    input.value = formatted;
    validateDateInput(input);
  });

  input.addEventListener("blur", () => validateDateInput(input));
});

galleryButtons.forEach((button) => {
  button.addEventListener("click", () => openLightbox(button));
  button.addEventListener("pointerenter", () => preloadGallerySet(gallerySources(button)));
  button.addEventListener("focus", () => preloadGallerySet(gallerySources(button)));
  button.addEventListener("touchstart", () => preloadGallerySet(gallerySources(button)), { passive: true });
});

window.addEventListener("load", scheduleGalleryPreload, { once: true });

lightboxClose?.addEventListener("click", closeLightbox);
lightboxPrev?.addEventListener("click", () => moveGallery(-1));
lightboxNext?.addEventListener("click", () => moveGallery(1));
lightbox?.addEventListener("click", (event) => {
  if (event.target === lightbox) closeLightbox();
});

document.addEventListener("keydown", (event) => {
  if (!lightbox || lightbox.hidden) return;
  if (event.key === "Escape") closeLightbox();
  if (event.key === "ArrowLeft") moveGallery(-1);
  if (event.key === "ArrowRight") moveGallery(1);
});

if (bookingForm) {
  bookingForm.addEventListener("submit", (event) => {
    event.preventDefault();
    dateInputs.forEach(validateDateInput);
    if (!bookingForm.reportValidity()) return;
    const lang = activeLang();
    const data = new FormData(bookingForm);
    const pickup = data.get("pickup") || pageMeta[lang].notSelected;
    const returnDate = data.get("returnDate") || pageMeta[lang].notSelected;
    const labels = lang === "ru"
      ? { pickup: "Дата получения", returnDate: "Дата возврата" }
      : { pickup: "Pickup date", returnDate: "Return date" };
    const message = `${pageMeta[lang].formIntro}\n\n${labels.pickup}: ${pickup}\n${labels.returnDate}: ${returnDate}\n\n${pageMeta[lang].sendAvailability}`;
    window.open(whatsappUrl(message), "_blank", "noopener");
  });
}

aiChatToggle?.addEventListener("click", () => {
  setChatOpen(true);
  resetAiChatGreeting();
});

aiChatClose?.addEventListener("click", () => setChatOpen(false));

aiChatForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  sendAiMessage(aiChatInput?.value || "");
});

aiChatInput?.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendAiMessage(aiChatInput.value);
  }
});

aiPromptButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setChatOpen(true);
    resetAiChatGreeting();
    sendAiMessage(button.dataset.aiPrompt || button.textContent || "");
  });
});

aiWhatsAppButton?.addEventListener("click", sendChatToWhatsApp);

setLanguage(localStorage.getItem("gogorent-language") || "en");
