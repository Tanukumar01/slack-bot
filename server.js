const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();
app.use(bodyParser.json());

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const GENIE_WEBHOOK_URL = process.env.GENIE_WEBHOOK_URL;
const PLAYBOOK_ID = process.env.PLAYBOOK_ID;

// POST /slack/events (Slack Event Subscription URL)
app.post("/slack/events", async (req, res) => {
  const { type, challenge, event } = req.body;

  // ✅ Slack URL verification step (only happens once)
  if (type === "url_verification") {
    return res.status(200).send({ challenge });
  }

  // ✅ Respond immediately to Slack so it doesn't timeout
  res.status(200).send("OK");

  // ✅ Process app_mention events
  if (event && event.type === "app_mention" && event.text.includes("Start stock portfolio analysis")) {
    try {
      // Inform user that process started
      await axios.post("https://slack.com/api/chat.postMessage", {
        channel: event.channel,
        text: "📊 Starting stock portfolio analysis with Genie...",
      }, {
        headers: {
          Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
          "Content-Type": "application/json",
        },
      });

      // ✅ Trigger the Genie playbook
      const response = await axios.post(GENIE_WEBHOOK_URL, {
        playbookId: PLAYBOOK_ID,
        inputs: {
          prompt: "Start stock portfolio analysis",
        },
      });

      console.log("Genie response:", response.data);

      // ✅ Notify user after triggering
      await axios.post("https://slack.com/api/chat.postMessage", {
        channel: event.channel,
        text: "✅ Genie playbook triggered successfully! You’ll receive the analysis shortly.",
      }, {
        headers: {
          Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
          "Content-Type": "application/json",
        },
      });

    } catch (err) {
      console.error("Genie error:", err?.response?.data || err.message);
      await axios.post("https://slack.com/api/chat.postMessage", {
        channel: event.channel,
        text: "❌ Failed to trigger Genie playbook.",
      }, {
        headers: {
          Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
          "Content-Type": "application/json",
        },
      });
    }
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Slack bot running on port ${PORT}`);
});
