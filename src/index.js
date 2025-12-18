require('dotenv').config();
const express = require("express");
const port = 3000;
const cors = require("cors");
const errorHandlingMiddleware = require("./middlewares/errorHandling.middleware");
const http = require("http");
const { Server } = require("socket.io");

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:5173"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });

  socket.on('subscribe-order', (orderNumber) => {
    console.log(`Client ${socket.id} subscribed to order ${orderNumber}`);
    socket.join(`${orderNumber}`); // Join room theo order
  });
})
app.set("io", io); // Lưu instance của Socket.io vào app để sử dụng trong các controller

app.use(cors());
app.use("/public", express.static("public")); // Cho phép truy cập tệp tĩnh trong thư mục 'public'

app.use("/api", require("./routes/index"));

app.use(errorHandlingMiddleware);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

server.listen(port, async () => {
  console.log(`server is running on port ${port}`);
});
