export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).json({
      ok: true,
      message: "API работает. Для заказа нужен POST-запрос."
    });
  }

  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        ok: false,
        error: "Нет текста заказа"
      });
    }

    const botToken = process.env.BOT_TOKEN;
    const chatId = process.env.CHAT_ID;

    if (!botToken || !chatId) {
      return res.status(500).json({
        ok: false,
        error: "Не настроены BOT_TOKEN или CHAT_ID"
      });
    }

    const message = `🛒 Новый заказ\n\n${text}`;

    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "✅ Подтвердить заказ",
                  callback_data: "confirm_order"
                }
              ],
              [
                {
                  text: "❌ Отменить заказ",
                  callback_data: "cancel_order"
                }
              ]
            ]
          }
        })
      }
    );

    const result = await telegramResponse.json();

    if (!result.ok) {
      return res.status(500).json({
        ok: false,
        error: result.description || "Telegram error"
      });
    }

    return res.status(200).json({
      ok: true,
      message: "Заказ отправлен в Telegram"
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
}
