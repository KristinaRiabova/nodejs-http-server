const http = require('http');
const fs = require('fs');
const url = require('url');

const usersFile = 'users.json';

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  if (req.method === 'GET') {
    if (pathname === '/getUserList') {
      getUserList(res);
    } else if (pathname.startsWith('/getUserById')) {
      const userId = parseInt(parsedUrl.query.id);
      getUserById(res, userId);
    }
  } else if (req.method === 'POST') {
    if (pathname === '/createUser') {
      createUser(req, res);
    }
  } else if (req.method === 'PUT') {
    if (pathname.startsWith('/updateUser')) {
      const userId = parseInt(parsedUrl.query.id);
      updateUser(req, res, userId);
    }
  } else if (req.method === 'DELETE') {
    if (pathname.startsWith('/deleteUser')) {
      const userId = parseInt(parsedUrl.query.id);
      deleteUser(res, userId);
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

function getUserList(res) {
  const usersData = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(usersData.users));
}

function getUserById(res, userId) {
  const usersData = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
  const user = usersData.users.find((u) => u.id === userId);
  if (user) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(user));
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('User not found');
  }
}

function updateUser(req, res, userId) {
  let body = '';
  req.on('data', (chunk) => {
    body += chunk;
  });

  req.on('end', () => {
    const usersData = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
    const userIndex = usersData.users.findIndex((u) => u.id === userId);

    if (userIndex !== -1) {
      const updatedUserData = JSON.parse(body);
      usersData.users[userIndex] = { ...usersData.users[userIndex], ...updatedUserData };
      fs.writeFileSync(usersFile, JSON.stringify(usersData, null, 2));
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('User updated');
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('User not found');
    }
  });
}

function deleteUser(res, userId) {
  const usersData = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
  const userIndex = usersData.users.findIndex((u) => u.id === userId);

  if (userIndex !== -1) {
    const deletedUser = usersData.users.splice(userIndex, 1)[0];
    // Remove the deleted user from friends' lists
    usersData.users.forEach((user) => {
      user.friends = user.friends.filter((friendId) => friendId !== userId);
    });
    fs.writeFileSync(usersFile, JSON.stringify(usersData, null, 2));
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('User deleted');
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('User not found');
  }
}

function createUser(req, res) {
  let body = '';
  req.on('data', (chunk) => {
    body += chunk;
  });

  req.on('end', () => {
    const usersData = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
    const newUser = JSON.parse(body);
    newUser.id = usersData.users.length + 1;
    usersData.users.push(newUser);
    fs.writeFileSync(usersFile, JSON.stringify(usersData, null, 2));
    res.writeHead(201, { 'Content-Type': 'text/plain' });
    res.end('User created');
  });
}

const port = 3000;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
