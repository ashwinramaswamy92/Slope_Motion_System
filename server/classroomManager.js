const { v4: uuidv4 } = require('uuid');

class ClassroomManager {
  constructor() {
    this.classrooms = {};
    this.MAX_USERS = 10;
  }
  createClassroom() {
    const code = uuidv4().substring(0, 6);
    this.classrooms[code] = { users: [] };
    return code;
  }
  joinClassroom(code, socketId) {
    if (!this.classrooms[code]) throw new Error('Classroom not found');
    if (this.classrooms[code].users.length >= this.MAX_USERS) throw new Error('Classroom full');
    this.classrooms[code].users.push(socketId);
    return this.classrooms[code].users;
  }
  leaveClassroom(code, socketId) { /* ... */ }
  getClassroomUsers(code) { /* ... */ }
}

module.exports = new ClassroomManager();