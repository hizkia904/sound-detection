import { Server } from "socket.io";
import mqtt from "mqtt";
import { Client, LocalAuth } from "whatsapp-web.js";

export default async function handler(req, res) {
  const { id } = req.query;
  console.log(id);
  if (res.socket.server.io) {
    console.log("Socket is already running");
  } else {
    console.log("Socket is initializing");
    const io = new Server(res.socket.server);
    res.socket.server.io = io;

    io.of(`/mqtt_${id}`).on("connection", (socket) => {
      console.log("socket mqtt connected");

      const mqttClient = mqtt.connect("mqtt://test.mosquitto.org:1883");

      mqttClient.on("connect", () => {
        console.log("Connected to MQTT broker");
        socket.emit("ready", "ready");

        mqttClient.subscribe("suara/+");
      });
      socket.on("coba", () => {
        console.log("ini dari mqtt");
      });
      socket.on("a", () => {
        console.log("ini event a dari mqtt");
      });
      mqttClient.on("message", (topic, message) => {
        // console.log(message.toString());
        const value = parseFloat(message.toString());
        socket.emit("mqttMessage", { topic, value });
      });

      socket.on("disconnect", () => {
        console.log("a client mqtt has disconnect");
      });
    });

    io.of(`/wa_${id}`).on("connection", (socket) => {
      console.log("socket wa connected");

      const client = new Client({
        authStrategy: new LocalAuth({ clientId: id }),
        puppeteer: {
          headless: true,
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
          ],
        },
      });
      socket.on("send", async (param) => {
        let { hp, message } = param;
        hp = "62" + hp + "@c.us";
        try {
          await client.sendMessage(hp, message);
          socket.emit("display", {
            title: "Success",
            mess: `The message has been successfully sent to ${hp.substring(
              0,
              hp.length - 5
            )}`,
            typeOfMess: "success",
          });
        } catch (e) {
          socket.emit("display", {
            title: "Error",
            mess: `Failed to send message to ${hp.substring(0, hp.length - 5)}`,
            typeOfMess: "error",
          });
        }
      });

      socket.on("putus", async () => {
        await client.logout();
        socket.emit("logOut", "Log Out Succesfully!");
      });
      client.on("qr", (qr) => {
        socket.emit("qr", qr);
      });

      // client.on("change_state", (state) => {
      //   socket.emit("display", {
      //     title: "Change State",
      //     mess: state,
      //     typeOfMess: "success",
      //   });
      // });

      // client.on("auth_failure", (message) => {
      //   socket.emit("display", {
      //     title: "Auth Failure",
      //     mess: message,
      //     typeOfMess: "error",
      //   });
      // });

      // // client.on("change_battery", (battery_info) => {
      // //   socket.emit("display", {
      // //     title: "Change Battery",
      // //     mess: battery_info.battery + "",
      // //     typeOfMess: "warning",
      // //   });
      // // });

      // client.on("chat_archived", (chat, currState, prevState) => {
      //   socket.emit("display", {
      //     title: "Chat Archived",
      //     mess: chat.lastMessage.body,
      //     typeOfMess: "warning",
      //   });
      // });

      // client.on("chat_removed", (chat) => {
      //   socket.emit("display", {
      //     title: "Chat Removed",
      //     mess: chat.lastMessage.body,
      //     typeOfMess: "warning",
      //   });
      // });

      // client.on("contact_changed", () => {
      //   socket.emit("display", {
      //     title: "Contact Changed",
      //     mess: "Contact Changed",
      //     typeOfMess: "warning",
      //   });
      // });

      // client.on("message_ack", (message, ack) => {
      //   socket.emit("display", {
      //     title: "Message ACK",
      //     mess: message.ack,
      //     typeOfMess: "warning",
      //   });
      // });

      client.on("authenticated", (session) => {
        console.log("authenticated");
        socket.emit("display", {
          title: "Success",
          mess: "Authenticated",
          typeOfMess: "success",
        });
      });

      client.on("loading_screen", () => {
        console.log("loading");
        socket.emit("loading", "Loading....");
      });
      client.on("disconnected", (reason) => {
        console.log("WA LOG OUTTTT");
        console.log(client.info);
        console.log("WA disconnected because", reason);
        socket.emit("WADisconnected", "Whatsapp Disconnected!");
      });

      client.on("ready", async () => {
        console.log("Client is ready!");
        console.log(client.info);
        console.log(await client.getState());
        socket.emit("ready", client.info);
      });

      socket.on("disconnect", () => {
        console.log("a client wa has disconnect");
        client.destroy();
      });
      socket.on("coba", () => {
        console.log("ini dari wa");
      });
      socket.on("a", () => {
        console.log("ini event a dari wa");
      });

      client.initialize();
    });
  }
  res.end();
}
