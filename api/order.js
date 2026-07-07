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

    if (!botToken) {
      return res.status(500).json({
        ok: false,
        error: "Не настроен BOT_TOKEN"
      });
    }

    const orderId = Date.now();

    const message = `Спасибо! Мы получили ваш заказ №${orderId}.

${text}

👇 Нажмите кнопку ниже, чтобы подтвердить заказ.`;

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
                  callback_data: `confirm_${orderId}`
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
      orderId
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
}
