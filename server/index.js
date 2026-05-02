const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");                          
const socketHandlers = require("./socketHandlers");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// 1. Serve everything in public (css, js, assets, etc.)
app.use(express.static(path.join(__dirname, "..", "public")));

// 2. Explicit root route – send home.html with a known root
app.get("/", (req, res) => {
  const filePath = path.join(__dirname, "..", "public", "home.html");
  res.sendFile(filePath);
});

io.on("connection", (socket) => socketHandlers(io, socket));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});