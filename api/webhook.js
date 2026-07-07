export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).json({
      ok: true,
      message: "Webhook работает. Нужен POST от Telegram."
    });
  }

  try {
    const botToken = process.env.BOT_TOKEN;
    const adminChatId = process.env.ADMIN_CHAT_ID;

    if (!botToken || !adminChatId) {
      return res.status(500).json({
        ok: false,
        error: "Не настроены BOT_TOKEN или ADMIN_CHAT_ID"
      });
    }

    const update = req.body;
    const callback = update.callback_query;

    if (!callback) {
      return res.status(200).json({ ok: true });
    }

    const data = callback.data || "";

    if (!data.startsWith("confirm_")) {
      return res.status(200).json({ ok: true });
    }

    const customerChatId = callback.message.chat.id;
    const customerName = [
      callback.from.first_name,
      callback.from.last_name
    ].filter(Boolean).join(" ");

    const username = callback.from.username
      ? `@${callback.from.username}`
      : "без username";

    const orderText = callback.message.text || "Текст заказа не найден";

    await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        callback_query_id: callback.id,
        text: "Заказ подтвержден ✅"
      })
    });

    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chat_id: customerChatId,
        text: "✅ Заказ подтвержден. Мы скоро свяжемся с вами."
      })
    });

    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chat_id: adminChatId,
        text: `🔔 Новый подтвержденный заказ

Клиент: ${customerName}
Username: ${username}
Telegram ID: ${callback.from.id}

${orderText}`
      })
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
}
