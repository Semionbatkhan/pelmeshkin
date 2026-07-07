export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).json({
      ok: true,
      message: "API работает. Для заказа нужен POST-запрос."
    });
  }

  try {
    const { chatId, text, customer } = req.body;

    if (!chatId || !text) {
      return res.status(400).json({
        ok: false,
        error: "Нет chatId или текста заказа"
      });
    }

    const botToken = process.env.BOT_TOKEN;
    const adminChatId = process.env.ADMIN_CHAT_ID;

    if (!botToken || !adminChatId) {
      return res.status(500).json({
        ok: false,
        error: "Не настроены BOT_TOKEN или ADMIN_CHAT_ID"
      });
    }

    const orderId = Date.now();

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
