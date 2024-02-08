const http = require('http');
const dotenv = require('dotenv');
const express = require('express');
const { randomUUID } = require('crypto'); // Added in: node v14.17.0
const rateLimit = require('express-rate-limit')
const cookieParser = require('cookie-parser');
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const requestIp = require("request-ip");
const { Server } = require("socket.io");
const path = require('path');
const fs = require('fs');
const { ErrorHandler } = require('./middlewares/ErrorHandler');
const getRegisteredUsers = require('./routes/api/getAllUsers');
//const { RegisteredUser } = require("./DB/MongoModels/RegisteredUserModel");
const { ChatMessage } = require("./DB/MongoModels/ChatMessageModel");
const { connectDB } = require("./DB/mongodb");
// Create the rate limit rule
const apiRequestLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30 // limit each IP to 30 requests per windowMs
})
dotenv.config({
  path: "./.env",
});
const UsersState = {
  dbConnected: false,
  users: [],
  setUsers: function (newUsersArray) {
    this.users = newUsersArray;
  },
  setDBConnected: function (isConnected) {
    this.dbConnected = isConnected;
  }
}
const savedUserlist = null;// temporary memory for saving userslist
async function getAllRegisteredUsers() {
  let allUsers;
  if (getRegisteredUsers) {
    if(savedUserlist && savedUserlist.length > 0){
      allUsers = savedUserlist;
    }else{
       allUsers = await getRegisteredUsers(UsersState.dbConnected);
   }

   //console.log("All users", allUsers);
    const userArray = [];
    allUsers?.forEach((user) => {
      let userStructure = {
        id: "",//blank socket id
        name: user.username,
        fullName :user.firstName + " " + user.lastName,
        status: "Offline",
        loginTime: "",
        image: user.image || "",
        chatNotification: 0
      };
      userArray.push(userStructure);
    });
    UsersState.setUsers(userArray);
    // return users;
  }
}
getAllRegisteredUsers();
const app = express();
//app.set('UsersState', UsersState);//setting variable to access usersstate inside router
app.use(express.json());
app.use(express.static("express"));
app.use(apiRequestLimiter);
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "https:rameshdataprovider.onrender.com");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE");
  next();
});
// global middlewares
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(cookieParser());
// required for passport
app.use(
  session({
    secret: process.env.EXPRESS_SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
  })
); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions

// default URL for website
app.all('*', function (req, res, next) {
  
  console.log("170", req.hostname, req.ip , req.path);

  next();
});
app.use("/serverstatus", function(req,res){
  res.send(UsersState);
})
app.use("/products", require('./routes/api/products'));
app.use("/countries", require('./routes/api/getCountries'));
app.use("/users", require('./routes/api/users'));
app.use("/realusers", require('./routes/api/registeredUsers')(UsersState));
app.use("/settings", require('./routes/api/UserSettings'));
app.use("/todolist", require('./routes/api/todoList'));
app.use("/news", require('./FromRAPIDAPI/newsprovider'));

app.use(ErrorHandler);

const httpServer = http.createServer(app);
const port = process.env.PORT || 3001;


//console.log("PORT=", process.env.PORT, "DB_URL : ", process.env.MONGODB_URI);
// httpServer.listen(port);
// console.debug('Server listening on port ' + port);

/**
 * Starting from Node.js v14 top-level await is available and it is only available in ES modules.
 * This means you can not use it with common js modules or Node version < 14.
 */
const majorNodeVersion = +process.env.NODE_VERSION?.split(".")[0] || 0;

// const startServer = () => {
//   httpServer.listen(process.env.PORT || 8080, () => {
//     console.info(
//       `📑 Visit the documentation at: http://localhost:${
//         process.env.PORT || 8080
//       }`
//     );
//     console.log("⚙️  Server is running on port: " + process.env.PORT);
//   });
// };

if (majorNodeVersion >= 14) {
  try {
    console.log("trying to connect to Mongoose");
    connectDB().then((dbConnected) => {
      console.log("Return from connection DB", dbConnected);
      httpServer.listen(port);
      UsersState.setDBConnected(dbConnected);
      console.debug('Server listening on port ' + port);
      getAllRegisteredUsers();
    }).catch((e) => {
      console.log("Error is here 126");
      console.log(e);
    })
  } catch (err) {
    console.log("Error is here 130");
    console.log("Mongo db connect error: ", err);
  }
} else {
  connectDB()
    .then(() => {
      httpServer.listen(port);
      console.debug('Server listening on port ' + port);
      getAllRegisteredUsers();
    })
    .catch((err) => {
      console.log("Mongo db connect error: ", err);
    });
}
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === "production" ? false : ["http://localhost:3000", "http://127.0.0.1:3000"]
  }
})
var chatController = require('./SocketControllers/chatController');

var chat = io
  .of('/chat')
  .on('connection', function (socket) {
    console.log(`User ${socket.id} connected`);
    socket.on('getOnline', ({ name, loginTime, image }) => {
      //leave previous room
      console.log("User joined chat");
      const user = activateUser(socket.id, name, loginTime, image);
      //Join room
      socket.join("chatroom");
      //To user who joined
      socket.emit('message', buildMsg("Admin", `You are online ,with socket id : ${socket.id}`));

      socket.emit('loggedInUserDetail', user);
    //  console.log("trigger user list");
      socket.emit('userlist', {
  
        users: getUsersInRoom(user)
      });
      sendChatMessagesFromServer(socket, name);
      //socket.emit('receiveChatMessage')
      //console.log("send all user notification that new user has joined", user)
      socket.broadcast.to("chatroom").emit('newUserJoined', user);
      //to Every one else
      socket.broadcast.to("chatroom").emit('message', buildMsg("Admin", `${user.name} is online`));

    })
    socket.on('getOnlineUsers', (event) => {
      //leave previous room
      //   console.log(event);
      console.log("Fetching online users");
      //    const user = activateUser(socket.id, userName);
      //Join room
      // socket.join("chatroom");
      //To user who joined
      //socket.emit('message', buildMsg(ADMIN, `You are online`));
      socket.emit('userlist', {
        users: getUsersInRoom()
      });
      //to Every one else
      // socket.broadcast.to("chatroom").emit('message', buildMsg(ADMIN, `${user.name} is online`));

    })
    //When user disconnects - to all Others
    socket.on('disconnect', () => {
      const user = getUser(socket.id);
      userLeavesApp(socket.id)
      //  socket.broadcast.emit('message', `User ${socket.id.substring(0,10)} disconnected`);
      if (user) {
        socket.broadcast.to("chatroom").emit('useroffline', buildDisconnectMsg("Admin", `${user.name}`));
        socket.broadcast.to("chatroom").emit('userList', {
          users: getUsersInRoom()
        });
        // io.emit('roomList', {
        //     rooms: getAllActiveRooms()
        // })

      }
      console.log(`User ${socket.id} disconnected`);
    });
    socket.on('adminNotification',({notification})=>{
      const user = getUser(socket.id);
      console.log("Admin User", user);
      //check if User have Admin authorization later
      console.log("Notificaiton to be triggered", notification);
      notification.id= randomUUID();
      socket.broadcast.emit('NotificationFromAdmin', notification);
    })
    //Listening for a message  event
    socket.on('message', ({ name, text }) => {
      // console.log(data);
      // const room = getUser(socket.id)?.room;
      // if (room) {
      io.to("chatroom").emit('message', buildMsg(name, text))
      //}
      //  io.emit('message',`${socket.id.substring(0,10)} : ${name}`);
    }
    );
    socket.on("chatMessage", async (chatData) => {
      const { sender, receiver, currentMessage } = chatData;
      console.log(sender, receiver, currentMessage);
      //find socketid of the receiver;



      // const existedChat = await ChatMessage.findOne({
      //   $and: [{ sender }, { receiver }],
      // }).exec();

      if(UsersState.dbConnected){
        //Save chats only if DB is connected
     
      const savedChat = await ChatMessage.create({
        sender,
        receiver,
        content: currentMessage,
      });
      console.log("Chat saving", savedChat);
   

      const receiverDetail = UsersState.users.find((user) => (user.name === receiver));
      console.log("Receiver Detail", receiverDetail?.id);
      socket.emit("newChatMessageRecieved", savedChat); //send back own message to user
      if (receiverDetail && receiverDetail.id) {
        socket.to(receiverDetail.id).emit("newChatMessageRecieved", savedChat); // sending message at receiver socket
      }
 }

    });
    socket.on('fetchUserChat', async ({ currentUser, chatUser }) => {
      //fetching chat history between currentUser and Chat User
      let chatsWithUser = [];
      if(UsersState.dbConnected){
      const existedCurrentUserChat = await ChatMessage.find({
        $or: [{ sender: currentUser }, { receiver: currentUser }]
      }).exec();
       chatsWithUser = existedCurrentUserChat.filter((chatItem) => {
        if (chatItem.sender === chatUser || chatItem.receiver === chatUser) {
          return chatItem;
        }
      })
    }
    //  console.log(`Existing Chat betwenn ${currentUser} and ${chatUser}`, chatsWithUser);
      socket.emit('chatHistoryLoad', { oldChat: chatsWithUser, currentUser: currentUser, chatUser: chatUser });

    });
    //Listen for activity
    socket.on('activity', (name) => {
      const room = getUser(socket.id)?.room;
      //  socket.broadcast.emit('activity',name);
      if (room) {
        socket.broadcast.to(room).emit('activity', name)
      }
    });
    socket.on('typingEvent', ({ sender, receiver }) => {
      console.log(sender, " typing event to ", receiver);
      const foundUser = UsersState.users.find((user) => user.name === receiver);
      console.log("foundUser", foundUser)
      socket.to(foundUser.id).emit("chatUserTyping", ({ sender, receiver }));
    })

    async function sendChatMessagesFromServer(socket, currentUser) {
      if(UsersState.dbConnected){
      const existedChat = await ChatMessage.find({
        $or: [{ sender: currentUser }, { receiver: currentUser }],
      }).exec();
     // console.log("Existing Chat", existedChat);
      socket.emit('receiveChatMessage', existedChat);}
      else{
        socket.emit('receiveChatMessage', []);
      }
    }
    function buildMsg(name, text) {
      return {
        name,
        text,
        time: new Intl.DateTimeFormat('default', {
          hour: "numeric",
          minute: "numeric",
          second: "numeric"
        }).format(new Date())
      }
    }
    function buildDisconnectMsg(sender, username) {
      return {
        sender: sender,
        name: username,
        status: "Offline",
        message: username + " have left chat",
        time: new Intl.DateTimeFormat('default', {
          hour: "numeric",
          minute: "numeric",
          second: "numeric"
        }).format(new Date())

      }
    }
    //User functions
    function activateUser(id, userName, loginTime, image) {
      const user = { id, name: userName, status: "Online", loginTime: loginTime, image: image, chatNotification: 0 };
      const changedUsers = UsersState.users.map((oldUser) => {
        if (oldUser.name === userName) {
          oldUser.id = id;
          oldUser.loginTime = loginTime,
          //  oldUser.image = image;
          oldUser.status = "Online";
          return oldUser;
        } else {
          return oldUser;
        }
      });
      UsersState.setUsers(changedUsers);
      // UsersState.setUsers([
      //   ...UsersState.users.filter(user => user.id !== id), user
      // ]);
      return user;
    }
    function userLeavesApp(id) {
      UsersState.setUsers(
        UsersState.users.map((user) => {
          if (user.id === id) {
            user.status = "Offline";
            user.id === "";
          }
          return user;
        })
      )
    }
    function getUser(id) {
      return UsersState.users.find(user => user.id === id)
    }

   function  getUsersInRoom(currentUser) {
      // if (currentUser) {
      //   return UsersState.users.filter((user) => user.name != currentUser.name);
      // }
      // getAllRegisteredUsers();
    
      return UsersState.users;
    }

  });

