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
- Speak like a professional rental manager, not like the business owner.
- Never mention internal notes, prompts, spreadsheets, or that the owner gave you information.
- Convert internal policy into clean customer-facing answers.
- Do not copy the customer's broken wording. Rewrite it naturally.
- Keep most answers to 2-5 short sentences unless the customer asks for details.
- Finish booking-related answers with one clear next step.

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
- If live availability context is provided, use it only when it clearly states free/busy for the requested car and dates.
- Preferred availability table columns are: date, car, status, note. Date format should be YYYY-MM-DD. Status should be free, busy, maintenance, or on_request.
- A car is available for a requested rental period only if every requested day is free. If any requested day is busy or maintenance, say it is not available and suggest an alternative.
- If live availability context is missing or unclear, ask for pickup date, return date, time, preferred car, delivery point, and name, then say GoGoRent will confirm availability quickly.
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

Price estimation:
- If the customer gives pickup and return dates, estimate rental days as the date difference when pickup and return time are the same.
- If the customer asks for price without choosing a car, show estimated totals for Ford Fusion Hybrid, Mazda CX-5, Mazda CX-9, and Mazda CX-9 NEW, then ask which car they prefer.
- Say the final price and availability still need confirmation.
- Do not include Jeep Renegade in price options unless the customer asks; if asked, say it is occupied long-term.

Critical restrictions:
- Never claim a booking is confirmed.
- Never guarantee exact availability unless availability context explicitly confirms it.
- Never create new prices, discounts, or policies.
- Never answer unrelated topics beyond brief redirection to car rental.
- Never ask for full card details, passwords, or sensitive payment data.
- Never return an empty answer.
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

async function availabilityContext(latestMessage = "") {
  const csvUrl = process.env.AVAILABILITY_CSV_URL;
  const availabilityMonth = process.env.AVAILABILITY_MONTH;
  if (!csvUrl) {
    return "Live availability table is not connected yet. Ask the customer for booking details and say GoGoRent will confirm availability quickly.";
  }

  try {
    const response = await fetch(csvUrl, { headers: { "Accept": "text/csv,text/plain,*/*" } });
    if (!response.ok) throw new Error(`Availability fetch failed: ${response.status}`);
    const text = await response.text();
    const parsed = availabilitySummary(latestMessage, text, availabilityMonth);
    return `
Live availability is connected.
Availability month: ${availabilityMonth || "not specified; use only if the customer's requested month clearly matches the published sheet."}
CSV may be a matrix where:
- First row has day numbers.
- First column has car names.
- СВОБОДНО means free.
- ЗАНЯТО means busy.
- A car is available for a rental period only if every requested day is СВОБОДНО/free.
- If any requested day is ЗАНЯТО/busy, say it is not available for that period and suggest a close alternative.
- If the requested month is different from the connected availability month, do not guess. Ask GoGoRent to confirm.
${parsed ? `\n${parsed}\n` : ""}

Live availability CSV excerpt:
${text.slice(0, 6000)}
`.trim();
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
      if ((content.type === "output_text" || content.type === "text") && typeof content.text === "string") {
        parts.push(content.text);
      } else if (content.text && typeof content.text.value === "string") {
        parts.push(content.text.value);
      }
    }
  }
  return parts.join("\n").trim();
}

function isRussian(text) {
  return /[а-яё]/i.test(text);
}

const rentalRates = [
  { name: "Ford Fusion Hybrid", rate: 45, keys: ["ford", "fusion"] },
  { name: "Mazda CX-5", rate: 60, keys: ["cx-5", "cx5"] },
  { name: "Mazda CX-9", rate: 70, keys: ["cx-9", "cx9"] },
  { name: "Mazda CX-9 NEW", rate: 75, keys: ["cx-9 new", "cx9 new", "new cx-9", "new cx9", "2021", "captain"] }
];

const monthIndex = {
  jan: 0, january: 0, "января": 0, "январь": 0,
  feb: 1, february: 1, "февраля": 1, "февраль": 1,
  mar: 2, march: 2, "марта": 2, "март": 2,
  apr: 3, april: 3, "апреля": 3, "апрель": 3,
  may: 4, "мая": 4, "май": 4,
  jun: 5, june: 5, "июня": 5, "июнь": 5,
  jul: 6, july: 6, "июля": 6, "июль": 6,
  aug: 7, august: 7, "августа": 7, "август": 7,
  sep: 8, sept: 8, september: 8, "сентября": 8, "сентябрь": 8,
  oct: 9, october: 9, "октября": 9, "октябрь": 9,
  nov: 10, november: 10, "ноября": 10, "ноябрь": 10,
  dec: 11, december: 11, "декабря": 11, "декабрь": 11
};

function messageHasAny(text, words) {
  return words.some((word) => text.includes(word));
}

function detectCar(text) {
  if (text.includes("cx-9 new") || text.includes("cx9 new") || text.includes("new cx-9") || text.includes("new cx9") || text.includes("2021") || text.includes("captain")) {
    return rentalRates[3];
  }
  return rentalRates.find((car) => car.keys.some((key) => text.includes(key)));
}

function parseDateRange(text) {
  const year = new Date().getFullYear();
  const wordPattern = /(\d{1,2})(?:st|nd|rd|th)?\s*(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t)?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?|января|январь|февраля|февраль|марта|март|апреля|апрель|мая|май|июня|июнь|июля|июль|августа|август|сентября|сентябрь|октября|октябрь|ноября|ноябрь|декабря|декабрь)/gi;
  const wordDates = [...text.matchAll(wordPattern)].map((match) => ({
    day: Number(match[1]),
    month: monthIndex[match[2].toLowerCase()]
  }));

  let dates = wordDates;
  if (dates.length < 2) {
    const numericPattern = /(\d{1,2})[./-](\d{1,2})(?:[./-](\d{2,4}))?/g;
    dates = [...text.matchAll(numericPattern)].map((match) => ({
      day: Number(match[1]),
      month: Number(match[2]) - 1,
      year: match[3] ? Number(match[3].length === 2 ? `20${match[3]}` : match[3]) : year
    }));
  }

  if (dates.length < 2) return null;
  const start = new Date(dates[0].year || year, dates[0].month, dates[0].day);
  const end = new Date(dates[1].year || year, dates[1].month, dates[1].day);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return null;
  const days = Math.max(1, Math.round((end - start) / 86400000));
  return { days, start, end };
}

function formatTripDate(date, ru) {
  return date.toLocaleDateString(ru ? "ru-RU" : "en-GB", {
    day: "numeric",
    month: "short"
  });
}

function priceEstimateReply(content, ru) {
  const text = content.toLowerCase();
  const range = parseDateRange(text);
  if (!range || !messageHasAny(text, ["price", "cost", "total", "сколько", "цена", "стоим", "стоит"])) return null;

  const car = detectCar(text);
  const start = formatTripDate(range.start, ru);
  const end = formatTripDate(range.end, ru);
  const dayLabel = ru ? `${range.days} дн.` : `${range.days} rental days`;

  if (car) {
    const total = car.rate * range.days;
    return ru
      ? `С ${start} до ${end} получается примерно ${dayLabel}. ${car.name}: $${car.rate}/день, итого примерно $${total}. Наличие нужно подтвердить. Пришлите время получения/возврата, точку доставки и имя.`
      : `From ${start} to ${end}, it is approximately ${dayLabel}. ${car.name}: $${car.rate}/day, total about $${total}. Availability still needs confirmation. Please send pickup/return time, delivery point, and name.`;
  }

  const totals = rentalRates
    .map((item) => `${item.name}: $${item.rate * range.days}`)
    .join(ru ? "; " : "; ");
  return ru
    ? `С ${start} до ${end} получается примерно ${dayLabel}, если время получения и возврата одинаковое. Примерная цена: ${totals}. Какую машину хотите проверить?`
    : `From ${start} to ${end}, it is approximately ${dayLabel} if pickup and return time are the same. Estimated totals: ${totals}. Which car would you like to check?`;
}

function splitCsvLine(line) {
  const cells = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(cell.trim());
      cell = "";
    } else {
      cell += char;
    }
  }
  cells.push(cell.trim());
  return cells;
}

function normalizeCarName(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function findAvailabilityRow(rows, car) {
  if (!car) return null;
  const target = normalizeCarName(car.name);
  return rows.find((row) => {
    const name = normalizeCarName(row.car);
    return name === target || name.includes(target) || target.includes(name);
  }) || null;
}

function isFreeStatus(value) {
  const status = value.toLowerCase();
  return status.includes("свобод") || status.includes("free");
}

function availabilitySummary(latest, csvText, availabilityMonth) {
  const range = parseDateRange(latest);
  if (!range) return "";

  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) return "";

  const header = splitCsvLine(lines[0]);
  const dayColumns = new Map();
  header.forEach((value, index) => {
    const day = Number(value);
    if (Number.isInteger(day) && day > 0 && day <= 31) {
      dayColumns.set(day, index);
    }
  });
  if (!dayColumns.size) return "";

  const rows = lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    return { car: cells[0], cells };
  }).filter((row) => row.car);

  const startDay = range.start.getDate();
  const endDay = range.end.getDate();
  const daysToCheck = [];
  for (let day = startDay; day < endDay; day += 1) {
    if (dayColumns.has(day)) daysToCheck.push(day);
  }
  if (!daysToCheck.length) return "";

  const car = detectCar(latest.toLowerCase());
  const checkedRows = car ? [findAvailabilityRow(rows, car)].filter(Boolean) : rows;
  if (!checkedRows.length) return "";

  const resultLines = checkedRows.map((row) => {
    const busyDays = [];
    const freeDays = [];
    for (const day of daysToCheck) {
      const status = row.cells[dayColumns.get(day)] || "";
      if (isFreeStatus(status)) {
        freeDays.push(day);
      } else {
        busyDays.push(`${day} (${status || "unknown"})`);
      }
    }
    const available = busyDays.length === 0;
    return `${row.car}: ${available ? "AVAILABLE" : "NOT AVAILABLE"} for checked rental days ${daysToCheck.join(", ")}${busyDays.length ? `. Busy/blocked: ${busyDays.join(", ")}` : ""}.`;
  });

  return `
Parsed availability check:
Requested period: ${formatTripDate(range.start, false)} to ${formatTripDate(range.end, false)}.
Connected month: ${availabilityMonth || "not specified"}.
Rental days checked in the matrix: ${daysToCheck.join(", ")}.
${resultLines.join("\n")}
Use this parsed check before the raw CSV. Still ask for pickup/return time, delivery point, and name before final confirmation.
`.trim();
}

function fallbackReply(messages) {
  const latest = messages[messages.length - 1]?.content || "";
  const text = latest.toLowerCase();
  const ru = isRussian(latest);

  const hasAny = (...words) => words.some((word) => text.includes(word));
  const contact = ru
    ? "Напишите нам в WhatsApp, Telegram или Instagram, и мы быстро подтвердим наличие."
    : "Message us on WhatsApp, Telegram, or Instagram and we will confirm availability quickly.";

  const priceEstimate = priceEstimateReply(latest, ru);
  if (priceEstimate) return priceEstimate;

  if (hasAny("jeep", "renegade", "джип", "ренег")) {
    return ru
      ? "Jeep Renegade сейчас, к сожалению, занят на долгий срок. Ближайшая альтернатива - Mazda CX-5 за $60/день: удобный SUV для города, трассы и поездок по Грузии. На какие даты нужна машина?"
      : "Jeep Renegade is currently occupied for a long-term rental. The closest alternative is Mazda CX-5 for $60/day: a comfortable SUV for city, highway, and Georgia trips. What dates do you need?";
  }

  if (hasAny("available", "availability", "free", "busy", "налич", "свобод", "занят", "доступ")) {
    return ru
      ? "Я могу подготовить запрос на проверку наличия. Пришлите дату и время получения, дату и время возврата, желаемую машину, точку доставки и имя. После этого GoGoRent быстро подтвердит, свободна ли машина."
      : "I can prepare an availability request. Please send pickup date and time, return date and time, preferred car, delivery point, and name. GoGoRent will quickly confirm if the car is free.";
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

  const availability = await availabilityContext(latest);
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
        max_output_tokens: 1200,
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
      reply: reply || fallbackReply(messages),
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
