// "Banco de dados" em memória
let users = [];
let projects = [];

// Helper functions
const findUserByEmail = (email) => {
  return users.find(user => user.email === email);
};

const findUserById = (id) => {
  return users.find(user => user.id === id);
};

const addUser = (user) => {
  users.push(user);
  return user;
};

const getAllUsers = () => {
  return users.map(user => {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  });
};

module.exports = {
  users,
  findUserByEmail,
  findUserById,
  addUser,
  getAllUsers
};