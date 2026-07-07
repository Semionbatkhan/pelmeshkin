function makeOrderId() {
  const parts = new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Europe/Nicosia",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(new Date());

  const get = (type) => parts.find((p) => p.type === type)?.value || "";

  return `${get("day")}${get("month")}${get("year")}${get("hour")}${get("minute")}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).json({
      ok: true,
      message: "API работает. Для заказа нужен POST-запрос."
    });
  }

  try {
    const { chatId, text, customer, items, total } = req.body;

    if (!chatId || !text) {
      return res.status(400).json({
        ok: false,
        error: "Нет chatId или текста заказа"
      });
    }

    const botToken = process.env.BOT_TOKEN;
    const adminChatId = process.env.ADMIN_CHAT_ID;
    const sheetsWebhookUrl = process.env.SHEETS_WEBHOOK_URL;

    if (!botToken || !adminChatId) {
      return res.status(500).json({
        ok: false,
        error: "Не настроены BOT_TOKEN или ADMIN_CHAT_ID"
      });
    }

    const orderId = makeOrderId();

    const customerMessage = `Спасибо! Мы получили ваш заказ №${orderId}.

${text}

Если вы заметили неточности в заказе, просто напишите их сюда сообщением.`;

    const adminMessage = `🔔 Новый заказ №${orderId}

${text}

Telegram:
${customer?.telegram?.username ? "@" + customer.telegram.username : "без username"}

Telegram ID:
${chatId}`;

    async function sendMessage(chat_id, message) {
      const response = await fetch(
        `https://api.telegram.org/bot${botToken}/sendMessage`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            chat_id,
            text: message
          })
        }
      );

      const result = await response.json();

      if (!result.ok) {
        throw new Error(result.description || "Telegram error");
      }
    }

    await sendMessage(chatId, customerMessage);
    await sendMessage(adminChatId, adminMessage);

    if (sheetsWebhookUrl) {
      await fetch(sheetsWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          orderId,
          date: new Date().toISOString(),
          name: customer?.name || "",
          phone: customer?.phone || "",
          address: customer?.address || "",
          comment: customer?.comment || "",
          items: items || [],
          total,
          telegramId: chatId,
          username: customer?.telegram?.username || "",
          text
        })
      });
    }

    return res.status(200).json({
      ok: true,
      orderId
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
}
