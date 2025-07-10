import { ImapFlow } from "imapflow";

export async function handleDeleteEmail(req, res) {
  console.log("handleDeleteEmail invoked");

  const email =
    req.body?.contact?.email ||
    req.body?.meta?.sender?.email;

  if (!email) {
    console.warn("Missing contact email (contact.email or meta.sender.email)");
    return res.status(400).json({ error: "Missing contact email" });
  }

  const event = req.body?.event;
  const status = req.body?.status;
  if (event !== "conversation_status_changed" || status !== "resolved") {
    console.log(`Ignoring event: event=${event}, status=${status}`);
    return res.status(200).json({ message: "Not a resolved conversation_status_changed event, no action taken" });
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

    let mailboxInfo = await client.mailboxOpen("INBOX");
    console.log("Mailbox info:", mailboxInfo);

    // Try several search strategies!
    let uids;

    try {
      uids = await client.search(['ALL']);
      console.log("ALL message uids in INBOX:", uids, "Type:", typeof uids, "Is array:", Array.isArray(uids));
    } catch (e) {
      console.log("['ALL'] search failed:", e.message);
    }

    if (!uids || !Array.isArray(uids)) {
      try {
        uids = await client.search();
        console.log("Empty search (should be ALL) uids in INBOX:", uids, "Type:", typeof uids, "Is array:", Array.isArray(uids));
      } catch (e) {
        console.log("Empty search failed:", e.message);
      }
    }

    if (!uids || !Array.isArray(uids)) {
      try {
        uids = await client.search(['UNSEEN']);
        console.log("UNSEEN search uids in INBOX:", uids, "Type:", typeof uids, "Is array:", Array.isArray(uids));
      } catch (e) {
        console.log("['UNSEEN'] search failed:", e.message);
      }
    }

    if (!uids || !Array.isArray(uids)) {
      try {
        uids = await client.search(['from', email]);
        console.log("['from', email] search uids in INBOX:", uids, "Type:", typeof uids, "Is array:", Array.isArray(uids));
      } catch (e) {
        console.log("['from', email] search failed:", e.message);
      }
    }

    if (!uids || !Array.isArray(uids)) {
      // As a last resort, fetch by sequence numbers
      let seqs = Array.from({length: mailboxInfo.exists}, (_, i) => i + 1);
      for (let seq of seqs) {
        try {
          const message = await client.fetchOne(seq, { envelope: true, uid: true });
          console.log('Fetched message by seq:', seq, message && message.envelope && message.envelope.from, 'UID:', message && message.uid);
        } catch (e) {
          console.log("Fetch by seq failed:", e.message);
        }
      }
      await client.logout();
      return res.status(500).json({ error: "IMAP search failed with all strategies, check logs for fetchOne output" });
    }

    let toDelete = [];
    for (const uid of uids) {
      const message = await client.fetchOne(uid, { envelope: true });
      if (message && message.envelope && message.envelope.from) {
        const fromAddrs = message.envelope.from.map(f => f.address && f.address.toLowerCase());
        console.log(`UID ${uid} fromAddrs:`, fromAddrs);
        if (fromAddrs.includes(email.toLowerCase())) {
          toDelete.push(uid);
        }
      }
    }

    if (toDelete.length === 0) {
      await client.logout();
      console.log("No matching emails found to delete.");
      return res.status(404).json({ message: "No emails found from contact", debug: "Check logs for fromAddrs" });
    }

    await client.messageDelete(toDelete);
    await client.logout();
    console.log(`Deleted ${toDelete.length} email(s) from ${email} in INBOX`);

    return res.status(200).json({ message: `Deleted ${toDelete.length} emails from ${email}` });

  } catch (err) {
    try { await client.logout(); } catch {}
    console.error("IMAP error in delete-email:", err);
    return res.status(500).json({ error: "Failed to delete email(s)", details: err.message });
  }
}