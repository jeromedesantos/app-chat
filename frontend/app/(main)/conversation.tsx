import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Image } from "expo-image";
import ScreenWrapper from "@/components/ScreenWrapper";
import { colors, radius, spacingX, spacingY } from "@/constants/theme";
import Typo from "@/components/Typo";
import { useLocalSearchParams } from "expo-router";
import { useAuth } from "@/contexts/authContext";
import { scale, verticalScale } from "@/utils/styling";
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Backbutton from "@/components/Backbutton";
import Avatar from "@/components/Avatar";
import * as Icons from "phosphor-react-native";
import * as ImagePicker from "expo-image-picker";
import MessageItem from "@/components/MessageItem";
import Input from "@/components/Input";
import Loading from "@/components/Loading";
import { uploadFileToCloudinary } from "@/services/imageService";
import { newMessage, getMessages } from "@/socket/socketEvents";
import { MessageProps, ResponseProps } from "@/types";

const Conversation = () => {
  const { user: currentUser } = useAuth();

  const {
    id: conversationId,
    name,
    participants: stringifiedParticipants,
    avatar,
    type,
  } = useLocalSearchParams();

  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<{ uri: string } | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<MessageProps[]>([]);

  const participants = JSON.parse(stringifiedParticipants as string);

  let conversationAvatar = avatar;
  let isDirect = type === "direct";
  const otherParticipant = isDirect
    ? participants.find((p: any) => p._id !== currentUser?.id)
    : null;

  if (isDirect && otherParticipant)
    conversationAvatar = otherParticipant.avatar;

  let conversationName = isDirect ? otherParticipant?.name : name;

  // console.log("got conversation data: ", data);

  useEffect(() => {
    newMessage(newMessageHandler);
    getMessages(messagesHandler);

    getMessages({
      conversationId,
    });

    return () => {
      newMessage(newMessageHandler, true);
      getMessages(messagesHandler, true);
    };
  }, []);

  const newMessageHandler = (res: ResponseProps) => {
    setLoading(false);
    if (res.success) {
      if (res.data.conversationId === conversationId) {
        setMessages((prev) => [res.data as MessageProps, ...prev]);
      }
    } else {
      Alert.alert("Error", res.msg);
    }
    // console.log("git new message response: ", res)
  };

  const messagesHandler = (res: ResponseProps) => {
    if (res.success) setMessages(res.data);
  };

  // const dummyMessages = [
  //   {
  //     id: "msg_10",
  //     sender: {
  //       id: "user_1",
  //       name: "John Doe",
  //       avatar: null,
  //     },
  //     content: "Mantap, tadi presentasinya lancar banget 🔥",
  //     createdAt: "11:02 AM",
  //     isMe: false,
  //   },
  //   {
  //     id: "msg_9",
  //     sender: {
  //       id: "me",
  //       name: "You",
  //       avatar: null,
  //     },
  //     content: "Syukurrr 😄 Makasih ya udah bantu cek slide semalam.",
  //     createdAt: "11:00 AM",
  //     isMe: true,
  //   },
  //   {
  //     id: "msg_8",
  //     sender: {
  //       id: "user_1",
  //       name: "John Doe",
  //       avatar: null,
  //     },
  //     content: "Keren! Aku suka bagian demo realtime-nya.",
  //     createdAt: "10:58 AM",
  //     isMe: false,
  //   },
  //   {
  //     id: "msg_7",
  //     sender: {
  //       id: "me",
  //       name: "You",
  //       avatar: null,
  //     },
  //     content: "Finally selesai juga. Kamu lagi di kantor atau WFH?",
  //     createdAt: "10:55 AM",
  //     isMe: true,
  //   },
  //   {
  //     id: "msg_6",
  //     sender: {
  //       id: "user_1",
  //       name: "John Doe",
  //       avatar: null,
  //     },
  //     content: "WFH hari ini. Nanti sore mau ngopi?",
  //     createdAt: "10:53 AM",
  //     isMe: false,
  //   },
  //   {
  //     id: "msg_5",
  //     sender: {
  //       id: "me",
  //       name: "You",
  //       avatar: null,
  //     },
  //     content: "Gas! Jam 4 di tempat biasa?",
  //     createdAt: "10:51 AM",
  //     isMe: true,
  //   },
  //   {
  //     id: "msg_4",
  //     sender: {
  //       id: "user_1",
  //       name: "John Doe",
  //       avatar: null,
  //     },
  //     content: "Sip, aku booking meja pojok ya.",
  //     createdAt: "10:49 AM",
  //     isMe: false,
  //   },
  //   {
  //     id: "msg_3",
  //     sender: {
  //       id: "me",
  //       name: "You",
  //       avatar: null,
  //     },
  //     content: "Deal. Sekalian bahas ide fitur chat yang kemarin.",
  //     createdAt: "10:47 AM",
  //     isMe: true,
  //   },
  //   {
  //     id: "msg_2",
  //     sender: {
  //       id: "user_1",
  //       name: "John Doe",
  //       avatar: null,
  //     },
  //     content: "Siap boss 💻",
  //     createdAt: "10:45 AM",
  //     isMe: false,
  //   },
  //   {
  //     id: "msg_1",
  //     sender: {
  //       id: "me",
  //       name: "You",
  //       avatar: null,
  //     },
  //     content: "Let's go!",
  //     createdAt: "10:44 AM",
  //     isMe: true,
  //   },
  // ];

  const onPickFile = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });

    if (!result.canceled) {
      setSelectedFile(result.assets[0]);
    }
  };

  const onSend = async () => {
    if (!message.trim() && !selectedFile) return;
    if (!currentUser) return;
    setLoading(true);

    try {
      let attachment = null;
      if (selectedFile) {
        const uploadResult = await uploadFileToCloudinary(
          selectedFile,
          "message-attachments",
        );

        if (uploadResult.success) {
          attachment = uploadResult.data;
        } else {
          setLoading(false);
          Alert.alert("Error", "Could not send the image!");
          return;
        }
      }

      newMessage({
        conversationId,
        sender: {
          id: currentUser.id,
          name: currentUser.name,
          avatar: currentUser.avatar,
        },
        content: message.trim(),
        attachment,
      });

      setMessage("");
      setSelectedFile(null);
    } catch (error: any) {
      console.log("Error sending message: ", error);
      Alert.alert("Error", "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper showPattern={true} bgOpacity={0.5}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        {/* header */}
        <Header
          style={styles.header}
          leftIcon={
            <View style={styles.headerLeft}>
              <Backbutton />
              <Avatar
                size={40}
                uri={conversationAvatar as string}
                isGroup={type === "group"}
              />
              <Typo color={colors.white} fontWeight={"500"} size={22}>
                {conversationName}
              </Typo>
            </View>
          }
          rightIcon={
            <TouchableOpacity style={{ marginBottom: verticalScale(7) }}>
              <Icons.DotsThreeOutlineVertical
                weight="fill"
                color={colors.white}
              />
            </TouchableOpacity>
          }
        />
        {/* messages */}
        <View style={styles.content}>
          <FlatList
            data={messages}
            inverted={true}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.messagesContent}
            renderItem={({ item }) => (
              <MessageItem item={item} isDirect={isDirect} />
            )}
            keyExtractor={(item) => item.id}
          />
          <View style={styles.footer}>
            <Input
              value={message}
              onChangeText={setMessage}
              containerStyle={{
                paddingLeft: spacingX._10,
                paddingRight: scale(65),
                borderWidth: 0,
              }}
              placeholder="Type message"
              icon={
                <TouchableOpacity style={styles.inputIcon} onPress={onPickFile}>
                  <Icons.Plus
                    color={colors.black}
                    weight="bold"
                    size={verticalScale(22)}
                  />
                  {selectedFile && selectedFile.uri && (
                    <Image
                      source={selectedFile.uri}
                      style={styles.selectedFile}
                    />
                  )}
                </TouchableOpacity>
              }
            />
            <View style={styles.inputRightIcon}>
              <TouchableOpacity style={styles.inputIcon} onPress={onSend}>
                {loading ? (
                  <Loading size="small" color={colors.black} />
                ) : (
                  <Icons.PaperPlaneTilt
                    color={colors.black}
                    weight="fill"
                    size={verticalScale(22)}
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

export default Conversation;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacingX._15,
    paddingTop: spacingY._10,
    paddingBottom: spacingY._15,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacingX._12,
  },
  inputRightIcon: {
    position: "absolute",
    right: scale(10),
    top: verticalScale(12),
    paddingLeft: spacingX._12,
    borderLeftWidth: 1.5,
    borderLeftColor: colors.neutral300,
  },
  selectedFile: {
    position: "absolute",
    height: verticalScale(38),
    width: verticalScale(38),
    borderRadius: radius.full,
    alignSelf: "center",
  },
  content: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: radius._50,
    borderTopRightRadius: radius._50,
    borderCurve: "continuous",
    overflow: "hidden",
    paddingHorizontal: spacingX._20,
  },
  inputIcon: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    padding: 8,
  },
  footer: {
    paddingTop: spacingY._7,
    paddingBottom: verticalScale(22),
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    // padding: spacingX._15,
    paddingTop: spacingY._20,
    paddingBottom: spacingY._10,
    gap: spacingY._12,
  },
  plusIcon: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    padding: 8,
  },
});
