const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const { v4: uuidv4 } = require("uuid");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const classrooms = {};
const MAX_USERS_PER_CLASSROOM = 10;

app.use(express.static("public"));

io.on("connection", (socket) => {
  console.log("New client connected");

  // Create a new classroom
  socket.on("createClassroom", () => {
    const classroomCode = uuidv4().substring(0, 6); // Create a unique 6-character code
    classrooms[classroomCode] = { users: [] };
    socket.join(classroomCode);
    classrooms[classroomCode].users.push(socket.id);
    io.to(classroomCode).emit(
      "classroomUpdate",
      classrooms[classroomCode].users
    );
    console.log(`Classroom created with code ${classroomCode}`);
    socket.emit("classroomCreated", classroomCode); // Send the code back to the creator
  });

  // Join a classroom
  socket.on("joinClassroom", (classroomCode) => {
    if (!classrooms[classroomCode]) {
      socket.emit("joinError", { message: "Classroom not found" });
      return;
    }

    if (classrooms[classroomCode].users.length >= MAX_USERS_PER_CLASSROOM) {
      socket.emit("joinError", { message: "Classroom is full" });
      return;
    }

    socket.join(classroomCode);
    classrooms[classroomCode].users.push(socket.id);
    io.to(classroomCode).emit(
      "classroomUpdate",
      classrooms[classroomCode].users
    );

    console.log(`Client ${socket.id} joined classroom ${classroomCode}`);
    socket.emit("joinedClassroom", classroomCode); // Notify the user that they joined successfully
  });

  // Helper function to ensure all x-values are unique
  function removeRedundantXValues(graphData) {
    const seenXValues = new Set();
    const uniqueLabels = [];
    const uniqueUserSteps = [];

    for (let i = 0; i < graphData.labels.length; i++) {
      const label = graphData.labels[i];
      const userStep = graphData.userSteps[i];

      if (!seenXValues.has(label)) {
        seenXValues.add(label);
        uniqueLabels.push(label);
        uniqueUserSteps.push(userStep);
      }
    }

    return {
      labels: uniqueLabels,
      userSteps: uniqueUserSteps,
    };
  }

  // Receive and broadcast graph data
  socket.on("sendGraphData", (data) => {
    const { classroomCode, graphData } = data; // Destructure data to get classroomCode and graphData
    if (classrooms[classroomCode]) {
      const uniqueGraphData = removeRedundantXValues(graphData);
      io.to(classroomCode).emit("receiveGraphData", uniqueGraphData);
      console.log("data sent to classroom");
    }
    console.log(classroomCode);
    console.log(graphData);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("Client disconnected");
    for (const [code, classroom] of Object.entries(classrooms)) {
      const index = classroom.users.indexOf(socket.id);
      if (index !== -1) {
        classroom.users.splice(index, 1);
        io.to(code).emit("classroomUpdate", classroom.users);
        break;
      }
    }
  });
});

server.listen(3000, () => {
  console.log("Server listening on port 3000");
});
