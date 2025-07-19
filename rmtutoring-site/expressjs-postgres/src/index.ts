import bodyParser from "body-parser";
import express from "express";
import pg from "pg";
import AWS from "aws-sdk";


function init_bucket() {
  const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_KEY,     // Load from env or secrets
    secretAccessKey: process.env.AWS_SECRET,
    region: 'us-east-1' // replace with your bucket's region
  });
  return s3;
}

async function search_bucket(s3, folderName: String) {
  const s3Response = await s3
    .listObjectsV2({
      Bucket: process.env.BUCKET_NAME,
      Prefix: `${folderName}/`,
    })
    .promise();

  const files = s3Response.Contents.map((item: any) => ({
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
const app = express();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false ? { rejectUnauthorized: false } : false,
});

app.use(bodyParser.json());
app.use(bodyParser.raw({ type: "application/vnd.custom-type" }));
app.use(bodyParser.text({ type: "text/html" }));

app.get("/videos/:email", async (req: any, res: any) => {
  const { email } = req.params;
  try {
    // Step 1: Get meeting_id from DB
    const result = await pool.query(
      `SELECT br.meeting_id FROM Atendee a
       JOIN BookingReference br ON a.booking_id = br.id
       WHERE a.email = $1`,
      [email]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: "Not found" });

    const folderName = result.rows[0].meeting_id;

    const files = await search_bucket(s3, folderName);

    // Step 2: List objects in S3 under the meeting_id folder
    res.json(files);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

const port = process.env.PORT || 3333;
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
