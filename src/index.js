
// src/index.js

// =======================================================
// DÒNG BỔ SUNG: TẢI BIẾN MÔI TRƯỜNG TRƯỚC HẾT
require('dotenv').config(); 
// =======================================================

const express = require('express')
const app = express()
const port = 3000
const cors = require('cors')

const errorHandlingMiddleware = require("./middlewares/errorHandling.middleware");


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use("/public", express.static("public")); // Cho phép truy cập tệp tĩnh trong thư mục 'public'

app.use("/api", require("./routes/index"));

app.use(errorHandlingMiddleware);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`server is running on port ${port}`);
});
