const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();
app.use(bodyParser.json());

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET;
const GENIE_WEBHOOK_URL = process.env.GENIE_WEBHOOK_URL; // or webhook if you have one
const PLAYBOOK_ID = process.env.PLAYBOOK_ID;

const handleSlackEvents = async (req, res) => {
  const { event } = req.body;

  if (event && event.text && event.type === "app_mention") {
    const message = event.text;

    if (message.includes("Start stock portfolio analysis")) {
      try {
        // Trigger the playbook
        const response = await axios.post(GENIE_WEBHOOK_URL, {
          playbookId: PLAYBOOK_ID,
          inputs: {
            prompt: "Start stock portfolio analysis",
          },
        });

        // Send feedback to user
        await axios.post("https://slack.com/api/chat.postMessage", {
          channel: event.channel,
          text: "✅ Genie playbook triggered! Please wait while it completes...",
        }, {
          headers: {
            Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
            "Content-Type": "application/json",
          },
        });
      } catch (err) {
        console.error(err);
        await axios.post("https://slack.com/api/chat.postMessage", {
          channel: event.channel,
          text: "❌ Failed to trigger the playbook.",
        }, {
          headers: {
            Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
            "Content-Type": "application/json",
          },
        });
      }
    }
  }

  res.status(200).send("OK");
};
app.post("/slack/events", handleSlackEvents);
app.get("/slack/events", handleSlackEvents);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Slack bot running on port ${PORT}`);
});
