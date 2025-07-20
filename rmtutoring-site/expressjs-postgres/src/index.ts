import cors from "cors";
import bodyParser from "body-parser";
import express from "express";
import pg from "pg";
import AWS from "aws-sdk";


function init_bucket() {
  const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_KEY,     // Load from env or secrets
    secretAccessKey: process.env.AWS_SECRET,
    region: 'us-east-1', 
    signatureVersion: "v4"
  });
  return s3;
}

function init_app() {
  const app = express();
  app.use(cors());
  return app;
}

async function search_bucket(s3: AWS.S3, folderName: String) {
  console.log(`using prefix: ${folderName}`);
  console.log(`bucket name: ${process.env.BUCKET_NAME!}`);
  const s3Response = await s3
    .listObjectsV2({
      Bucket: process.env.BUCKET_NAME!,
      Prefix: `${folderName}/`,
    })
    .promise();

  const files = s3Response.Contents!.map((item: any) => ({
    key: item.Key,
    url: s3.getSignedUrl("getObject", {
      Bucket: process.env.BUCKET_NAME,
      Key: item.Key,
      Expires: 60 * 5, // 5 mins
    }),
  }));
  return files;
}


const s3 = init_bucket();

// Connect to the database using the DATABASE_URL environment
//   variable injected by Railway
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false ? { rejectUnauthorized: false } : false,
});


const app = init_app();

app.use(bodyParser.json());
app.use(bodyParser.raw({ type: "application/vnd.custom-type" }));
app.use(bodyParser.text({ type: "text/html" }));

app.get("/videos/:email", async (req: any, res: any) => {
  const { email } = req.params;
  try {
    // Step 1: Get meeting_id from DB
    const result = await pool.query(
      `SELECT br."meetingId" FROM "Attendee" a
       JOIN "BookingReference" br ON a."bookingId" = br."bookingId"
       WHERE a.email = $1
       AND br."meetingId" NOT LIKE '\\_%'`,
      [email]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: "Not found" });

    console.log("📦 Meeting IDs to search:", result.rows);

    const allFiles = await Promise.all(
      result.rows.map(async row => {
        const folderName = row.meetingId;
        console.log(`🔍 Searching folder: ${folderName}`);

        const result = await search_bucket(s3, `rmtutoringservices/${folderName}`);
        console.log("Found:", result.length, "files");

        return result;
      })
    );

    const flatFiles = allFiles.flat(); // flatten array of arrays
    res.json(flatFiles);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.get("/bookings/:email", async (req: any, res: any) => {
  const { email } = req.params;
  const result = await pool.query(
    `SELECT * FROM "Booking" b 
      WHERE responses->>'email' = $1`, 
      [email]);
  res.json(result.rows)

});

app.get("/", async (req: any, res: any) => {
  const { rows } = await pool.query("SELECT NOW()");
  res.send(`Hello, World! The time from the DB is ${rows[0].now}`);
});

const port = process.env.PORT || 3333;
app.listen(port, () => {});
