const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const admin = require("firebase-admin");
const AdminRoutes = require("./routes/AdminRoutes");

const app = express();
const port = 3001;

// Initialize Firebase
const serviceAccount = require("./serviceAccountKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

app.use(cors());
app.use(bodyParser.json());
app.use("/", AdminRoutes); // Assuming your routes are prefixed with "/api"

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
