var express = require('express');
var app = express();

var server = require('http').Server(app);
var io = require('socket.io')(server);
server.listen(process.env.PORT || 8000, function() {
    console.log("Server is listening at port " + process.env.PORT + "...");
});

app.get("/", function(req, res) {
    //res.sendFile(__dirname + "/demo.html");
	res.send("<h3>Welcome to my NodeJS server for project3</h3>");
});

var userMap = new Map();    // map này chứa những người đang online và đang vào mục forum. key = userId, value = socket.id;
var clientTyping = new Map();   // map này chứa danh sách những người đang gõ ở ô comment ở mỗi bài post. 
// clientTyping.get(8) = tập Set chứa nhưngnx người đang typing ở postId = 8
var currPostTyping;     // ID của post mà client này đang typing ở ô comment

io.on("connection", function(socket) {
    console.log(socket.id + " is connecting!");

    //Send a message after a timeout of 3 seconds
    setTimeout(function() {
        socket.send("Welcome you! This is just a test");
    }, 4000);

    // listen to events from client (from socket)
    socket.on("logined_user", function(data) {
        socket.username = data;
        userMap.set(data, socket.id);
        console.log("userMap = ");
        console.log(userMap);
        //io.sockets.emit("online_users", userMap);
    });

    socket.on("disconnect", function() {
        console.log(socket.id + " is disconnected!");
        userMap.delete(socket.username);
        console.log("userMap = ");
        console.log(userMap);
        stopTyping(socket, currPostTyping);
        // resend online users
        //socket.broadcast.emit("online_users", userMap);
    });

    socket.on("client_comments", function(data) {
        console.log(socket.username + " just comment at postId = " + data.postId + ", and content is: \"" + data.content + "\"");
        socket.broadcast.emit("someone_comments", data);
    });

    socket.on("client_typing", function(post_id) {
        if(socket.username == undefined) return;
        currPostTyping = post_id;

        if(clientTyping.get(post_id) == undefined) {
            var clientSet = new Set();
            clientSet.add(socket.username);
            clientTyping.set(post_id, clientSet);
        } else {
            clientTyping.set(post_id, (clientTyping.get(post_id)).add(socket.username));
        }

        socket.broadcast.emit("someone_is_typing", post_id);

        console.log("There are someone is typing in postId = " + post_id);
        console.log(clientTyping.get(post_id));
        console.log("clientTyping = "); console.log(clientTyping);
    });

    socket.on("client_stop_typing", function(post_id) {
        stopTyping(socket, post_id);
    });
});

function stopTyping(socket, post_id) {
    if(socket.username == undefined) return;

    var temp = clientTyping.get(post_id);
    if(temp == undefined || typeof temp == "boolean") return;
    console.log("temp = "); console.log(temp);
    temp.delete(socket.username);
    clientTyping.set(post_id, temp);

    if(temp.size == 0) {
        clientTyping.delete(post_id);
        console.log("There's no body is typing in postId = " + post_id);
        socket.broadcast.emit("noone_is_typing", post_id);
    }

    console.log("someone stop typing on postId = " + post_id);
    console.log(clientTyping.get(post_id));
    console.log("clientTyping = "); console.log(clientTyping);

    // if(clientTyping.get(post_id) == undefined) return;
    // clientTyping.set(post_id, (clientTyping.get(post_id)).delete(socket.username));
    // if(clientTyping.get(post_id).size == 0) {
    //     clientTyping.delete(post_id);
    //     console.log("There's no body is typing in postId = " + post_id);
    // }
}
// app.get("/", function(req, res) {
//     console.log("demo hehehe. This is root folder");
// });

// app.get("/project3/users", function() {
//     console.log("You're in /project3/users");
// });