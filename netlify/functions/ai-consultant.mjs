const OPENAI_API_URL = "https://api.openai.com/v1/responses";
const DEFAULT_MODEL = "gpt-5-mini";

const systemPrompt = `
You are the GoGoRent website AI consultant for car rental in Tbilisi, Georgia.

Primary goal:
- Help visitors in English or Russian.
- Answer practical rental questions clearly.
- Recommend a suitable car.
- Collect booking details and move the customer to WhatsApp, Telegram, or Instagram.

Language:
- Reply in the same language as the customer.
- If the customer mixes Russian and English, choose the language they mostly use.
- Keep replies concise, helpful, and sales-oriented.

Tone:
- Friendly, direct, confident, and practical.
- Do not over-explain.
- Ask one next useful question when booking details are missing.

Current GoGoRent fleet:
- Mazda CX-5: $60/day. Comfortable SUV for city, highway, Kakheti, mixed roads, and small family trips.
- Mazda CX-9: $70/day. 7-seat AWD SUV for families, luggage, Kazbegi, Gudauri, and long trips.
- Mazda CX-9 NEW: $75/day. 2021 model, maximum trim, captain chairs in the rear, very comfortable for family and longer routes.
- Ford Fusion Hybrid: $45/day. Economical hybrid sedan for Tbilisi, airport, business trips, and lower fuel cost.
- Jeep Renegade 4x4: if asked, say it is currently occupied for a long-term rental and offer Mazda CX-5 as the closest alternative.

Main conditions:
- No deposit, always.
- Support is available 24/7.
- Unlimited mileage inside Georgia.
- Travel to other Georgian cities is allowed.
- Border crossing to other countries is not allowed.
- Drop-off/return must be in Tbilisi unless the owner confirms otherwise.
- Minimum rental is 1 day.
- For 1-day rental, the customer must pick up the car near Akhmeteli Theatre metro, Gldani, unless paid delivery is agreed.
- Tbilisi delivery is free for rentals from 2 days.
- For 1-day rental, Tbilisi delivery is $20.
- Delivery or drop-off from 23:00 to 09:00 costs $20.
- Payment methods: Georgian bank transfer, Visa, cash in EUR, USD, or GEL.
- Fuel: customer receives the car with a certain fuel level and should return it at approximately the same level.

Documents and driver requirements:
- Minimum driver age: 21.
- Minimum driving experience: more than 1 year.
- Required document: valid driving license.
- International driving permit is not required if the license has English/Latin name and surname details.

Insurance and responsibility:
- Insurance is included.
- Insurance covers everything except tires.
- Fines are not included.
- Off-road driving is not included. If an accident happens during off-road driving, coverage does not apply.
- In case of accident: the customer must stop the car, not move it more than 4 meters, call GoGoRent first, then police if instructed. GoGoRent will guide the customer.
- Tires are not covered.
- Customer does not need to wash the car before return.
- If the car is extremely dirty and chemical cleaning is needed, extra cleaning fee may be charged by agreement.
- Smoking is at the customer's own risk. If smell or damage remains, the customer pays the damage/cleaning cost.
- Pets are at the customer's own risk. If hair, smell, or damage remains, the customer pays the damage/cleaning cost.

Extras:
- Private driver: from $80/day.
- Unlimited Wi-Fi: from $5/day.
- Baby seat: from $5/day.
- Roof box or ski rack: on request.

Availability rules:
- Do not invent live availability.
- If the customer asks whether a car is available on a specific date and live availability context is not provided, ask for pickup date, return date, time, preferred car, delivery point, and name, then say GoGoRent will confirm availability quickly.
- If the customer says a car is needed today/tomorrow, be helpful but still avoid promising availability.
- If the preferred car is not available, suggest a close alternative.

Booking data to collect:
- Name.
- Pickup date.
- Pickup time.
- Return date.
- Return time.
- Preferred car.
- Delivery/pickup point.
- Route or destination if relevant.

Contact channels:
- WhatsApp: https://wa.me/995500054521
- Telegram: https://t.me/gogorentt
- Instagram: https://www.instagram.com/gogorent.ge/

Critical restrictions:
- Never claim a booking is confirmed.
- Never guarantee exact availability unless availability context explicitly confirms it.
- Never create new prices, discounts, or policies.
- Never answer unrelated topics beyond brief redirection to car rental.
- Never ask for full card details, passwords, or sensitive payment data.
`.trim();

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    },
    body: JSON.stringify(body)
  };
}

function parseBody(event) {
  try {
    return JSON.parse(event.body || "{}");
  } catch {
    return {};
  }
}

function normalizeMessages(messages) {
  if (!Array.isArray(messages)) return [];
  return messages
    .filter((message) => message && typeof message.content === "string")
    .slice(-10)
    .map((message) => ({
      role: message.role === "assistant" ? "assistant" : "user",
      content: message.content.slice(0, 1200)
    }));
}

async function availabilityContext() {
  const csvUrl = process.env.AVAILABILITY_CSV_URL;
  if (!csvUrl) {
    return "Live availability table is not connected yet. Ask the customer for booking details and say GoGoRent will confirm availability quickly.";
  }

  try {
    const response = await fetch(csvUrl, { headers: { "Accept": "text/csv,text/plain,*/*" } });
    if (!response.ok) throw new Error(`Availability fetch failed: ${response.status}`);
    const text = await response.text();
    return `Live availability CSV excerpt:\n${text.slice(0, 6000)}`;
  } catch {
    return "Live availability table could not be loaded. Ask the customer for booking details and say GoGoRent will confirm availability quickly.";
  }
}

function extractOutputText(data) {
  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  const parts = [];
  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (content.type === "output_text" && content.text) {
        parts.push(content.text);
      }
    }
  }
  return parts.join("\n").trim();
}

function isRussian(text) {
  return /[а-яё]/i.test(text);
}

function fallbackReply(messages) {
  const latest = messages[messages.length - 1]?.content || "";
  const text = latest.toLowerCase();
  const ru = isRussian(latest);

  const hasAny = (...words) => words.some((word) => text.includes(word));
  const contact = ru
    ? "Напишите нам в WhatsApp, Telegram или Instagram, и мы быстро подтвердим наличие."
    : "Message us on WhatsApp, Telegram, or Instagram and we will confirm availability quickly.";

  if (hasAny("jeep", "renegade", "джип", "ренег")) {
    return ru
      ? "Jeep Renegade сейчас, к сожалению, занят на долгий срок. Ближайшая альтернатива - Mazda CX-5 за $60/день: удобный SUV для города, трассы и поездок по Грузии. На какие даты нужна машина?"
      : "Jeep Renegade is currently occupied for a long-term rental. The closest alternative is Mazda CX-5 for $60/day: a comfortable SUV for city, highway, and Georgia trips. What dates do you need?";
  }

  if (hasAny("condition", "terms", "deposit", "insurance", "услов", "депозит", "страхов")) {
    return ru
      ? "Основные условия: без депозита, страховка включена, безлимитный пробег по Грузии, выезд за границу нельзя. Водитель от 21 года и стаж больше 1 года. Нужны водительские права; международные права не обязательны, если в правах есть имя/фамилия латиницей. Шины, штрафы и off-road ДТП не входят в страховку."
      : "Main conditions: no deposit, insurance included, unlimited mileage inside Georgia, no border crossing. Driver must be 21+ with more than 1 year of experience. A valid driving license is required; international permit is not required if the license has name/surname in Latin letters. Tires, fines, and off-road accidents are not covered.";
  }

  if (hasAny("car", "cars", "fleet", "price", "available", "авто", "машин", "цена", "стоит", "налич")) {
    return ru
      ? `У нас есть Mazda CX-5 - $60/день, Mazda CX-9 - $70/день, Mazda CX-9 NEW 2021 max комплектация с captain chairs - $75/день, Ford Fusion Hybrid - $45/день. Jeep Renegade сейчас занят на долгий срок. Для проверки наличия пришлите даты, время, машину, точку доставки и имя. ${contact}`
      : `We have Mazda CX-5 - $60/day, Mazda CX-9 - $70/day, Mazda CX-9 NEW 2021 max trim with captain chairs - $75/day, and Ford Fusion Hybrid - $45/day. Jeep Renegade is occupied long-term. To check availability, send dates, time, preferred car, delivery point, and name. ${contact}`;
  }

  if (hasAny("delivery", "airport", "pickup", "drop", "достав", "аэропорт", "забрать", "возврат")) {
    return ru
      ? "Доставка по Тбилиси бесплатная при аренде от 2 дней. При аренде на 1 день машину нужно забрать около метро Ахметели Театр, Глдани, либо доставка стоит $20. Доставка или возврат с 23:00 до 09:00 стоит $20."
      : "Tbilisi delivery is free for rentals from 2 days. For a 1-day rental, pickup is near Akhmeteli Theatre metro in Gldani, or delivery costs $20. Delivery or drop-off from 23:00 to 09:00 costs $20.";
  }

  if (hasAny("payment", "pay", "card", "cash", "оплат", "карта", "налич")) {
    return ru
      ? "Оплата возможна грузинским банковским переводом, Visa, наличными в EUR, USD или GEL."
      : "Payment is possible by Georgian bank transfer, Visa, or cash in EUR, USD, or GEL.";
  }

  if (hasAny("accident", "police", "дтп", "авар", "поли")) {
    return ru
      ? "При ДТП остановите машину и не двигайте ее больше чем на 4 метра. Сначала позвоните GoGoRent, потом в полицию, если мы скажем. Мы дадим точные инструкции."
      : "In case of accident, stop the car and do not move it more than 4 meters. Call GoGoRent first, then the police if we instruct you. We will guide you step by step.";
  }

  if (hasAny("smoking", "smoke", "pet", "dog", "cat", "wash", "clean", "кур", "живот", "собак", "кот", "мой", "гряз", "чист")) {
    return ru
      ? "Машину мыть перед возвратом не нужно. Если она очень грязная и нужна химчистка, доплата согласуется отдельно. Курение и животные - на ваш риск: если останется запах, шерсть или повреждения, клиент оплачивает чистку или ущерб."
      : "You do not need to wash the car before return. If it is extremely dirty and chemical cleaning is needed, the extra fee is agreed separately. Smoking and pets are at your own risk: if smell, hair, or damage remains, the customer pays cleaning or damage cost.";
  }

  if (hasAny("wifi", "baby", "seat", "driver", "roof", "ski", "extra", "вай", "кресл", "водител", "багаж", "лыж")) {
    return ru
      ? "Дополнительно доступны: личный водитель от $80/день, Wi-Fi от $5/день, детское кресло от $5/день, roof box или ski rack по запросу."
      : "Extras available: private driver from $80/day, Wi-Fi from $5/day, baby seat from $5/day, roof box or ski rack on request.";
  }

  return ru
    ? `Я помогу с условиями аренды, ценами, страховкой, доставкой и подбором машины. Для бронирования пришлите даты, время, желаемую машину, точку доставки и имя. ${contact}`
    : `I can help with rental conditions, prices, insurance, delivery, and choosing a car. For booking, send dates, time, preferred car, delivery point, and name. ${contact}`;
}

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return json(500, { error: "AI assistant is not configured yet." });
  }

  const body = parseBody(event);
  const messages = normalizeMessages(body.messages);
  const latest = messages[messages.length - 1]?.content?.trim();

  if (!latest) {
    return json(400, { error: "Message is required." });
  }

  const availability = await availabilityContext();
  const input = [
    {
      role: "developer",
      content: `${systemPrompt}\n\nAvailability context:\n${availability}`
    },
    ...messages
  ];

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || DEFAULT_MODEL,
        input,
        max_output_tokens: 650,
        store: false
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return json(200, {
        reply: fallbackReply(messages),
        fallback: true,
        reason: data.error?.code || "openai_request_failed"
      });
    }

    const reply = extractOutputText(data);
    return json(200, {
      reply: reply || "Please message GoGoRent on WhatsApp and we will help you quickly.",
      model: data.model || process.env.OPENAI_MODEL || DEFAULT_MODEL
    });
  } catch {
    return json(200, {
      reply: fallbackReply(messages),
      fallback: true,
      reason: "network_or_runtime_error"
    });
  }
}
