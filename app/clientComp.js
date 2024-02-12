"use client";
import { useEffect, useState } from "react";
import styles from "./page.module.css";
import {
  Alert,
  Avatar,
  Button,
  Card,
  Collapse,
  Divider,
  Drawer,
  FloatButton,
  Input,
  InputNumber,
  Layout,
  List,
  QRCode,
  Radio,
  Space,
  Spin,
  Statistic,
  Tooltip,
  Typography,
  notification,
} from "antd";
import {
  CloseCircleFilled,
  LogoutOutlined,
  PlayCircleFilled,
  QuestionCircleOutlined,
  SendOutlined,
  WhatsAppOutlined,
} from "@ant-design/icons";
import { Bar, Line } from "react-chartjs-2";
import { Chart, registerables } from "chart.js";
import io from "socket.io-client";
import { bikinCookie } from "./action";
const { Content } = Layout;
const { Title, Text } = Typography;
const { Group, Button: RadioButton } = Radio;

Chart.register(...registerables);

let ioMqtt;
let ioWA;
export default function Home({ id }) {
  useEffect(() => {
    removeWA();
    socketInitializer();
  }, []);

  const removeWA = async () => {
    ioMqtt?.disconnect();
    ioWA?.disconnect();
  };

  const socketInitializer = async () => {
    console.log("jalanin socket initializer");
    if (id === undefined) {
      id = await bikinCookie();
    }

    const data = {
      id: id,
    };
    await fetch(`/api/socket`, {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
      },
    });
    ioMqtt = io("/mqtt");
    ioMqtt.on("ready", () => {
      setMQTTConnected(true);
    });
    initializeWASocket();
  };
  const initializeWASocket = () => {
    ioWA = io("/wa");
    ioWA.on("qr", (qr) => {
      setQr(qr);
      setReady(false);
      setStatusQr("active");
      setLoadingDrawer(false);
    });
    ioWA.on("display", (arg) => {
      const { typeOfMess, title, mess } = arg;
      openNotificationWithIcon(typeOfMess, title, mess);
    });
    ioWA.on("ready", (arg) => {
      const loginData = { hp: arg.wid.user, name: arg.pushname };
      setLoginData([loginData]);
      setReady(true);
      setLoadingDrawer(false);
    });
    ioWA.on("loading", () => {
      setLoadingDrawer(true);
    });
    ioWA.on("logOut", async (arg) => {
      openNotificationWithIcon("warning", "Log Out", arg);
      ioWA.disconnect();
      initializeWASocket();
    });
    ioWA.on("WADisconnected", (arg) => {
      openNotificationWithIcon("warning", "Disconnected", arg);
      ioWA.disconnect();
      initializeWASocket();
    });
  };

  const [typeChart, setTypeChart] = useState("line");

  const [data, setData] = useState({
    labels: [],
    datasets: [{ label: "Suara", data: [] }],
  });

  const arr1 = [];
  const arr2 = [];

  const [limit, setLimit] = useState(30);

  const [analogValue, setAnalogValue] = useState(0);

  const [minValue, setMinValue] = useState(0);

  let minValueComparison = Number.MAX_VALUE;

  const [maxValue, setMaxValue] = useState(0);

  let maxValueComparison = 0;

  const [avgValue, setAvgValue] = useState(0);

  let sumForAvg = 0;

  let jumlahUntukAvg = 0;

  const [isStarting, setStarting] = useState(false);

  const callBack = (message) => {
    console.log(message);
    let dataBaru = { ...data };
    if (message.value !== null && !isNaN(message.value)) {
      if (dataBaru.labels.length >= 50) {
        dataBaru.labels.shift();
        dataBaru.datasets[0].data.shift();
      }
      if (message.value >= limit) {
        const inputHP = hp;
        ioWA.emit("send", {
          hp: inputHP,
          message: `*Warning!!!*\nSensor detected sound level above or equal to ${limit}.\nSound detected at level ${message.value}`,
        });
      }
      if (message.value > maxValueComparison) {
        console.log(message.value + " lebih besar dari " + maxValueComparison);
        maxValueComparison = message.value;
        setMaxValue(message.value);
      }
      if (message.value < minValueComparison) {
        console.log(message.value + " kurang dari " + minValueComparison);
        minValueComparison = message.value;
        setMinValue(message.value);
      }
      sumForAvg += message.value;
      jumlahUntukAvg += 1;
      const hasilAvg = sumForAvg / jumlahUntukAvg;
      setAvgValue(hasilAvg.toFixed(2));
      dataBaru.labels.push(new Date().toLocaleTimeString());
      dataBaru.datasets[0].data.push(message.value);
      setData(dataBaru);
      setAnalogValue(message.value);
    }
  };

  const openNotificationWithIcon = (type, message, description) => {
    api[type]({ message, description, placement: "top" });
  };

  const [api, contextHolder] = notification.useNotification();

  const onClickFloatButton = () => {
    if (isStarting) {
      ioMqtt.off();
      openNotificationWithIcon("warning", "Success", "Stop Detecting Sound");
    } else {
      minValueComparison = Number.MAX_VALUE;
      maxValueComparison = 0;
      setMaxValue(0);
      setMinValue(0);
      setAnalogValue(0);
      data.labels.splice(0, data.labels.length);
      data.datasets[0].data.splice(0, data.datasets[0].data.length);

      ioMqtt.on("mqttMessage", callBack);
      openNotificationWithIcon("success", "Success", "Start Detecting Sound");
    }
    setStarting(!isStarting);
  };

  const [hp, setHp] = useState("");

  const [hpExample, setHpExample] = useState("");

  const [exampleMessage, setExampleMessage] = useState("");

  const logOutWA = async () => {
    await ioWA.emit("putus", "Log Out");
  };

  const [qr, setQr] = useState("aaaa");
  const [statusQR, setStatusQr] = useState("loading");
  const [ready, setReady] = useState(false);
  const [mqttConnected, setMQTTConnected] = useState(false);
  const [loginData, setLoginData] = useState([{ hp: "", name: "" }]);
  const [open, setOpen] = useState(false);
  const showDrawer = () => {
    setOpen(true);
  };
  const onClose = () => {
    setOpen(false);
  };
  const [loadingDrawer, setLoadingDrawer] = useState(false);
  const text = `
  You can use your own whatsapp account to send message to other
  when the sensor detect sound level above the threshold you set
`;
  const trySendMessage = (
    <>
      <Space direction="vertical">
        <InputNumber
          addonBefore="+62"
          value={hpExample}
          onChange={(value) => setHpExample(value)}
          controls={false}
        />
        <Input
          value={exampleMessage}
          onChange={(event) => setExampleMessage(event.target.value)}
        />
        <Button
          icon={<SendOutlined />}
          onClick={() => {
            console.log(ioWA);
            ioWA.emit("send", { hp: hpExample, message: exampleMessage });
          }}
        >
          Send Message
        </Button>
      </Space>
    </>
  );

  return (
    <>
      {contextHolder}
      <Layout>
        <Content className={styles.content}>
          <Space className={styles.space} direction="horizontal">
            <Title style={{ color: "#1677ff" }}>Sound Detection</Title>
          </Space>
          <Space className={styles.space} direction="horizontal">
            <Typography.Text strong>Type Of Chart :</Typography.Text>
            <Group
              value={typeChart}
              size="large"
              onChange={(e) => setTypeChart(e.target.value)}
            >
              <RadioButton value="line">Line</RadioButton>
              <RadioButton value="bar">Bar</RadioButton>
            </Group>
          </Space>

          <Space className={styles.space2}>
            <Button
              icon={<WhatsAppOutlined />}
              type="primary"
              onClick={showDrawer}
              disabled={isStarting}
            >
              Wanna use Whatsapp ?
            </Button>
          </Space>
          <Space size={100} className={styles.space3} direction="horizontal">
            <Card style={{ borderColor: "#1677ff" }} bordered={true}>
              <Statistic
                title="Min Analog Value"
                value={minValue}
                valueStyle={{ textAlign: "center" }}
              />
            </Card>
            <Card style={{ borderColor: "#1677ff" }} bordered={true}>
              <Statistic
                title="Analog Value"
                value={analogValue}
                valueStyle={{ textAlign: "center" }}
              />
            </Card>
            <Card style={{ borderColor: "#1677ff" }} bordered={true}>
              <Statistic
                title="Average Analog Value"
                value={avgValue}
                valueStyle={{ textAlign: "center" }}
              />
            </Card>
            <Card style={{ borderColor: "#1677ff" }} bordered={true}>
              <Statistic
                title="Max Analog Value"
                value={maxValue}
                valueStyle={{ textAlign: "center" }}
              />
            </Card>
          </Space>

          <div className={styles.div}>
            {typeChart === "line" ? (
              <Line
                data={data}
                options={{
                  plugins: {
                    title: {
                      display: true,
                      text: "Deteksi Suara",
                    },
                  },
                  responsive: true,
                  maintainAspectRatio: false,
                  borderColor: "#1677ff",
                }}
              />
            ) : (
              <Bar
                data={data}
                options={{
                  plugins: {
                    title: { display: true, text: "Deteksi Suara" },
                  },

                  responsive: true,
                  maintainAspectRatio: false,
                  borderColor: "#1677ff",
                  backgroundColor: "#1677ff",
                }}
              />
            )}
          </div>
          {mqttConnected === true && ready === true ? (
            <FloatButton
              tooltip={
                isStarting ? "Stop Sound Detection" : "Start Sound Detection"
              }
              icon={
                isStarting ? (
                  <CloseCircleFilled style={{ color: "red" }} />
                ) : (
                  <PlayCircleFilled />
                )
              }
              type={isStarting ? "default" : "primary"}
              style={{ right: 24, width: "50px", height: "50px" }}
              onClick={onClickFloatButton}
            />
          ) : undefined}
          <Drawer
            title={
              <>
                <Space>
                  <WhatsAppOutlined style={{ color: "green" }} /> Whatsapp
                  <Tooltip title={text} color="green">
                    <Button icon={<QuestionCircleOutlined />} shape="circle" />
                  </Tooltip>
                </Space>
              </>
            }
            placement="right"
            onClose={onClose}
            open={open}
          >
            <Spin spinning={loadingDrawer} size="large">
              {ready === true ? (
                <Alert
                  message="Success"
                  description="Whatsapp is ready !"
                  type="success"
                  showIcon
                />
              ) : (
                <Alert
                  message="Error"
                  type="error"
                  description="Whatsapp is not ready ! Scan the QR"
                  showIcon
                />
              )}

              {ready === false ? (
                <>
                  <Space direction="vertical" style={{ marginTop: "10px" }}>
                    <Title level={3}>QR</Title>

                    <QRCode value={qr} status={statusQR} />
                  </Space>
                </>
              ) : (
                <>
                  <Space
                    direction="vertical"
                    style={{ marginTop: "10px", width: "100%" }}
                  >
                    <Title level={3}>Sender Account</Title>
                    <List
                      itemLayout="horizontal"
                      dataSource={loginData}
                      renderItem={(item, index) => (
                        <List.Item>
                          <List.Item.Meta
                            avatar={
                              <Avatar
                                src={`https://api.dicebear.com/7.x/miniavs/svg?seed=${1}`}
                              />
                            }
                            title={
                              <Typography.Text strong>
                                {item.name}
                              </Typography.Text>
                            }
                            description={`+${item.hp}`}
                          />
                        </List.Item>
                      )}
                    />
                    <Space
                      style={{ width: "100%", justifyContent: "center" }}
                      direction="horizontal"
                    >
                      <Button
                        icon={<LogoutOutlined />}
                        danger
                        type="primary"
                        onClick={logOutWA}
                      >
                        Log Out
                      </Button>
                    </Space>

                    <Collapse
                      items={[
                        {
                          key: "1",
                          label: (
                            <Typography.Text strong>
                              Wanna Try Send Message ?
                            </Typography.Text>
                          ),
                          children: trySendMessage,
                        },
                      ]}
                    />
                  </Space>
                </>
              )}

              {ready === false ? undefined : (
                <>
                  <Divider />
                  <Space direction="vertical">
                    <Text>Send Message to</Text>
                    <InputNumber
                      addonBefore="+62"
                      value={hp}
                      onChange={(value) => setHp(value)}
                      controls={false}
                    />
                    <Text>when sensor detected sound level above </Text>
                    <InputNumber
                      value={limit}
                      onChange={(value) => setLimit(value)}
                      step={10}
                    />
                  </Space>
                </>
              )}
            </Spin>
          </Drawer>
        </Content>
      </Layout>
    </>
  );
}
