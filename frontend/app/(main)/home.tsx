import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import * as Icons from "phosphor-react-native";
import { colors, radius, spacingX, spacingY } from "@/constants/theme";
import { useAuth } from "@/contexts/authContext";
import {
  getConversations,
  newConversation,
  newMessage,
  testSocket,
} from "@/socket/socketEvents";
import { verticalScale } from "@/utils/styling";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import ConversationItem from "@/components/ConversationItem";
import Loading from "@/components/Loading";
import Button from "@/components/Button";
import { ConversationProps, ResponseProps } from "@/types";

const Home = () => {
  const { user: currentUser, signOut } = useAuth();
  const router = useRouter();

  const [selectedTab, setSelectedTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState<ConversationProps[]>([]);

  useEffect(() => {
    getConversations(processConversations);
    newConversation(newConversationHandler);
    newMessage(newMessageHandler);

    getConversations(null);

    return () => {
      getConversations(processConversations, true);
      newConversation(newConversationHandler, true);
      newMessage(newMessageHandler, true);
    };
  }, []);

  const newMessageHandler = (res: ResponseProps) => {
    if (res.success) {
      let conversationId = res.data.conversationId;
      setConversations((prev) => {
        let updatedConversations = prev.map((item) => {
          if (item._id === conversationId) item.lastMessage = res.data;
          return item;
        });

        return updatedConversations;
      });
    }
  };

  const processConversations = (res: ResponseProps) => {
    // console.log("res: ", res);
    if (res.success) {
      setConversations(res.data);
    }
  };

  const newConversationHandler = (res: ResponseProps) => {
    if (res.success && res.data.isNew) {
      setConversations((prev) => [...prev, res.data]);
    }
  };
  // console.log("User data:", user);

  // useEffect(() => {
  //   testSocket(testSocketCallbackHandler);
  //   testSocket(null);

  //   return () => {
  //     testSocket(testSocketCallbackHandler, true);
  //   };
  // }, []);

  // function testSocketCallbackHandler(data: any) {
  //   console.log("got response from testSocket event: ", data);
  // }

  const handleLogout = async () => {
    await signOut();
  };

  // const conversations = [
  //   {
  //     name: "Volksen",
  //     type: "direct",
  //     lastMessage: {
  //       senderName: "Volksen",
  //       content: "Guten Morgen",
  //       createdAt: "2025-06-23T09:30:00Z",
  //     },
  //   },
  //   {
  //     name: "Jerome",
  //     type: "direct",
  //     lastMessage: {
  //       senderName: "Jerome",
  //       content: "Hallo! Wie geht es dir?",
  //       createdAt: "2025-06-23T07:50:00Z",
  //     },
  //   },
  //   {
  //     name: "Volksen",
  //     type: "direct",
  //     lastMessage: {
  //       senderName: "Volksen",
  //       content: "Mir geht's gut",
  //       createdAt: "2025-06-23T07:50:00Z",
  //     },
  //   },
  //   {
  //     name: "React Native Group",
  //     type: "group",
  //     lastMessage: {
  //       senderName: "Admin",
  //       content: "New update available!",
  //       createdAt: "2025-06-23T06:15:00Z",
  //     },
  //   },
  //   {
  //     name: "Design Team",
  //     type: "group",
  //     lastMessage: {
  //       senderName: "Sarah",
  //       content: "Check out the new mockups",
  //       createdAt: "2025-06-23T05:45:00Z",
  //     },
  //   },
  //   {
  //     name: "Project Alpha",
  //     type: "group",
  //     lastMessage: {
  //       senderName: "Mike",
  //       content: "Let's schedule a meeting",
  //       createdAt: "2025-06-23T04:20:00Z",
  //     },
  //   },
  // ];

  let directConversations = conversations
    .filter((item: ConversationProps) => item.type === "direct")
    .sort((a: ConversationProps, b: ConversationProps) => {
      const aDate = a?.lastMessage?.createdAt || a.createdAt;
      const bDate = b?.lastMessage?.createdAt || b.createdAt;
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    });

  let groupConversations = conversations
    .filter((item: ConversationProps) => item.type === "group")
    .sort((a: ConversationProps, b: ConversationProps) => {
      const aDate = a?.lastMessage?.createdAt || a.createdAt;
      const bDate = b?.lastMessage?.createdAt || b.createdAt;
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    });

  return (
    <ScreenWrapper showPattern={true} bgOpacity={0.4}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Typo
              color={colors.neutral200}
              size={19}
              textProps={{ numberOfLines: 1 }}
            >
              Welcome back,{" "}
              <Typo size={20} color={colors.white} fontWeight={"800"}>
                {currentUser?.name}
              </Typo>{" "}
              🤙
            </Typo>
          </View>
          <TouchableOpacity
            style={styles.settingIcon}
            onPress={() => router.push("/(main)/profileModal")}
          >
            <Icons.GearSix
              color={colors.white}
              weight="fill"
              size={verticalScale(22)}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.content}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: spacingY._20 }}
          >
            <View style={styles.navBar}>
              <View style={styles.tabs}>
                <TouchableOpacity
                  onPress={() => setSelectedTab(0)}
                  style={[
                    styles.tabStyle,
                    selectedTab === 0 && styles.activeTabStyle,
                  ]}
                >
                  <Typo>Direct Messages</Typo>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setSelectedTab(1)}
                  style={[
                    styles.tabStyle,
                    selectedTab === 1 && styles.activeTabStyle,
                  ]}
                >
                  <Typo>Groups</Typo>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.conversationList}>
              {selectedTab === 0 &&
                directConversations.map((item: ConversationProps, index) => {
                  return (
                    <ConversationItem
                      item={item}
                      key={index}
                      router={router}
                      showDivider={directConversations.length !== index + 1}
                    />
                  );
                })}
              {selectedTab === 1 &&
                groupConversations.map((item: any, index) => {
                  return (
                    <ConversationItem
                      item={item}
                      key={index}
                      router={router}
                      showDivider={groupConversations.length !== index + 1}
                    />
                  );
                })}
            </View>
            {!loading &&
              selectedTab === 0 &&
              directConversations.length === 0 && (
                <Typo style={{ textAlign: "center" }}>
                  You don{"'"}t have any messages
                </Typo>
              )}
            {!loading &&
              selectedTab === 1 &&
              groupConversations.length === 0 && (
                <Typo style={{ textAlign: "center" }}>
                  You haven{"'"}t join any group yet
                </Typo>
              )}
            {loading && <Loading />}
          </ScrollView>
        </View>
      </View>

      <Button
        style={styles.floatingButton}
        onPress={() =>
          router.push({
            pathname: "/(main)/newConversationModal",
            params: { isGroup: selectedTab },
          })
        }
      >
        <Icons.Plus
          color={colors.black}
          weight="bold"
          size={verticalScale(20)}
        />
      </Button>
    </ScreenWrapper>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacingX._20,
    paddingTop: spacingY._15,
    paddingBottom: spacingY._20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  navBar: {
    flexDirection: "row",
    gap: spacingX._15,
    alignItems: "center",
    paddingHorizontal: spacingX._10,
  },
  tabs: {
    flexDirection: "row",
    gap: spacingX._15,
    alignItems: "center",
  },
  tabStyle: {
    paddingVertical: spacingY._10,
    paddingHorizontal: spacingX._20,
    borderRadius: radius.full,
    backgroundColor: colors.neutral100,
  },
  activeTabStyle: {
    backgroundColor: colors.primaryLight,
  },
  conversationList: {
    paddingVertical: spacingY._20,
  },
  settingIcon: {
    padding: spacingY._10,
    backgroundColor: colors.neutral700,
    borderRadius: radius.full,
  },
  floatingButton: {
    height: verticalScale(50),
    width: verticalScale(50),
    borderRadius: 100,
    position: "absolute",
    bottom: verticalScale(30),
    right: verticalScale(30),
  },
});
