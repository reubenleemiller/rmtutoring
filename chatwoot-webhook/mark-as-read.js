import { ImapFlow } from "imapflow";

export async function handleMarkAsRead(req, res) {
  console.log("handleMarkAsRead invoked");
  const email = req.body?.contact?.email;
  if (!email) {
    return res.status(400).json({ error: "Missing contact email" });
  }
  const client = new ImapFlow({
    host: process.env.IMAP_HOST,
    port: Number(process.env.IMAP_PORT || 993),
    secure: true,
    auth: {
      user: process.env.IMAP_LOGIN,
      pass: process.env.IMAP_PASSWORD
    }
  });
  try {
    await client.connect();
    console.log("Connected to IMAP");
    await client.mailboxOpen("INBOX");
    console.log("Mailbox opened");
    // Search all unseen messages from this sender (by envelope from)
    const searchCriteria = [['FROM', email], ['UNSEEN']];
    const uids = await client.search(searchCriteria);
    console.log("Search result uids:", uids);
    if (!uids || uids.length === 0) {
      await client.logout();
      return res.status(404).json({ message: "No unread emails found from contact" });
    }
    await client.messageFlagsAdd(uids, ['\\Seen']);
    await client.logout();
    return res.status(200).json({ message: `Marked ${uids.length} emails as read from ${email}` });
  } catch (err) {
    try { await client.logout(); } catch {}
    console.error("IMAP error in mark-as-read:", err);
    return res.status(500).json({ error: "Failed to mark email(s) as read" });
  }
}