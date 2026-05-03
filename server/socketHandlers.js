// server/socketHandlers.js

const classroomManager = require('./classroomManager');
const { removeRedundantXValues } = require('./utils/dataUtils');

module.exports = (io, socket) => {
  let userData = {};

  socket.on('createClassroom', () => {
    const code = classroomManager.createClassroom();
    socket.join(code);
    classroomManager.joinClassroom(code, socket.id);
    socket.emit('classroomCreated', code);
  });

  socket.on('joinClassroom', (code) => {
    try {
      const users = classroomManager.joinClassroom(code, socket.id);
      socket.join(code);
      io.to(code).emit('classroomUpdate', users);
      socket.emit('joinedClassroom', code);
    } catch (err) {
      socket.emit('joinError', { message: err.message });
    }
  });

  socket.on('sendGraphData', ({ classroomCode, graphData }) => {
    const unique = removeRedundantXValues(graphData);
    io.to(classroomCode).emit('receiveGraphData', unique);
    userData[socket.id] = { user: socket.id, data: unique };
  });

  socket.on('requestAllData', () => {
    socket.emit('allDataResponse', Object.values(userData));
  });

  socket.on('clearData', () => { userData = {}; });

  socket.on('disconnect', () => {
    // remove from all classrooms
    Object.keys(classroomManager.classrooms).forEach(code => {
      classroomManager.leaveClassroom(code, socket.id);
    });
  });
};